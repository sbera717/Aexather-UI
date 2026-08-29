export type TraceStatus = 'SUCCESS' | 'FAILURE' | 'CONTRACT_VIOLATION' | 'RUNNING';

export interface EvidenceSource {
  id: string;
  toolName: string;
  sourceType: 'VECTOR_RAG' | 'API_TOOL' | 'DATABASE' | 'DOCUMENT' | 'SANDBOX_LOG';
  summary: string;
  rawPayload: Record<string, any>;
  confidence: number;
  timestamp: string;
  verified: boolean;
}

export interface Claim {
  id: string;
  statement: string;
  confidence: number;
  evidenceRefs: string[];
  status: 'SUPPORTED' | 'REFUTED' | 'UNVERIFIED';
}

/** One action the router weighed at a decision point, with the score it was ranked by. */
export interface CandidateAction {
  action: string;
  score: number;
  selected: boolean;
}

/** Resource consumption at the moment a decision was taken. */
export interface BudgetSnapshot {
  tokensUsed: number;
  toolCalls: number;
  elapsedMs: number;
}

export interface DecisionNode {
  id: string;
  stepNumber: number;
  agentRole: string;
  actionType: 'INTENT_ROUTING' | 'TASK_PLANNING' | 'TOOL_INVOCATION' | 'INVARIANT_GUARD' | 'VERDICT_EMISSION';
  summary: string;
  latencyMs: number;
  /** Absent on nodes that made no model call. */
  tokenCostUsd?: number;
  evidenceIds: string[];
  status: 'COMPLETED' | 'WARNED' | 'FAILED';
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  childrenIds?: string[];

  /*
   * Decision lineage. The backend records why a step was taken, not only that it was; these are
   * absent on mock fixtures and on traces produced before the runtime captured them.
   */
  trigger?: string;
  candidates?: CandidateAction[];
  selectionReason?: string;
  policyRuleId?: string;
  budgetAtDecision?: BudgetSnapshot;
}

/**
 * What produced a trace. Only LIVE runs are the agent answering someone; the rest are the
 * platform's own traffic — baseline replays, experiment arms, regression and mutation rounds —
 * and are excluded from the trace feed and every dashboard figure unless asked for.
 */
export type ExecutionOrigin = 'LIVE' | 'REPLAY' | 'ARM' | 'REGRESSION' | 'MUTATION';

export interface ExecutionTrace {
  id: string;
  agentVersion: string;
  /** Absent on fixtures and on traces recorded before origins existed; both read as LIVE. */
  origin?: ExecutionOrigin;
  timestamp: string;
  title: string;
  inputPrompt: string;
  status: TraceStatus;
  totalLatencyMs: number;
  totalTokenCostUsd: number;
  evidenceCoveragePercent: number;
  finalVerdict: string;
  nodes: DecisionNode[];
  evidenceLedger: EvidenceSource[];
  claims: Claim[];
  contractViolations?: string[];
}

export interface BehavioralContract {
  id: string;
  title: string;
  description: string;
  expression: string; // CEL / Invariant policy
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  /**
   * Passes over *decided* evaluations. Null means the contract has judged nothing yet — it has
   * neither passed nor failed anything, and reporting 100% for it would be a claim with no
   * evidence behind it.
   */
  passRatePercent: number | null;
  /** Decided evaluations behind the rate. */
  evaluationsCount: number;
  /** Evaluations that could not produce a verdict, excluded from the rate. */
  indeterminateCount?: number;
  lastViolatedAt?: string;
}

export interface Perturbation {
  id: string;
  type: 'TOOL_INJECTION' | 'PROMPT_MUTATION' | 'MODEL_SWAP' | 'CONTEXT_COMPRESSION';
  description: string;
  diffSummary: string;
  resultingStatus: TraceStatus;
  verdict: string;
  attributionScorePercent: number;
  isFix: boolean;
}

