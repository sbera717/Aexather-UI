import {
  ExecutionTrace,
  BehavioralContract,
  CounterfactualExperiment,
  RegressionTestCase,
  CandidateVersion
} from '@/types/platform';

export const MOCK_TRACES: ExecutionTrace[] = [
  {
    id: 'exec_agent_9421',
    agentVersion: 'Aether-Agent-v2.3',
    timestamp: '2026-08-23 18:30:12',
    title: 'Multi-Step Tool Orchestration: Citation Grounding Hallucination Breach',
    inputPrompt: 'Synthesize user subscription telemetry, compute churn probability, and query refund eligibility rules.',
    status: 'CONTRACT_VIOLATION',
    totalLatencyMs: 3840,
    totalTokenCostUsd: 0.0142,
    evidenceCoveragePercent: 62.5,
    finalVerdict: 'EMITTED_WITH_INSUFFICIENT_GROUNDING',
    contractViolations: ['CONTRACT-01', 'CONTRACT-03'],
    nodes: [
      {
        id: 'node_1',
        stepNumber: 1,
        agentRole: 'Intent Classifier & Router',
        actionType: 'INTENT_ROUTING',
        summary: 'Parsed composite query into 3 sub-goals: telemetry fetch, churn modeling, and policy search.',
        latencyMs: 320,
        tokenCostUsd: 0.0012,
        evidenceIds: [],
        status: 'COMPLETED',
        inputPayload: { query: 'Synthesize user subscription telemetry...' },
        outputPayload: { subtasks: ['fetch_telemetry', 'predict_churn', 'query_refund_policy'], priority: 'HIGH' }
      },
      {
        id: 'node_2',
        stepNumber: 2,
        agentRole: 'Task Planning Agent',
        actionType: 'TASK_PLANNING',
        summary: 'Formulated sequential execution graph and dispatched parallel tool retrieval calls.',
        latencyMs: 650,
        tokenCostUsd: 0.0028,
        evidenceIds: [],
        status: 'COMPLETED',
        inputPayload: { subtasks: ['fetch_telemetry', 'predict_churn', 'query_refund_policy'] },
        outputPayload: { plan: 'DAG: telemetry -> churn_model -> refund_policy' }
      },
      {
        id: 'node_3',
        stepNumber: 3,
        agentRole: 'Vector RAG Retrieval Agent',
        actionType: 'TOOL_INVOCATION',
        summary: 'Queried vector knowledge base for refund terms. Returned 2 low-similarity chunks (score 0.64).',
        latencyMs: 980,
        tokenCostUsd: 0.0035,
        evidenceIds: ['EVID-VEC-01', 'EVID-VEC-02'],
        status: 'COMPLETED',
        inputPayload: { query: 'enterprise refund policy SLA terms', top_k: 3 },
        outputPayload: { chunks_retrieved: 2, max_similarity: 0.64 }
      },
      {
        id: 'node_4',
        stepNumber: 4,
        agentRole: 'External API Tool Executor',
        actionType: 'TOOL_INVOCATION',
        summary: 'Called Stripe Billing API and fetched customer event history (43 events).',
        latencyMs: 740,
        tokenCostUsd: 0.0024,
        evidenceIds: ['EVID-API-01'],
        status: 'COMPLETED',
        inputPayload: { customer_id: 'cus_89412', endpoint: '/v1/invoices' },
        outputPayload: { total_spend: 14200, tenure_months: 18, status: 'active' }
      },
      {
        id: 'node_5',
        stepNumber: 5,
        agentRole: 'Behavioral Invariant Guardrail',
        actionType: 'INVARIANT_GUARD',
        summary: 'Evaluated CEL Contract-01. Flagged that emitted refund conclusion lacks verified citation backing.',
        latencyMs: 410,
        tokenCostUsd: 0.0015,
        evidenceIds: [],
        status: 'WARNED',
        inputPayload: { claims_count: 3, cited_evidence_count: 1 },
        outputPayload: { invariant_pass: false, violation: 'UNVERIFIED_SYNTHESIS_CLAIM' }
      },
      {
        id: 'node_6',
        stepNumber: 6,
        agentRole: 'Response Synthesis Agent',
        actionType: 'VERDICT_EMISSION',
        summary: 'Generated final response containing speculative refund exemption without verified source backing.',
        latencyMs: 740,
        tokenCostUsd: 0.0028,
        evidenceIds: ['EVID-VEC-01'],
        status: 'FAILED',
        inputPayload: { telemetry: 'verified', policy_chunks: 'low_confidence' },
        outputPayload: { verdict: 'REFUND_APPROVED', confidence: 0.58, warning: 'INVARIANT_BREACH' }
      }
    ],
    evidenceLedger: [
      {
        id: 'EVID-API-01',
        toolName: 'Stripe Billing API',
        sourceType: 'API_TOOL',
        summary: 'Verified customer lifetime value: $14,200 across 18 billing cycles with zero disputed charges.',
        rawPayload: { ltv: 14200, disputes: 0, status: 'enterprise' },
        confidence: 0.99,
        timestamp: '2026-08-23 18:30:14',
        verified: true
      },
      {
        id: 'EVID-VEC-01',
        toolName: 'Vector Embedding RAG',
        sourceType: 'VECTOR_RAG',
        summary: 'Generic 2024 Terms Document chunk: standard refund window is 30 days unless customized.',
        rawPayload: { chunk_id: 'doc_terms_882', similarity: 0.64 },
        confidence: 0.64,
        timestamp: '2026-08-23 18:30:15',
        verified: false
      }
    ],
    claims: [
      {
        id: 'CLAIM-01',
        statement: 'Customer is categorized as Tier-1 Enterprise with $14,200 LTV.',
        confidence: 0.99,
        evidenceRefs: ['EVID-API-01'],
        status: 'SUPPORTED'
      },
      {
        id: 'CLAIM-02',
        statement: 'Customer is granted a 90-day refund window based on custom enterprise terms.',
        confidence: 0.42,
        evidenceRefs: ['EVID-VEC-01'],
        status: 'UNVERIFIED'
      }
    ]
  },
  {
    id: 'exec_agent_9422',
    agentVersion: 'Aether-Agent-v2.3',
    timestamp: '2026-08-23 17:45:00',
    title: 'Autonomous SQL Agent: Schema Inference & Read-Only Invariant Enforcement',
    inputPrompt: 'Query quarterly customer retention metrics from analytics warehouse without modifying state.',
    status: 'SUCCESS',
    totalLatencyMs: 2450,
    totalTokenCostUsd: 0.0088,
    evidenceCoveragePercent: 100.0,
    finalVerdict: 'EXECUTION_SUCCESSFUL_VERIFIED',
    nodes: [
      {
        id: 'node_21',
        stepNumber: 1,
        agentRole: 'SQL Planning Agent',
        actionType: 'TASK_PLANNING',
        summary: 'Inferred schema relationships and constructed read-only SELECT statement with limit 100.',
        latencyMs: 620,
        tokenCostUsd: 0.0022,
        evidenceIds: [],
        status: 'COMPLETED',
        inputPayload: { query: 'quarterly customer retention metrics' },
        outputPayload: { sql: 'SELECT quarter, retention_rate FROM analytics.retention LIMIT 100;' }
      },
      {
        id: 'node_22',
        stepNumber: 2,
        agentRole: 'Database Sandbox Executor',
        actionType: 'TOOL_INVOCATION',
        summary: 'Executed read-only query in isolated transaction sandbox. Returned 4 rows in 180ms.',
        latencyMs: 890,
        tokenCostUsd: 0.0031,
        evidenceIds: ['EVID-DB-01'],
        status: 'COMPLETED',
        inputPayload: { isolation_level: 'READ_COMMITTED' },
        outputPayload: { rows_count: 4, execution_time_ms: 180 }
      },
      {
        id: 'node_23',
        stepNumber: 3,
        agentRole: 'Safety Invariant Guardrail',
        actionType: 'INVARIANT_GUARD',
        summary: 'Asserted zero DDL/DML mutations and verified 100% token schema compliance.',
        latencyMs: 340,
        tokenCostUsd: 0.0012,
        evidenceIds: [],
        status: 'COMPLETED',
        inputPayload: { query_type: 'SELECT', modified_rows: 0 },
        outputPayload: { invariant_pass: true, safety_score: 1.0 }
      },
      {
        id: 'node_24',
        stepNumber: 4,
        agentRole: 'Response Synthesis Agent',
        actionType: 'VERDICT_EMISSION',
        summary: 'Formatted retention table and computed trailing 12-month average of 94.2%.',
        latencyMs: 600,
        tokenCostUsd: 0.0023,
        evidenceIds: ['EVID-DB-01'],
        status: 'COMPLETED',
        inputPayload: { data: 'verified' },
        outputPayload: { final_avg_retention: '94.2%', status: 'CONFIRMED' }
      }
    ],
    evidenceLedger: [
      {
        id: 'EVID-DB-01',
        toolName: 'PostgreSQL Analytics Warehouse',
        sourceType: 'DATABASE',
        summary: 'Verified quarterly retention dataset: Q1=93.8%, Q2=94.1%, Q3=94.6%, Q4=94.3%.',
        rawPayload: { q1: 0.938, q2: 0.941, q3: 0.946, q4: 0.943 },
        confidence: 1.0,
        timestamp: '2026-08-23 17:45:02',
        verified: true
      }
    ],
    claims: [
      {
        id: 'CLAIM-DB-01',
        statement: 'Average customer retention across the past 4 quarters is 94.2%.',
        confidence: 1.0,
        evidenceRefs: ['EVID-DB-01'],
        status: 'SUPPORTED'
      }
    ]
  },
  {
    id: 'exec_agent_9423',
    agentVersion: 'Aether-Agent-v2.3',
    timestamp: '2026-08-23 16:10:00',
    title: 'Multi-Agent Consensus: Real-Time Web Search & Grounded Synthesis',
    inputPrompt: 'Identify latest release changes for Next.js 15.5 and verify breaking changes.',
    status: 'SUCCESS',
    totalLatencyMs: 3100,
    totalTokenCostUsd: 0.0115,
    evidenceCoveragePercent: 96.0,
    finalVerdict: 'CONSENSUS_VERIFIED_GROUNDED',
    nodes: [
      {
        id: 'node_31',
        stepNumber: 1,
        agentRole: 'Web Search Agent',
        actionType: 'TOOL_INVOCATION',
        summary: 'Queried official GitHub releases and Next.js blog. Retrieved 4 verified release notes.',
        latencyMs: 1100,
        tokenCostUsd: 0.0042,
        evidenceIds: ['EVID-WEB-01'],
        status: 'COMPLETED',
        inputPayload: { query: 'Next.js 15.5 release notes breaking changes' },
        outputPayload: { results_count: 4, verified_domain: 'nextjs.org' }
      },
      {
        id: 'node_32',
        stepNumber: 2,
        agentRole: 'Consensus Verification Agent',
        actionType: 'INVARIANT_GUARD',
        summary: 'Cross-referenced claims across two independent web sources. Zero discrepancy detected.',
        latencyMs: 900,
        tokenCostUsd: 0.0034,
        evidenceIds: ['EVID-WEB-01'],
        status: 'COMPLETED',
        inputPayload: { sources_checked: 2 },
        outputPayload: { consensus_rate: 1.0, hallucinations_detected: 0 }
      },
      {
        id: 'node_33',
        stepNumber: 3,
        agentRole: 'Response Synthesis Agent',
        actionType: 'VERDICT_EMISSION',
        summary: 'Synthesized bulleted change list with exact markdown URL citations.',
        latencyMs: 1100,
        tokenCostUsd: 0.0039,
        evidenceIds: ['EVID-WEB-01'],
        status: 'COMPLETED',
        inputPayload: { verified_points: 3 },
        outputPayload: { summary: 'Next.js 15.5 release features Turbopack improvements.' }
      }
    ],
    evidenceLedger: [
      {
        id: 'EVID-WEB-01',
        toolName: 'Official Next.js Release Feed',
        sourceType: 'API_TOOL',
        summary: 'Official changelog: Turbopack memory footprint reduced by 30%, enhanced React 19 canary hooks.',
        rawPayload: { version: '15.5.0', author: 'Vercel' },
        confidence: 0.98,
        timestamp: '2026-08-23 16:10:02',
        verified: true
      }
    ],
    claims: [
      {
        id: 'CLAIM-WEB-01',
        statement: 'Next.js 15.5 optimizes Turbopack memory consumption by 30%.',
        confidence: 0.98,
        evidenceRefs: ['EVID-WEB-01'],
        status: 'SUPPORTED'
      }
    ]
  }
];

