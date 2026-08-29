/**
 * Typed client for the Aexather backend (Spring Boot, /api/v1).
 *
 * Every function returns the same types the UI already uses from `@/types/platform`,
 * because the backend DTOs mirror that file field-for-field. Swapping a page from
 * mock data to live data is therefore a data-source change, not a type change.
 */

import {
  BehavioralContract,
  CandidateVersion,
  CounterfactualExperiment,
  DashboardSummary,
  ExecutionTrace,
  JobHandle,
  JobStatus,
  MutationReport,
  RegressionSummary,
  RegressionTestCase,
  TraceSummary,
} from '@/types/platform';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8090/api/v1';

/** Error envelope returned by the backend's GlobalExceptionHandler. */
export interface ApiErrorBody {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error body (proxy error, backend down mid-request) — leave it null.
    }
    throw new ApiError(
      response.status,
      body,
      body?.message ?? `${response.status} ${response.statusText}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface TraceFilters {
  status?: ExecutionTrace['status'];
  agentVersion?: string;
  /**
   * Include the platform's own replays, experiment arms and regression rounds. Off by default:
   * a single mutation test writes one trace per case per degradation, and they would bury the
   * runs someone actually asked for.
   */
  includeSynthetic?: boolean;
}

export const tracesApi = {
  list(filters: TraceFilters = {}): Promise<TraceSummary[]> {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.agentVersion) query.set('agentVersion', filters.agentVersion);
    if (filters.includeSynthetic) query.set('includeSynthetic', 'true');
    const suffix = query.toString() ? `?${query}` : '';
    return request<TraceSummary[]>(`/traces${suffix}`);
  },

  get(id: string): Promise<ExecutionTrace> {
    return request<ExecutionTrace>(`/traces/${encodeURIComponent(id)}`);
  },
};

export interface StartInvestigationPayload {
  goal: string;
  /** Candidate version to run under; omitted runs the deployment's own defaults. */
  agentVersion?: string;
}

/** One graph node completing, as the run reports it. */
export interface StepEvent {
  node: string;
  round: number;
  coverage: number;
}

export const executionsApi = {
  /** Runs an investigation and resolves once the finished trace is persisted. */
  start(payload: StartInvestigationPayload): Promise<ExecutionTrace> {
    return request<ExecutionTrace>('/executions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Runs an investigation, reporting each graph node as it completes.
   *
   * Hand-parsed rather than `EventSource`, which can only issue GET requests and cannot carry the
   * goal. The backend emits `step` events per node and one final `trace` event with the persisted
   * execution, so the caller watches the decision graph being built instead of waiting on a
   * spinner and being handed the finished thing.
   */
  async stream(
    payload: StartInvestigationPayload,
    onStep: (step: StepEvent) => void
  ): Promise<ExecutionTrace> {
    const response = await fetch(`${API_BASE_URL}/executions/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok || !response.body) {
      throw new ApiError(response.status, null, `${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let trace: ExecutionTrace | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line; a partial one stays in the buffer for the next read.
      let split = buffer.indexOf('\n\n');
      while (split !== -1) {
        const raw = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        split = buffer.indexOf('\n\n');

        const name = raw.match(/^event:(.*)$/m)?.[1]?.trim();
        const data = raw
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('');

        if (!data) continue;

        if (name === 'step') {
          onStep(JSON.parse(data) as StepEvent);
        } else if (name === 'trace') {
          trace = JSON.parse(data) as ExecutionTrace;
        }
      }
    }

    if (!trace) {
      throw new Error('The investigation ended without reporting a trace.');
    }
    return trace;
  },
};

export const dashboardApi = {
  summary(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary');
  },
};

export interface CreateContractPayload {
  title: string;
  description: string;
  expression: string;
  severity: BehavioralContract['severity'];
}

export interface ContractTestResult {
  valid: boolean;
  passed: boolean;
  error?: string;
  matchedNodes: number;
}

export interface ContractEvaluationSummary {
  executionsEvaluated: number;
  evaluations: number;
  passed: number;
  violated: number;
  indeterminate: number;
}

export const contractsApi = {
  list(): Promise<BehavioralContract[]> {
    return request<BehavioralContract[]>('/contracts');
  },

  /**
   * Rejects with an {@link ApiError} carrying `INVALID_EXPRESSION` when the CEL does not compile.
   * The backend compiles before it writes, so a bad rule never reaches the collection.
   */
  create(payload: CreateContractPayload): Promise<BehavioralContract> {
    return request<BehavioralContract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  setStatus(
    id: string,
    status: BehavioralContract['status']
  ): Promise<BehavioralContract> {
    return request<BehavioralContract>(
      `/contracts/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) }
    );
  },

  /** Dry-runs the expression against one trace, recording nothing. */
  test(id: string, traceId?: string): Promise<ContractTestResult> {
    const suffix = traceId ? `?traceId=${encodeURIComponent(traceId)}` : '';
    return request<ContractTestResult>(
      `/contracts/${encodeURIComponent(id)}/test${suffix}`,
      { method: 'POST' }
    );
  },

  /**
   * Runs every active contract over one execution, or over all live ones when none is named.
   * Pass rates are derived from stored evaluations, so a newly activated contract only starts
   * counting once this has swept.
   */
  evaluate(executionId?: string): Promise<ContractEvaluationSummary> {
    const suffix = executionId
      ? `?executionId=${encodeURIComponent(executionId)}`
      : '';
    return request<ContractEvaluationSummary>(`/contracts/evaluate${suffix}`, {
      method: 'POST',
    });
  },

  deprecate(id: string): Promise<void> {
    return request<void>(`/contracts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export const experimentsApi = {
  list(): Promise<CounterfactualExperiment[]> {
    return request<CounterfactualExperiment[]>('/experiments');
  },

  byTrace(traceId: string): Promise<CounterfactualExperiment> {
    return request<CounterfactualExperiment>(
      `/experiments/by-trace/${encodeURIComponent(traceId)}`
    );
  },

  get(id: string): Promise<CounterfactualExperiment> {
    return request<CounterfactualExperiment>(
      `/experiments/${encodeURIComponent(id)}`
    );
  },

  /**
   * Answers 202 with a job handle. A diagnosis is two baseline replays plus one full investigation
   * per arm, which is minutes of work against a served model — see {@link jobsApi.poll}.
   *
   * The job fails, rather than the request, when the run cannot serve as a baseline: it carries no
   * recorded configuration, or it does not reproduce. The reason arrives in the job's `error`.
   */
  diagnose(traceId: string): Promise<JobHandle> {
    return request<JobHandle>(
      `/experiments/diagnose/${encodeURIComponent(traceId)}`,
      { method: 'POST' }
    );
  },
};

export interface RegressionRunResult {
  runId: string;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  results: {
    caseId: string;
    title: string;
    status: RegressionTestCase['lastRunStatus'];
    actualLatencyMs: number;
    executionId?: string;
    failureReason?: string;
  }[];
}

export interface CreateRegressionCasePayload {
  title: string;
  originExecutionId?: string;
  inputQuery: string;
  expectedOutcome: string;
  contractId: string;
  /** Coverage a replay must reach; omitted takes the deployment's own threshold. */
  minimumCoveragePercent?: number;
}

export const regressionsApi = {
  list(): Promise<RegressionTestCase[]> {
    return request<RegressionTestCase[]>('/regressions');
  },

  summary(): Promise<RegressionSummary> {
    return request<RegressionSummary>('/regressions/summary');
  },

  create(payload: CreateRegressionCasePayload): Promise<RegressionTestCase> {
    return request<RegressionTestCase>('/regressions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createFromFailure(executionId: string): Promise<RegressionTestCase> {
    return request<RegressionTestCase>(
      `/regressions/from-failure?executionId=${encodeURIComponent(executionId)}`,
      { method: 'POST' }
    );
  },

  /**
   * Replays the suite. A named version must have a stored configuration — the backend answers 404
   * or 409 rather than replaying the deployment default under that version's label, because a run
   * tagged with a version it did not execute would make the promotion gate measure the wrong agent.
   */
  runAll(agentVersion?: string): Promise<RegressionRunResult> {
    const suffix = agentVersion
      ? `?agentVersion=${encodeURIComponent(agentVersion)}`
      : '';
    return request<RegressionRunResult>(`/regressions/run${suffix}`, {
      method: 'POST',
    });
  },

  runOne(caseId: string): Promise<RegressionRunResult> {
    return request<RegressionRunResult>(
      `/regressions/${encodeURIComponent(caseId)}/run`,
      { method: 'POST' }
    );
  },

  /**
   * Tests the suite rather than the agent. Answers 202 with a job handle: it replays the whole
   * suite once per degradation — see {@link jobsApi.poll}.
   */
  mutationTest(): Promise<JobHandle> {
    return request<JobHandle>('/regressions/mutation-test', { method: 'POST' });
  },
};

export const jobsApi = {
  status<T>(jobId: string): Promise<JobStatus<T>> {
    return request<JobStatus<T>>(`/jobs/${encodeURIComponent(jobId)}`);
  },

  /**
   * Polls until the job settles, then resolves with its result or rejects with its reason.
   *
   * @param intervalMs how often to ask; the default is gentle because these run for minutes
   * @param timeoutMs give up waiting — the job itself keeps running and stays readable by id
   */
  async poll<T>(
    handle: JobHandle,
    { intervalMs = 2000, timeoutMs = 600_000 }: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;

    for (;;) {
      const status = await jobsApi.status<T>(handle.jobId);

      if (status.state === 'SUCCEEDED') {
        return status.result as T;
      }
      if (status.state === 'FAILED') {
        throw new Error(status.error ?? `${handle.kind} failed`);
      }
      if (Date.now() > deadline) {
        throw new Error(
          `${handle.kind} is still running after ${Math.round(timeoutMs / 1000)}s — ` +
            `it will finish on its own; read it at ${handle.statusUrl}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  },
};