export interface CounterfactualExperiment {
  id: string;
  originalTraceId: string;
  failureDescription: string;
  originalVerdict: string;
  expectedVerdict: string;
  hypothesizedCause: string;
  perturbations: Perturbation[];
  recommendedFix: string;
  status: 'DIAGNOSED' | 'EXPERIMENTING' | 'RESOLVED';
}

export interface RegressionTestCase {
  id: string;
  originExecutionId: string;
  title: string;
  inputQuery: string;
  expectedOutcome: string;
  contractsEnforced: string[];
  /** NOT_RUN for a case that has never been replayed — it has not passed, and has not failed. */
  lastRunStatus: 'PASSED' | 'FAILED' | 'NOT_RUN';
  latencyTargetMs: number;
  addedDate: string;
  /** The status a replay must reach; absent on cases written before assertions were structured. */
  expectedStatus?: TraceStatus;
  /** Evidence coverage a replay must reach. */
  minimumCoveragePercent?: number;
}

export interface CandidateVersion {
  version: string;
  createdAt: string;
  status: 'PRODUCTION' | 'CANDIDATE' | 'REJECTED' | 'ROLLED_BACK';
  /*
   * The release scorecard is measured from the traces of this version's latest regression run.
   * Every figure is nullable and null means *not measured*, never zero — a version nobody has run
   * the suite against has no scorecard, and a zero there would read as a measurement.
   */
  regressionRunId?: string | null;
  accuracyPercent: number | null;
  contractPassRatePercent: number | null;
  /** Decided contract evaluations behind that rate. */
  contractEvaluations?: number;
  regressionCount: number | null;
  previousFailuresFixed: number | null;
  p95LatencyMs: number | null;
  costPerRunUsd: number | null;
  changesSummary: string[];
  shadowComparison?: {
    totalEvaluations: number;
    agreementRatePercent: number;
    latencyDeltaMs: number;
    costDeltaPercent: number;
  };
}


/* ------------------------------------------------------------------ *
 * Platform read models that have no fixture counterpart.
 * ------------------------------------------------------------------ */

/** Landing-dashboard roll-up. Every figure describes live traffic only. */
export interface DashboardSummary {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  contractViolationCount: number;
  runningCount: number;
  avgEvidenceCoveragePercent: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  activeContracts: number;
  overallContractPassRatePercent: number | null;
  contractEvaluations: number;
  regressionCaseCount: number;
  regressionPassingCount: number;
  regressionFailingCount: number;
  productionVersion: string | null;
  candidateCount: number;
  recentFailures: TraceSummary[];
}

/** The trace-list projection: scalars only, without the graph, ledger or claims. */
export type TraceSummary = Omit<
  ExecutionTrace,
  'nodes' | 'evidenceLedger' | 'claims' | 'contractViolations'
>;

/** Where the regression suite stands, without re-running it. */
export interface RegressionSummary {
  totalCases: number;
  passingCases: number;
  failingCases: number;
  /** Cases that have never been replayed. Not the same as failing. */
  notRunCases: number;
  lastRunVersion: string | null;
  lastRunId: string | null;
}

export type JobState = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

/** Returned with 202 by the endpoints that take minutes rather than seconds. */
export interface JobHandle {
  jobId: string;
  kind: string;
  state: JobState;
  statusUrl: string;
}

export interface JobStatus<T> {
  jobId: string;
  kind: string;
  state: JobState;
  startedAt: string;
  completedAt?: string;
  /** The payload the synchronous endpoint would have returned; present once SUCCEEDED. */
  result?: T;
  error?: string;
}

/** Whether the evaluation suite would notice a deliberately broken agent. */
export interface MutationOutcome {
  description: string;
  killed: boolean;
  failedCases: number;
  totalCases: number;
  killedBy: string[];
  runId: string;
}

export interface MutationReport {
  mutationsRun: number;
  killed: number;
  survived: number;
  suiteStrength: number;
  verdict: string;
  outcomes: MutationOutcome[];
}
