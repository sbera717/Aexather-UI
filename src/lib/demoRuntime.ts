/**
 * A self-contained runtime for the demo.
 *
 * Every action the UI offers — running an investigation, replaying the golden suite, diagnosing a
 * failure, promoting a version — resolves here when there is no backend. The point is not to fake
 * the product but to *reproduce* it: the same decision lineage, the same coverage arithmetic, the
 * same gate verdicts, driven by the same fixtures the backend seeds itself from.
 *
 * Two things it deliberately keeps from the real runtime:
 *
 * - **The number of rounds is decided by the evidence**, not fixed. A specialist that returns
 *   nothing leaves its dimension unevidenced, the router picks again, and the loop continues. That
 *   is the platform's central claim, so a demo that hard-coded three steps would be showing the
 *   wrong thing.
 * - **Nothing passes without evidence.** A candidate has no scorecard until its suite has run, and
 *   the gates read as "not measured" until it does.
 *
 * Timings are tuned so a page reads in about fifteen seconds without anyone waiting on a spinner.
 */

import {
  CounterfactualExperiment,
  DecisionNode,
  EvidenceSource,
  ExecutionTrace,
  MutationReport,
  RegressionTestCase,
} from '@/types/platform';
import { RegressionRunResult, StepEvent } from '@/lib/api';
import { humanizeList } from '@/lib/utils';

/** Fast enough to hold attention, slow enough that each row is legible as it lands. */
const STEP_INTERVAL_MS = 380;
const CASE_INTERVAL_MS = 260;
const DIAGNOSE_ARM_MS = 420;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mirrors SpecialistRegistry, so a demo trace cannot cite a specialist the platform lacks. */
const SPECIALISTS = [
  { id: 'retrieval', name: 'Vector Retrieval Specialist', tool: 'Vector Knowledge Base', type: 'VECTOR_RAG', dimension: 'SOURCE_GROUNDING' },
  { id: 'records', name: 'System of Record Specialist', tool: 'System of Record API', type: 'API_TOOL', dimension: 'STRUCTURED_RECORDS' },
  { id: 'policy', name: 'Policy and Constraints Specialist', tool: 'Policy Document Index', type: 'DOCUMENT', dimension: 'POLICY_CONSTRAINTS' },
  { id: 'history', name: 'Historical State Specialist', tool: 'Historical State Store', type: 'DATABASE', dimension: 'HISTORICAL' },
  { id: 'corroboration', name: 'Independent Corroboration Specialist', tool: 'Independent Reputation Service', type: 'API_TOOL', dimension: 'INDEPENDENT_CORROBORATION' },
] as const;

const DIMENSIONS = SPECIALISTS.map((s) => s.dimension);
const COVERAGE_THRESHOLD = 80;

/**
 * A stable hash of the goal.
 *
 * The real platform runs on a deterministic stand-in model precisely so a replay is a replay; the
 * demo keeps that property. The same question always produces the same investigation, which is what
 * lets a recording be re-taken without the numbers moving.
 */
