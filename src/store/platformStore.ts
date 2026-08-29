import { create } from 'zustand';
import {
  BehavioralContract,
  CandidateVersion,
  CounterfactualExperiment,
  DashboardSummary,
  ExecutionTrace,
  MutationReport,
  RegressionSummary,
  RegressionTestCase,
} from '@/types/platform';
import {
  DEMO_TRACES,
  DEMO_CONTRACTS,
  DEMO_COUNTERFACTUAL,
  DEMO_REGRESSION_TESTS,
  DEMO_CANDIDATES,
} from '@/data/demoData';
import * as demo from '@/lib/demoRuntime';
import {
  ApiError,
  candidatesApi,
  contractsApi,
  CreateContractPayload,
  CreateRegressionCasePayload,
  dashboardApi,
  executionsApi,
  experimentsApi,
  isBackendReachable,
  jobsApi,
  regressionsApi,
  RegressionRunResult,
  StepEvent,
  tracesApi,
} from '@/lib/api';

/**
 * Where the data on screen came from.
 *
 * `mock` is not a failure state. The bundled fixtures are what the platform was designed against
 * and they make every page legible with no backend running — but a figure read from them is a
 * fixture, not a measurement, and the UI says so rather than letting the two look alike.
 */
export type DataSource = 'mock' | 'live';

export type ConnectionState = 'connecting' | 'live' | 'offline';

interface PlatformState {
  traces: ExecutionTrace[];
  selectedTraceId: string;
  selectedNodeId: string | null;
  contracts: BehavioralContract[];
  counterfactual: CounterfactualExperiment;
  regressionSuites: RegressionTestCase[];
  regressionSummary: RegressionSummary | null;
  candidates: CandidateVersion[];
  dashboard: DashboardSummary | null;
  isCommandPaletteOpen: boolean;
  /** True while a selected trace's graph is being fetched. */
  isTraceLoading: boolean;

  dataSource: DataSource;
  connection: ConnectionState;
  /** Why the last live call failed, when one did. Null while things are working. */
  lastError: string | null;