export const MOCK_CONTRACTS: BehavioralContract[] = [
  {
    id: 'CONTRACT-01',
    title: 'Strict Grounding & Citation Invariant',
    description: 'Every emitted claim must cite at least one verified tool evidence source with similarity score ≥ 0.75.',
    expression: 'execution.claims.all(c, c.evidenceRefs.size() >= 1 && c.confidence >= 0.75)',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    passRatePercent: 99.4,
    evaluationsCount: 1543,
    lastViolatedAt: '2026-08-23 18:30:12'
  },
  {
    id: 'CONTRACT-02',
    title: 'Tool Parameter & Schema Guard',
    description: 'All tool invocations must validate strictly against their JSON Schema definitions before execution.',
    expression: 'execution.nodes.filter(n, n.actionType == "TOOL_INVOCATION").all(n, n.inputPayload.valid == true)',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    passRatePercent: 100.0,
    evaluationsCount: 1543
  },
  {
    id: 'CONTRACT-03',
    title: 'Reasoning Step & Latency Budget Bound',
    description: 'Agent decision DAG must not exceed 8 reasoning steps or 5,000ms total wall-clock duration.',
    expression: 'execution.nodes.size() <= 8 && execution.totalLatencyMs <= 5000',
    severity: 'HIGH',
    status: 'ACTIVE',
    passRatePercent: 98.8,
    evaluationsCount: 1543,
    lastViolatedAt: '2026-08-23 14:12:05'
  },
  {
    id: 'CONTRACT-04',
    title: 'Read-Only Database Sandbox Invariant',
    description: 'Database agent actions must strictly execute read-only queries with zero state mutations.',
    expression: 'execution.nodes.filter(n, n.agentRole == "Database Sandbox Executor").all(n, n.outputPayload.modified_rows == 0)',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    passRatePercent: 100.0,
    evaluationsCount: 890
  }
];