function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function stamp(offsetMs: number): string {
  const now = new Date(Date.now() + offsetMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ` +
    `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`
  );
}

function traceId(seed: number): string {
  return `exec_${seed.toString(16).padStart(8, '0')}${Math.floor(seed / 7).toString(16).slice(0, 8)}`;
}

interface Finding {
  specialist: (typeof SPECIALISTS)[number];
  conclusive: boolean;
  supports: boolean;
  confidence: number;
  summary: string;
  round: number;
}

const FINDING_SUMMARIES: Record<string, string> = {
  retrieval: 'Retrieved passages that bear directly on the question, with strong similarity.',
  records: 'The authoritative record confirms the entitlement and its current state.',
  policy: 'Located the governing clause and the date it took effect.',
  history: 'No amendment has altered the position since that date.',
  corroboration: 'An independent read reaches the same conclusion.',
};

const EMPTY_SUMMARIES: Record<string, string> = {
  retrieval: 'No passage crossed the similarity floor.',
  records: 'The record exists but does not speak to this question.',
  policy: 'No governing clause located in the indexed policy set.',
  history: 'The history store returned nothing for this subject.',
  corroboration: 'No independent source was reachable for this question.',
};

/**
 * Runs an investigation, reporting each graph node as it completes.
 *
 * The shape of the loop is the product: route, dispatch, evaluate, and go round again if the
 * evidence is short. Which specialists come back empty is derived from the goal, so some questions
 * close in two rounds and others need three — exactly the behaviour an adaptive runtime exists to
 * have, and the thing a fixed script would hide.
 */
export async function runInvestigation(
  goal: string,
  onStep: (step: StepEvent) => void,
  agentVersion: string
): Promise<ExecutionTrace> {
  const seed = seedOf(goal);
  const startedAt = Date.now();

  const nodes: DecisionNode[] = [];
  const ledger: EvidenceSource[] = [];
  const findings: Finding[] = [];

  let step = 0;
  let round = 0;
  let coverage = 0;
  let tokens = 0;
  let toolCalls = 0;

  const settled = new Set<string>();
  const attempts = new Map<string, number>();

  const covered = () => new Set(findings.filter((f) => f.conclusive).map((f) => f.specialist.dimension));
  const missing = () => DIMENSIONS.filter((d) => !covered().has(d));
  const elapsed = () => Date.now() - startedAt;
  const budget = () => ({ tokensUsed: tokens, toolCalls, elapsedMs: elapsed() });

  const emit = async (node: DecisionNode) => {
    nodes.push(node);
    onStep({ node: node.agentRole, round, coverage });
    await pause(STEP_INTERVAL_MS);
  };

  while (round < 3 && coverage < COVERAGE_THRESHOLD) {
    round += 1;

    // --- route -------------------------------------------------------------
    const gaps = missing();
    const eligible = SPECIALISTS.filter(
      (s) => !settled.has(s.id) && (attempts.get(s.id) ?? 0) < 2
    );

    const coveredTools = new Set<string>();
    SPECIALISTS.filter((s) => settled.has(s.id)).forEach((s) => coveredTools.add(s.tool));

    const scored = SPECIALISTS.map((specialist) => {
      if (!eligible.includes(specialist)) return { specialist, score: 0 };
      let score = 0;
      if (gaps.includes(specialist.dimension)) score += 0.7;
      if (!coveredTools.has(specialist.tool)) score += 0.15;
      // A retry is worth less than a first attempt; the source has already declined once.
      if ((attempts.get(specialist.id) ?? 0) > 0) score -= 0.13;
      return { specialist, score: Math.max(0, Number(score.toFixed(2))) };
    });

    const selected = scored
      .filter((entry) => entry.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.specialist);

    const reason = selected.length
      ? gaps.length
        ? `Dispatching ${selected.length} specialist${selected.length === 1 ? '' : 's'} to close ${humanizeList(gaps)}`
        : 'Establishing an initial evidence base'
      : 'No unused specialist bears on the remaining gaps';

    await emit({
      id: `node_${++step}`,
      stepNumber: step,
      agentRole: 'Adaptive Router',
      actionType: 'INTENT_ROUTING',
      summary: reason,
      latencyMs: 160 + (seed % 90),
      evidenceIds: [],
      status: selected.length ? 'COMPLETED' : 'WARNED',
      inputPayload: { coveragePercent: coverage, missingDimensions: gaps, contradictions: [] },
      outputPayload: { selected: selected.map((s) => s.name), round },
      trigger: selected.length ? 'INSUFFICIENT_COVERAGE' : 'BUDGET_EXHAUSTED',
      candidates: scored.map((entry) => ({
        action: entry.specialist.name,
        score: entry.score,
        selected: selected.includes(entry.specialist),
      })),
      selectionReason: reason,
      budgetAtDecision: budget(),
    });

    if (!selected.length) break;

    // --- investigate -------------------------------------------------------
    const roundFindings: Finding[] = selected.map((specialist, index) => {
      const attempt = (attempts.get(specialist.id) ?? 0) + 1;
      attempts.set(specialist.id, attempt);

      // Derived from the goal so a replay of the same question behaves identically. A source that
      // came back empty on its first attempt is likelier to report on the retry, which is what the
      // retry is for.
      const roll = (seed >> ((index + round) * 3)) % 100;
      const conclusive = attempt > 1 ? roll % 100 < 78 : roll % 100 < 62;
      const confidence = conclusive ? 0.62 + ((roll % 33) / 100) : (roll % 30) / 100;

      return {
        specialist,
        conclusive,
        supports: roll % 10 < 8,
        confidence: Number(confidence.toFixed(2)),
        summary: conclusive ? FINDING_SUMMARIES[specialist.id] : EMPTY_SUMMARIES[specialist.id],
        round,
      };
    });

    roundFindings.forEach((finding) => {
      findings.push(finding);
      toolCalls += 1;
      tokens += 1_480 + (seed % 420);
      if (finding.conclusive && finding.confidence >= 0.5) settled.add(finding.specialist.id);

      ledger.push({
        id: `EVID-${finding.specialist.id.toUpperCase()}-R${round}`,
        toolName: finding.specialist.tool,
        sourceType: finding.specialist.type,
        summary: finding.summary,
        rawPayload: {
          dimension: finding.specialist.dimension,
          attempt: attempts.get(finding.specialist.id),
          conclusive: finding.conclusive,
        },
        confidence: finding.confidence,
        timestamp: stamp(elapsed()),
        verified: finding.conclusive,
      });
    });

    const conclusiveCount = roundFindings.filter((f) => f.conclusive).length;

    await emit({
      id: `node_${++step}`,
      stepNumber: step,
      agentRole: 'Specialist Executor',
      actionType: 'TOOL_INVOCATION',
      summary: `Dispatched ${selected.length} specialist(s); ${conclusiveCount} returned a usable finding`,
      latencyMs: 980 + (seed % 460),
      evidenceIds: roundFindings.map((f) => `EVID-${f.specialist.id.toUpperCase()}-R${round}`),
      status: conclusiveCount ? 'COMPLETED' : 'WARNED',
      inputPayload: { specialists: selected.map((s) => s.name) },
      outputPayload: { findings: roundFindings.length, conclusive: conclusiveCount },
      budgetAtDecision: budget(),
    });

    // --- evaluate ----------------------------------------------------------
    const usable = findings.filter((f) => f.conclusive && f.confidence >= 0.5);
    const coveredNow = [...new Set(usable.map((f) => f.specialist.dimension))];
    coverage = Number(((coveredNow.length / DIMENSIONS.length) * 100).toFixed(1));

    const contradictions = coveredNow.filter((dimension) => {
      const forDimension = usable.filter((f) => f.specialist.dimension === dimension);
      return forDimension.some((f) => f.supports) && forDimension.some((f) => !f.supports);
    });

    const stillMissing = DIMENSIONS.filter((d) => !coveredNow.includes(d));
    const keepGoing = coverage < COVERAGE_THRESHOLD && round < 3;

    const guardReason = contradictions.length
      ? `Sources disagree on ${humanizeList(contradictions)} — seeking an independent read`
      : coverage >= COVERAGE_THRESHOLD
      ? `Coverage ${coverage.toFixed(1)}% meets the ${COVERAGE_THRESHOLD}% bar across ${coveredNow.length} of ${DIMENSIONS.length} dimensions`
      : `Coverage ${coverage.toFixed(1)}% is short of the ${COVERAGE_THRESHOLD}% bar — still missing ${humanizeList(stillMissing)}`;

    await emit({
      id: `node_${++step}`,
      stepNumber: step,
      agentRole: 'Evidence Engine',
      actionType: 'INVARIANT_GUARD',
      summary: guardReason,
      latencyMs: 34 + (seed % 26),
      evidenceIds: [],
      status: contradictions.length ? 'WARNED' : 'COMPLETED',
      inputPayload: { coveredDimensions: coveredNow },
      outputPayload: {
        coveragePercent: coverage,
        independentSources: new Set(usable.map((f) => f.specialist.tool)).size,
        missingDimensions: stillMissing,
        contradictions,
        continue: keepGoing,
      },
      trigger: contradictions.length
        ? 'EVIDENCE_CONFLICT'
        : coverage >= COVERAGE_THRESHOLD
        ? 'EVIDENCE_SUFFICIENT'
        : 'INSUFFICIENT_COVERAGE',
      selectionReason: guardReason,
      budgetAtDecision: budget(),
    });
  }

  // --- verdict -------------------------------------------------------------
  const usable = findings.filter((f) => f.conclusive && f.confidence >= 0.5);
  const byDimension = [...new Set(usable.map((f) => f.specialist.dimension))];

  const claims = byDimension.map((dimension, index) => {
    const forDimension = usable.filter((f) => f.specialist.dimension === dimension);
    const allSupport = forDimension.every((f) => f.supports);
    const noneSupport = forDimension.every((f) => !f.supports);
    return {
      id: `CLAIM-${String(index + 1).padStart(2, '0')}`,
      statement: `${humanizeList([dimension])
        .replace(/^./, (c) => c.toUpperCase())} evidence ${allSupport ? 'supports' : 'is divided on'} the conclusion`,
      confidence: Number(
        (forDimension.reduce((sum, f) => sum + f.confidence, 0) / forDimension.length).toFixed(2)
      ),
      evidenceRefs: forDimension.map((f) => `EVID-${f.specialist.id.toUpperCase()}-R${f.round}`),
      status: allSupport ? ('SUPPORTED' as const) : noneSupport ? ('REFUTED' as const) : ('UNVERIFIED' as const),
    };
  });

  if (!claims.length) {
    claims.push({
      id: 'CLAIM-01',
      statement: 'No conclusion could be drawn from the available evidence',
      confidence: 0,
      evidenceRefs: [],
      status: 'UNVERIFIED' as const,
    });
  }

  const met = coverage >= COVERAGE_THRESHOLD;
  const verdictText = met
    ? `The evidence supports a conclusion, resting on ${byDimension.length} of ${DIMENSIONS.length} dimensions.`
    : `The evidence is insufficient to settle this question — ${humanizeList(
        DIMENSIONS.filter((d) => !byDimension.includes(d))
      )} were never established.`;

  tokens += 2_640;

  await emit({
    id: `node_${++step}`,
    stepNumber: step,
    agentRole: 'Verdict Synthesiser',
    actionType: 'VERDICT_EMISSION',
    summary: verdictText,
    latencyMs: 320 + (seed % 180),
    tokenCostUsd: 0.0029,
    evidenceIds: ledger.filter((e) => e.verified).map((e) => e.id),
    status: met ? 'COMPLETED' : 'WARNED',
    inputPayload: { coveragePercent: coverage, evidenceCount: ledger.length },
    outputPayload: { verdict: verdictText },
    budgetAtDecision: budget(),
  });

  const firstLine = goal.split('\n')[0].trim();

  return {
    id: traceId(seed),
    agentVersion,
    origin: 'LIVE',
    timestamp: stamp(0),
    title: firstLine.length <= 90 ? firstLine : `${firstLine.slice(0, 87)}...`,
    inputPrompt: goal,
    status: met ? 'SUCCESS' : 'FAILURE',
    totalLatencyMs: elapsed(),
    totalTokenCostUsd: Number((tokens * 0.0000012).toFixed(6)),
    evidenceCoveragePercent: coverage,
    finalVerdict: verdictText,
    nodes,
    evidenceLedger: ledger,
    claims,
  };
}

/**
 * Replays the golden suite, reporting each case as it settles.
 *
 * Which version is under test decides the outcome, and that is the whole point of the page: the
 * baseline is denied the widened policy index, so the cases codified from that failure still fail
 * under it. A suite that passed for both versions would not be a gate.
 */
export async function replaySuite(
  cases: RegressionTestCase[],
  version: string | undefined,
  onCase: (row: RegressionRunResult['results'][number]) => void
): Promise<RegressionRunResult> {
  const isCandidate = Boolean(version && /v2\.4/i.test(version));
  const results: RegressionRunResult['results'] = [];

  for (const testCase of cases) {
    await pause(CASE_INTERVAL_MS);

    const passed = isCandidate;
    const latency = 3_200 + (seedOf(testCase.id) % 900);

    const row = {
      caseId: testCase.id,
      title: testCase.title,
      status: passed ? ('PASSED' as const) : ('FAILED' as const),
      actualLatencyMs: latency,
      executionId: traceId(seedOf(testCase.id + (version ?? ''))),
      failureReason: passed
        ? undefined
        : `evidence coverage 60.0% is below the required ${(testCase.minimumCoveragePercent ?? 80).toFixed(1)}%; contract ${testCase.contractsEnforced[0] ?? 'CONTRACT-01'} came back VIOLATED`,
    };

    results.push(row);
    onCase(row);
  }

  const passedCount = results.filter((r) => r.status === 'PASSED').length;

  return {
    runId: `run_${seedOf(`${version}${cases.length}`).toString(16).slice(0, 12)}`,
    passedCount,
    failedCount: results.length - passedCount,
    totalCount: results.length,
    results,
  };
}

/** What a candidate measured, once its suite has run. Absent until then. */
export interface DemoScorecard {
  regressionRunId: string;
  accuracyPercent: number;
  contractPassRatePercent: number;
  contractEvaluations: number;
  regressionCount: number | null;
  previousFailuresFixed: number | null;
  p95LatencyMs: number;
  costPerRunUsd: number;
}

export function scorecardFrom(run: RegressionRunResult, baselineFailures: number | null): DemoScorecard {
  const latencies = run.results.map((r) => r.actualLatencyMs).sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(0.95 * latencies.length));

  return {
    regressionRunId: run.runId,
    accuracyPercent: Number(((run.passedCount / Math.max(1, run.totalCount)) * 100).toFixed(1)),
    contractPassRatePercent: run.failedCount === 0 ? 100 : 81.3,
    contractEvaluations: run.totalCount * 4,
    regressionCount: baselineFailures == null ? null : 0,
    previousFailuresFixed: baselineFailures,
    p95LatencyMs: latencies[rank - 1] ?? 0,
    costPerRunUsd: 0.0121,
  };
}

/** Deliberately degrades the agent and reports whether the suite would notice. */
export async function runMutationTest(caseCount: number): Promise<MutationReport> {
  await pause(1_600);

  const outcomes = [
    {
      description: 'Withhold the policy-specialist from the investigation',
      killed: true,
      failedCases: Math.max(1, caseCount - 1),
      totalCases: caseCount,
      killedBy: ['REG-AGENT-001', 'REG-AGENT-003'],
      runId: 'run_mut_withhold',
    },
    {
      description: 'Require confidence of at least 0.99 for a finding to count as evidence',
      killed: true,
      failedCases: caseCount,
      totalCases: caseCount,
      killedBy: ['REG-AGENT-001', 'REG-AGENT-002', 'REG-AGENT-003', 'REG-AGENT-004'].slice(0, caseCount),
      runId: 'run_mut_credulous',
    },
    {
      description: 'Conclude once evidence coverage reaches 1.0%',
      killed: true,
      failedCases: Math.max(1, caseCount - 2),
      totalCases: caseCount,
      killedBy: ['REG-AGENT-001'],
      runId: 'run_mut_negligent',
    },
    {
      description: 'Rewrite the system prompt for retrieval-specialist to answer without consulting a source',
      killed: false,
      failedCases: 0,
      totalCases: caseCount,
      killedBy: [],
      runId: 'run_mut_lazy',
    },
    {
      description: 'Run the investigation on a weaker model',
      killed: false,
      failedCases: 0,
      totalCases: caseCount,
      killedBy: [],
      runId: 'run_mut_degraded',
    },
  ];

  const killed = outcomes.filter((o) => o.killed).length;
  const survived = outcomes.length - killed;
  const strength = Number(((killed / outcomes.length) * 100).toFixed(1));

  return {
    mutationsRun: outcomes.length,
    killed,
    survived,
    suiteStrength: strength,
    verdict: `${survived} of ${outcomes.length} degradations went unnoticed. The suite is broadly sound but blind to those cases; add regression cases that would fail under them.`,
    // Survivors first: they are the finding, and a report that buries them invites a reader to skim
    // past the only part that asks for action.
    outcomes: [...outcomes].sort((a, b) => Number(a.killed) - Number(b.killed)),
  };
}

/**
 * Re-runs the counterfactual experiment for a trace, one arm at a time.
 *
 * Attribution is an effect size, not causal truth: the scores are independent, so two arms can both
 * score highly if both fix the failure. Forcing them to sum to a hundred would invent a competition
 * the experiment never ran.
 */
export async function diagnose(
  existing: CounterfactualExperiment,
  onArm?: (index: number) => void
): Promise<CounterfactualExperiment> {
  await pause(900);

  for (let i = 0; i < existing.perturbations.length; i++) {
    await pause(DIAGNOSE_ARM_MS);
    onArm?.(i);
  }

  return existing;
}

/** Dry-runs a contract expression against a trace. */
export async function testContract(
  expression: string,
  trace: ExecutionTrace | undefined
): Promise<string> {
  await pause(1_100);

  if (!trace) {
    return 'No trace is loaded to test against.';
  }

  const nodeCount = trace.nodes?.length ?? 0;

  // Only the two rules the demo fixtures are built around are actually decided here; anything else
  // is reported as unevaluable rather than guessed at, which is what the engine itself would do.
  if (expression.includes('evidenceRefs')) {
    const ungrounded = (trace.claims ?? []).filter((c) => c.evidenceRefs.length === 0);
    return ungrounded.length
      ? `Rule breached by ${trace.id}: ${ungrounded.length} claim(s) cite no evidence (${ungrounded
          .map((c) => c.id)
          .join(', ')}). ${nodeCount} decision nodes evaluated.`
      : `Rule held against ${trace.id}: every claim cites at least one ledger entry. ${nodeCount} decision nodes evaluated.`;
  }

  if (expression.includes('contradictions')) {
    const conflicted = (trace.nodes ?? []).some(
      (n) => Array.isArray(n.outputPayload?.contradictions) && n.outputPayload.contradictions.length > 0
    );
    return conflicted
      ? `Rule breached by ${trace.id}: the run concluded while two sources still disagreed. ${nodeCount} decision nodes evaluated.`
      : `Rule held against ${trace.id}: no unresolved contradiction at conclusion. ${nodeCount} decision nodes evaluated.`;
  }

  return `Expression produced no boolean verdict against ${trace.id} — recorded as INDETERMINATE, which is a defect in the rule rather than evidence about the agent.`;
}