  // Actions
  setSelectedTraceId: (traceId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;

  /** Loads everything from the backend, falling back to the fixtures when it is unreachable. */
  hydrate: () => Promise<void>;
  /** Re-reads the collections the given page depends on, after a mutation. */
  refreshContracts: () => Promise<void>;
  refreshRegressions: () => Promise<void>;
  refreshCandidates: () => Promise<void>;
  refreshTraces: () => Promise<void>;

  toggleContractStatus: (contractId: string) => Promise<void>;
  addContract: (payload: CreateContractPayload) => Promise<BehavioralContract>;
  testContract: (contractId: string, traceId?: string) => Promise<string>;
  addRegressionCase: (payload: CreateRegressionCasePayload) => Promise<RegressionTestCase>;
  codifyFailure: (executionId: string) => Promise<RegressionTestCase>;
  runRegressionSuite: (
    agentVersion?: string,
    onCase?: (row: RegressionRunResult['results'][number]) => void
  ) => Promise<RegressionRunResult>;
  runMutationTest: () => Promise<MutationReport>;
  promoteCandidate: (version: string) => Promise<void>;
  rollbackVersion: (version: string) => Promise<void>;
  startInvestigation: (
    goal: string,
    onStep?: (step: StepEvent) => void,
    agentVersion?: string
  ) => Promise<ExecutionTrace>;
  diagnoseTrace: (traceId: string, onArm?: (index: number) => void) => Promise<CounterfactualExperiment>;
}

/** A backend refusal carries a message worth showing; anything else is reported as itself. */
function describe(error: unknown): string {
  if (error instanceof ApiError) {
    return error.body?.message ?? error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  /*
   * Seeded from the demo fixtures so the first paint is complete and every page renders before any
   * network call resolves. They mirror the backend's own seed set, so the offline view tells the
   * same story the live one does. `hydrate` replaces them when the backend answers.
   */
  traces: DEMO_TRACES,
  selectedTraceId: DEMO_TRACES[0].id,
  selectedNodeId: DEMO_TRACES[0].nodes[0].id,
  contracts: DEMO_CONTRACTS,
  counterfactual: DEMO_COUNTERFACTUAL,
  regressionSuites: DEMO_REGRESSION_TESTS,
  regressionSummary: null,
  candidates: DEMO_CANDIDATES,
  dashboard: null,
  isCommandPaletteOpen: false,
  isTraceLoading: false,

  dataSource: 'mock',
  connection: 'connecting',
  lastError: null,

  /**
   * Selects a trace, fetching its detail if only the list projection is loaded.
   *
   * The list endpoint returns scalars — no graph, ledger or claims — because a feed of full traces
   * would carry every decision payload for every row. The studio needs all of it, so the detail is
   * pulled once, on selection, and kept.
   */
  setSelectedTraceId: (traceId) => {
    const existing = get().traces.find((t) => t.id === traceId);
    set({
      selectedTraceId: traceId,
      selectedNodeId: existing?.nodes?.[0]?.id ?? null,
    });

    if (get().dataSource !== 'live' || existing?.nodes?.length) {
      return;
    }

    set({ isTraceLoading: true });
    void tracesApi
      .get(traceId)
      .then((full) => {
        set((state) => ({
          traces: state.traces.map((t) => (t.id === traceId ? full : t)),
          // Guard against a second selection having landed while this was in flight.
          selectedNodeId:
            state.selectedTraceId === traceId ? full.nodes?.[0]?.id ?? null : state.selectedNodeId,
        }));
      })
      .catch((error) => set({ lastError: describe(error) }))
      .finally(() => set({ isTraceLoading: false }));
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  hydrate: async () => {
    /*
     * An explicit demo run does not probe for a backend at all. Waiting on a connection that is
     * never coming costs a few seconds of dead air at the exact moment someone hits record.
     */
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      set({ connection: 'offline', dataSource: 'mock', lastError: null });
      return;
    }

    if (!(await isBackendReachable())) {
      set({
        connection: 'offline',
        dataSource: 'mock',
        lastError: null,
      });
      return;
    }

    try {
      /*
       * The trace list is a scalar projection, so the first trace is fetched in full — the studio
       * needs its graph, ledger and claims, and nothing else on the page does.
       */
      const [summaries, contracts, candidates, regressionSuites, regressionSummary, dashboard, experiments] =
        await Promise.all([
          tracesApi.list(),
          contractsApi.list(),
          candidatesApi.list(),
          regressionsApi.list(),
          regressionsApi.summary(),
          dashboardApi.summary(),
          experimentsApi.list(),
        ]);

      const traces = summaries.map((summary) => ({
        ...summary,
        nodes: [],
        evidenceLedger: [],
        claims: [],
      })) as ExecutionTrace[];

      const first = traces[0]
        ? await tracesApi.get(traces[0].id).catch(() => null)
        : null;

      if (first) {
        traces[0] = first;
      }

      set({
        traces,
        selectedTraceId: first?.id ?? traces[0]?.id ?? '',
        selectedNodeId: first?.nodes?.[0]?.id ?? null,
        contracts,
        candidates,
        regressionSuites,
        regressionSummary,
        dashboard,
        counterfactual: experiments[0] ?? get().counterfactual,
        dataSource: 'live',
        connection: 'live',
        lastError: null,
      });
    } catch (error) {
      // The fixtures already in state stay put — a half-loaded page is worse than a labelled one.
      set({ connection: 'offline', dataSource: 'mock', lastError: describe(error) });
    }
  },

  refreshContracts: async () => {
    if (get().dataSource !== 'live') return;
    set({ contracts: await contractsApi.list() });
  },

  refreshRegressions: async () => {
    if (get().dataSource !== 'live') return;
    const [regressionSuites, regressionSummary] = await Promise.all([
      regressionsApi.list(),
      regressionsApi.summary(),
    ]);
    set({ regressionSuites, regressionSummary });
  },

  refreshCandidates: async () => {
    if (get().dataSource !== 'live') return;
    set({ candidates: await candidatesApi.list() });
  },

  refreshTraces: async () => {
    if (get().dataSource !== 'live') return;
    const summaries = await tracesApi.list();
    set((state) => ({
      // Keep whatever detail is already loaded; the list projection has no graph on it.
      traces: summaries.map((summary) => {
        const existing = state.traces.find((t) => t.id === summary.id);
        return existing?.nodes?.length
          ? { ...existing, ...summary }
          : ({ ...summary, nodes: [], evidenceLedger: [], claims: [] } as ExecutionTrace);
      }),
      dashboard: state.dashboard,
    }));
  },

  toggleContractStatus: async (contractId) => {
    const contract = get().contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const next = contract.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';

    if (get().dataSource !== 'live') {
      set((state) => ({
        contracts: state.contracts.map((c) =>
          c.id === contractId ? { ...c, status: next } : c
        ),
      }));
      return;
    }

    // Not optimistic: activating compiles the expression server-side and can legitimately fail,
    // and a toggle that flips back a moment later reads as a bug rather than as a rejection.
    const updated = await contractsApi.setStatus(contractId, next);
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === contractId ? updated : c)),
    }));
  },

  addContract: async (payload) => {
    if (get().dataSource !== 'live') {
      const created: BehavioralContract = {
        id: `CONTRACT-${String(get().contracts.length + 1).padStart(2, '0')}`,
        ...payload,
        status: 'DRAFT',
        passRatePercent: null,
        evaluationsCount: 0,
      };
      set((state) => ({ contracts: [created, ...state.contracts] }));
      return created;
    }

    const created = await contractsApi.create(payload);
    set((state) => ({ contracts: [created, ...state.contracts] }));
    return created;
  },

  testContract: async (contractId, traceId) => {
    if (get().dataSource !== 'live') {
      const contract = get().contracts.find((c) => c.id === contractId);
      const trace = get().traces.find((t) => t.id === (traceId ?? get().selectedTraceId));
      return demo.testContract(contract?.expression ?? '', trace);
    }

    const result = await contractsApi.test(contractId, traceId);
    if (!result.valid) {
      return result.error ?? 'The expression could not be compiled.';
    }
    if (result.passed) {
      return `Rule held against the trace (${result.matchedNodes} decision nodes evaluated).`;
    }
    return result.error ?? 'Rule was breached by the trace.';
  },

  addRegressionCase: async (payload) => {
    if (get().dataSource !== 'live') {
      const created: RegressionTestCase = {
        id: `REG-AGENT-${String(get().regressionSuites.length + 1).padStart(3, '0')}`,
        originExecutionId: payload.originExecutionId ?? '',
        title: payload.title,
        inputQuery: payload.inputQuery,
        expectedOutcome: payload.expectedOutcome,
        contractsEnforced: [payload.contractId],
        lastRunStatus: 'NOT_RUN',
        latencyTargetMs: 3500,
        addedDate: new Date().toISOString().split('T')[0],
      };
      set((state) => ({ regressionSuites: [created, ...state.regressionSuites] }));
      return created;
    }

    const created = await regressionsApi.create(payload);
    await get().refreshRegressions();
    return created;
  },

  codifyFailure: async (executionId) => {
    if (get().dataSource !== 'live') {
      const origin = get().traces.find((t) => t.id === executionId);
      return get().addRegressionCase({
        title: `Regression: ${origin?.title ?? executionId}`,
        originExecutionId: executionId,
        inputQuery: origin?.inputPrompt ?? '',
        expectedOutcome: 'Must conclude successfully with at least 80.0% evidence coverage',
        contractId: origin?.contractViolations?.[0] ?? 'CONTRACT-01',
      });
    }

    const created = await regressionsApi.createFromFailure(executionId);
    await get().refreshRegressions();
    return created;
  },

  runRegressionSuite: async (agentVersion, onCase) => {
    if (get().dataSource === 'live') {
      const result = await regressionsApi.runAll(agentVersion);
      result.results.forEach((row) => onCase?.(row));
      await get().refreshRegressions();
      await get().refreshCandidates();
      return result;
    }

    const cases = get().regressionSuites;
    const result = await demo.replaySuite(cases, agentVersion, (row) => onCase?.(row));

    /*
     * The scorecard is written only now, which is the behaviour worth showing: a candidate has no
     * measured figures until its suite has run, and the gates read as "not measured" rather than as
     * zeroes until they do.
     */
    const baseline = get().candidates.find(
      (c) => c.status === 'PRODUCTION' && c.version !== agentVersion
    );
    const baselineFailures = baseline
      ? get().candidates.find((c) => c.version === baseline.version)?.accuracyPercent === 0
        ? result.passedCount
        : null
      : null;

    const scorecard = demo.scorecardFrom(result, baselineFailures);

    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.version === agentVersion ? { ...c, ...scorecard } : c
      ),
      regressionSuites: state.regressionSuites.map((testCase) => {
        const row = result.results.find((r) => r.caseId === testCase.id);
        return row ? { ...testCase, lastRunStatus: row.status } : testCase;
      }),
      regressionSummary: {
        totalCases: result.totalCount,
        passingCases: result.passedCount,
        failingCases: result.failedCount,
        notRunCases: 0,
        lastRunVersion: agentVersion ?? null,
        lastRunId: result.runId,
      },
    }));

    return result;
  },

  runMutationTest: async () => {
    if (get().dataSource !== 'live') {
      // Case statuses are deliberately not written back: these runs break the agent on purpose, and
      // recording their results would leave the suite reporting itself as failing.
      return demo.runMutationTest(get().regressionSuites.length);
    }

    const handle = await regressionsApi.mutationTest();
    const report = await jobsApi.poll<MutationReport>(handle);
    /*
     * The suite's own standing is untouched by this — mutation rounds run with case statuses
     * deliberately not written back — but the run history behind the summary has moved, so it is
     * re-read rather than assumed.
     */
    await get().refreshRegressions();
    return report;
  },

  promoteCandidate: async (version) => {
    if (get().dataSource !== 'live') {
      const candidate = get().candidates.find((c) => c.version === version);

      /*
       * The gates are enforced here too. A demo that promoted a candidate whose scorecard it was
       * showing as "not measured" would be demonstrating the opposite of the product's argument.
       */
      const blocked: string[] = [];
      if (!candidate || candidate.accuracyPercent == null) {
        blocked.push(
          `no suite run on record for ${version}, so none of the release gates can be evaluated. Run the suite against this candidate before promoting.`
        );
      } else {
        if (candidate.accuracyPercent < 95) {
          blocked.push(`accuracy gate: ${candidate.accuracyPercent.toFixed(2)}% is below the required 95.00%`);
        }
        if ((candidate.contractPassRatePercent ?? 0) < 99.5) {
          blocked.push(
            `invariant gate: contract pass rate ${(candidate.contractPassRatePercent ?? 0).toFixed(2)}% is below the required 99.50%`
          );
        }
        if ((candidate.regressionCount ?? 0) > 0) {
          blocked.push(`regression gate: ${candidate.regressionCount} case(s) the incumbent passes fail under ${version}`);
        }
      }

      if (blocked.length) {
        throw new Error(`Promotion of ${version} blocked by promotion gates: ${blocked.join('; ')}`);
      }

      set((state) => ({
        candidates: state.candidates.map((c) => {
          if (c.version === version) return { ...c, status: 'PRODUCTION' };
          if (c.status === 'PRODUCTION') return { ...c, status: 'ROLLED_BACK' };
          return c;
        }),
      }));
      return;
    }

    // Deliberately not optimistic. A blocked promotion is the feature working, and the gates are
    // evaluated server-side against measured results — the UI cannot predict the answer.
    await candidatesApi.promote(version);
    await get().refreshCandidates();
  },

  rollbackVersion: async (version) => {
    if (get().dataSource !== 'live') {
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.version === version ? { ...c, status: 'ROLLED_BACK' } : c
        ),
      }));
      return;
    }

    await candidatesApi.rollback(version);
    await get().refreshCandidates();
  },

  startInvestigation: async (goal, onStep, agentVersion) => {
    const version =
        agentVersion ??
        get().candidates.find((c) => c.status === 'PRODUCTION')?.version ??
        'Aexather-Agent-v2.3';

    /*
     * Streamed when the caller wants to watch. The blocking form is kept for the paths that only
     * want the finished trace — a regression replay has nobody looking at it.
     */
    const trace =
      get().dataSource === 'live'
        ? onStep
          ? await executionsApi.stream({ goal, agentVersion }, onStep)
          : await executionsApi.start({ goal, agentVersion })
        : await demo.runInvestigation(goal, onStep ?? (() => {}), version);
    set((state) => ({
      traces: [trace, ...state.traces.filter((t) => t.id !== trace.id)],
      selectedTraceId: trace.id,
      selectedNodeId: trace.nodes?.[0]?.id ?? null,
    }));
    if (get().dataSource === 'live') {
      // The roll-up moves with every live run, so it is re-read rather than incremented here.
      await get().refreshTraces();
      set({ dashboard: await dashboardApi.summary() });
    }
    return trace;
  },

  diagnoseTrace: async (traceId, onArm) => {
    if (get().dataSource !== 'live') {
      const experiment = await demo.diagnose(get().counterfactual, onArm);
      set({ counterfactual: experiment });
      return experiment;
    }

    const handle = await experimentsApi.diagnose(traceId);
    const experiment = await jobsApi.poll<CounterfactualExperiment>(handle);
    set({ counterfactual: experiment });
    return experiment;
  },
}));