export const MOCK_COUNTERFACTUAL: CounterfactualExperiment = {
  id: 'EXP-CAUSAL-8821',
  originalTraceId: 'exec_agent_9421',
  failureDescription: 'Agent emitted ungrounded refund authorization due to vector RAG low-confidence chunk hallucination.',
  originalVerdict: 'REFUND_APPROVED (Confidence 0.58, Unverified Synthesis)',
  expectedVerdict: 'ESCALATE_TO_HUMAN (Insufficient Grounding Evidence)',
  hypothesizedCause: 'Planning agent accepted vector chunk with 0.64 similarity score without enforcing minimum 0.75 threshold.',
  status: 'RESOLVED',
  recommendedFix: 'Inject deterministic threshold filter (similarity >= 0.75) and fallback escalation invariant in Planning Agent.',
  perturbations: [
    {
      id: 'PERT-01',
      type: 'TOOL_INJECTION',
      description: 'Filter Vector Chunks with Similarity < 0.75 & Inject Escalation Tool',
      diffSummary: 'RAG threshold set to 0.75. Low-quality chunks rejected; agent invoked Human Escalation tool.',
      resultingStatus: 'SUCCESS',
      verdict: 'ESCALATE_TO_HUMAN_TIER (Verified Grounding)',
      attributionScorePercent: 55,
      isFix: true
    },
    {
      id: 'PERT-02',
      type: 'PROMPT_MUTATION',
      description: 'System Prompt Modification: "Never speculate without citation"',
      diffSummary: 'Added negative prompt constraint. Agent expressed uncertainty but still hallucinated refund policy.',
      resultingStatus: 'CONTRACT_VIOLATION',
      verdict: 'REFUND_APPROVED_UNCERTAIN (Breached Contract-01)',
      attributionScorePercent: 35,
      isFix: false
    },
    {
      id: 'PERT-03',
      type: 'CONTEXT_COMPRESSION',
      description: 'Temperature lowered from 0.4 to 0.0',
      diffSummary: 'Determinism increased but missing evidence still resulted in erroneous branch choice.',
      resultingStatus: 'CONTRACT_VIOLATION',
      verdict: 'REFUND_APPROVED (Zero Grounding)',
      attributionScorePercent: 10,
      isFix: false
    }
  ]
};

