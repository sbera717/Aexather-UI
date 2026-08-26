/**
 * Typed client for the Aether backend (Spring Boot, /api/v1).
 *
 * Every function returns the same types the UI already uses from `@/types/platform`,
 * because the backend DTOs mirror that file field-for-field. Swapping a page from
 * mock data to live data is therefore a data-source change, not a type change.
 */

import {
  ExecutionTrace,
  BehavioralContract,
  CounterfactualExperiment,
  RegressionTestCase,
  CandidateVersion,
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

/**
 * The list endpoint returns a lighter projection than the detail endpoint — it omits
 * `nodes`, `evidenceLedger`, and `claims`, which are only needed once a trace is opened.
 */
export type TraceSummary = Omit<
  ExecutionTrace,
  'nodes' | 'evidenceLedger' | 'claims' | 'contractViolations'
>;

export interface TraceFilters {
  status?: ExecutionTrace['status'];
  agentVersion?: string;
}

export const tracesApi = {
  list(filters: TraceFilters = {}): Promise<TraceSummary[]> {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.agentVersion) query.set('agentVersion', filters.agentVersion);
    const suffix = query.toString() ? `?${query}` : '';
    return request<TraceSummary[]>(`/traces${suffix}`);
  },

  get(id: string): Promise<ExecutionTrace> {
    return request<ExecutionTrace>(`/traces/${encodeURIComponent(id)}`);
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

export const contractsApi = {
  list(): Promise<BehavioralContract[]> {
    return request<BehavioralContract[]>('/contracts');
  },

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

  test(id: string, traceId?: string): Promise<ContractTestResult> {
    const suffix = traceId ? `?traceId=${encodeURIComponent(traceId)}` : '';
    return request<ContractTestResult>(
      `/contracts/${encodeURIComponent(id)}/test${suffix}`,
      { method: 'POST' }
    );
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
    failureReason?: string;
  }[];
}

export const regressionsApi = {
  list(): Promise<RegressionTestCase[]> {
    return request<RegressionTestCase[]>('/regressions');
  },

  create(
    payload: Omit<RegressionTestCase, 'id' | 'lastRunStatus' | 'addedDate'>
  ): Promise<RegressionTestCase> {
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

  runAll(agentVersion?: string): Promise<RegressionRunResult> {
    const suffix = agentVersion
      ? `?agentVersion=${encodeURIComponent(agentVersion)}`
      : '';
    return request<RegressionRunResult>(`/regressions/run${suffix}`, {
      method: 'POST',
    });
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
   * Promotion is gate-checked server-side. When a gate fails the backend answers 409 and
   * this rejects with an {@link ApiError} whose `body.message` lists the blocking reasons —
   * the promote button is meant to be able to fail.
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

/** Returns true when the backend is reachable — used to decide whether to fall back to mocks. */
export async function isBackendReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/traces`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok || response.status === 405;
  } catch {
    return false;
  }
}
