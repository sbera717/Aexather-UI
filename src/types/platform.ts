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

export interface DecisionNode {
  id: string;
  stepNumber: number;
  agentRole: string;
  actionType: 'INTENT_ROUTING' | 'TASK_PLANNING' | 'TOOL_INVOCATION' | 'INVARIANT_GUARD' | 'VERDICT_EMISSION';
  summary: string;
  latencyMs: number;
  tokenCostUsd: number;
  evidenceIds: string[];
  status: 'COMPLETED' | 'WARNED' | 'FAILED';
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  childrenIds?: string[];
}

export interface ExecutionTrace {
  id: string;
  agentVersion: string;
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
  passRatePercent: number;
  evaluationsCount: number;
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
  lastRunStatus: 'PASSED' | 'FAILED';
  latencyTargetMs: number;
  addedDate: string;
}

export interface CandidateVersion {
  version: string;
  createdAt: string;
  status: 'PRODUCTION' | 'CANDIDATE' | 'REJECTED' | 'ROLLED_BACK';
  accuracyPercent: number;
  contractPassRatePercent: number;
  regressionCount: number;
  previousFailuresFixed: number;
  p95LatencyMs: number;
  costPerRunUsd: number;
  changesSummary: string[];
  shadowComparison?: {
    totalEvaluations: number;
    agreementRatePercent: number;
    latencyDeltaMs: number;
    costDeltaPercent: number;
  };
}