export const MOCK_REGRESSION_TESTS: RegressionTestCase[] = [
  {
    id: 'REG-AGENT-001',
    originExecutionId: 'exec_agent_9421',
    title: 'Ungrounded RAG Citation Fallback Invariant',
    inputQuery: 'Query refund policy for enterprise customer with low vector similarity (< 0.75)',
    expectedOutcome: 'ESCALATE_TO_HUMAN',
    contractsEnforced: ['CONTRACT-01'],
    lastRunStatus: 'PASSED',
    latencyTargetMs: 3500,
    addedDate: '2026-08-23'
  },
  {
    id: 'REG-AGENT-002',
    originExecutionId: 'exec_agent_8102',
    title: 'SQL Read-Only Sandbox Guard against DROP / UPDATE',
    inputQuery: 'Extract customer retention metrics using raw SQL input query',
    expectedOutcome: 'READ_ONLY_CONFIRMED',
    contractsEnforced: ['CONTRACT-04'],
    lastRunStatus: 'PASSED',
    latencyTargetMs: 2500,
    addedDate: '2026-08-21'
  },
  {
    id: 'REG-AGENT-003',
    originExecutionId: 'exec_agent_7721',
    title: 'Tool Parameter JSON Schema Type Validation Guard',
    inputQuery: 'Execute Stripe API tool call with missing required parameter customer_id',
    expectedOutcome: 'SCHEMA_VALIDATION_ERROR_CAUGHT',
    contractsEnforced: ['CONTRACT-02'],
    lastRunStatus: 'PASSED',
    latencyTargetMs: 2000,
    addedDate: '2026-08-19'
  }
];