export interface PromotionResult {
  version: string;
  status: CandidateVersion['status'];
  gatesPassed: boolean;
  blockedReasons: string[];
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: { field: string; from: string; to: string }[];
  unchanged: string[];
}

export const candidatesApi = {
  list(): Promise<CandidateVersion[]> {
    return request<CandidateVersion[]>('/candidates');
  },

  /**
   * Promotion is gate-checked server-side against a *measured* scorecard, derived from the traces
   * of that version's latest regression run. When a gate fails the backend answers 409 and this
   * rejects with an {@link ApiError} whose `body.message` lists the blocking reasons — the promote
   * button is meant to be able to fail. A version with no suite run on record is refused outright:
   * a gate that passes when it has no evidence is not a gate.
   */
  promote(version: string): Promise<PromotionResult> {
    return request<PromotionResult>(
      `/candidates/${encodeURIComponent(version)}/promote`,
      { method: 'POST' }
    );
  },

  rollback(version: string): Promise<PromotionResult> {
    return request<PromotionResult>(
      `/candidates/${encodeURIComponent(version)}/rollback`,
      { method: 'POST' }
    );
  },

  diff(fromVersion: string, toVersion: string): Promise<VersionDiff> {
    return request<VersionDiff>(
      `/candidates/${encodeURIComponent(fromVersion)}/diff/${encodeURIComponent(toVersion)}`
    );
  },
};

/**
 * Whether the backend is reachable, used to decide between live data and the bundled fixtures.
 *
 * Hits the dashboard roll-up rather than a HEAD on a collection: it is the cheapest endpoint that
 * proves the whole stack answers, database included. A backend that is up but cannot reach Mongo
 * would pass a HEAD and then fail every real read.
 */
export async function isBackendReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}