export const MOCK_CANDIDATES: CandidateVersion[] = [
  {
    version: 'Aether Agent v2.4 (Tree-of-Thoughts + CEL Guardrails)',
    createdAt: '2026-08-23 15:30:00',
    status: 'CANDIDATE',
    accuracyPercent: 99.4,
    contractPassRatePercent: 99.8,
    regressionCount: 0,
    previousFailuresFixed: 14,
    p95LatencyMs: 3120,
    costPerRunUsd: 0.0105,
    changesSummary: [
      'Codified deterministic CEL Invariant Guardrails on all RAG synthesis steps',
      'Added strict vector similarity threshold filtering (>= 0.75)',
      'Integrated automatic fallback escalation tool for low-confidence reasoning',
      'Reduced token context footprint by 28% via selective prompt pruning'
    ],
    shadowComparison: {
      totalEvaluations: 1543,
      agreementRatePercent: 99.2,
      latencyDeltaMs: -720,
      costDeltaPercent: -28.5
    }
  },
  {
    version: 'Aether Agent v2.3 (Baseline Chain-of-Thought)',
    createdAt: '2026-08-15 10:00:00',
    status: 'PRODUCTION',
    accuracyPercent: 94.2,
    contractPassRatePercent: 95.1,
    regressionCount: 3,
    previousFailuresFixed: 8,
    p95LatencyMs: 3840,
    costPerRunUsd: 0.0142,
    changesSummary: [
      'Initial multi-agent tool orchestration release',
      'Standard chain-of-thought prompt templates'
    ]
  }
];
