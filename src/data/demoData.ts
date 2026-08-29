/**
 * Fixtures for the offline demo, mirroring `src/main/resources/seed/*.json` in the backend.
 *
 * These exist so every page is legible with no backend running — during a recording, on a laptop,
 * in a review. They are a copy of what the seed loader imports, so the offline story and the live
 * one are the same story rather than two unrelated sets of sample data.
 *
 * `mockData.ts` is left untouched and still exported; this file sits alongside it.
 *
 * Two transforms are applied on the way across. Human-facing strings are rewritten out of the
 * backend's enum vocabulary — `[SOURCE_GROUNDING, HISTORICAL]` reads as a variable name that
 * leaked, not as something the product knows about — while the payloads keep their constants
 * verbatim, because those are data the contract expressions read. And the candidate scorecards
 * start empty: a version has no measured figures until its suite has run, which is the whole point
 * of the promotion page.
 */

import {
  BehavioralContract,
  CandidateVersion,
  CounterfactualExperiment,
  ExecutionTrace,
  RegressionTestCase,
} from '@/types/platform';

export const DEMO_TRACES: ExecutionTrace[] = [
    {
      "id": "exec_aexather_4417",
      "agentVersion": "Aexather-Agent-v2.3",
      "origin": "LIVE",
      "timestamp": "2026-08-26 14:22:08",
      "title": "Sublicensing entitlement: verdict emitted over an unevidenced clause",
      "inputPrompt": "Establish whether vendor 44 is permitted to sublicense the aggregated dataset under its current agreement.",
      "status": "CONTRACT_VIOLATION",
      "totalLatencyMs": 4180,
      "totalTokenCostUsd": 0.0163,
      "evidenceCoveragePercent": 60.0,
      "finalVerdict": "Sublicensing appears permitted for aggregated derivatives, though the governing clause could not be located and two sources disagree on scope.",
      "contractViolations": [
        "CONTRACT-01"
      ],
      "nodes": [
        {
          "id": "node_1",
          "stepNumber": 1,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Dispatching specialists to close source grounding, structured records and policy constraints",
          "latencyMs": 214,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 0.0,
            "missingDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Vector Retrieval Specialist",
              "System of Record Specialist",
              "Policy and Constraints Specialist"
            ],
            "round": 1
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.85,
              "selected": true
            },
            {
              "action": "System of Record Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.84,
              "selected": true
            },
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": false
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": false
            }
          ],
          "selectionReason": "Dispatching specialists to close source grounding, structured records and policy constraints",
          "budgetAtDecision": {
            "tokensUsed": 0,
            "toolCalls": 0,
            "elapsedMs": 214
          }
        },
        {
          "id": "node_2",
          "stepNumber": 2,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 2 returned a usable finding",
          "latencyMs": 1310,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-RECORDS-R1",
            "EVID-POLICY-R1"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Vector Retrieval Specialist",
              "System of Record Specialist",
              "Policy and Constraints Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 5120,
            "toolCalls": 3,
            "elapsedMs": 1524
          }
        },
        {
          "id": "node_3",
          "stepNumber": 3,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage 40.0% below the 80.0% threshold; the policy index returned no governing clause",
          "latencyMs": 46,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 40.0,
            "independentSources": 2,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": [],
            "continue": true
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "selectionReason": "Coverage 40.0% below the 80.0% threshold; the policy index returned no governing clause",
          "budgetAtDecision": {
            "tokensUsed": 5120,
            "toolCalls": 3,
            "elapsedMs": 1570
          }
        },
        {
          "id": "node_4",
          "stepNumber": 4,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Retrying the policy index and seeking an independent read on scope",
          "latencyMs": 188,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 40.0,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Historical State Specialist",
              "Independent Corroboration Specialist",
              "Policy and Constraints Specialist"
            ],
            "round": 2
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.7,
              "selected": true
            },
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "Retrying the policy index and seeking an independent read on scope",
          "budgetAtDecision": {
            "tokensUsed": 5120,
            "toolCalls": 3,
            "elapsedMs": 1758
          }
        },
        {
          "id": "node_5",
          "stepNumber": 5,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 2 returned a usable finding",
          "latencyMs": 1490,
          "evidenceIds": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2",
            "EVID-POLICY-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Historical State Specialist",
              "Independent Corroboration Specialist",
              "Policy and Constraints Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 11040,
            "toolCalls": 6,
            "elapsedMs": 3248
          }
        },
        {
          "id": "node_6",
          "stepNumber": 6,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Sources disagree on historical — the amendment history and the corroborating read disagree on whether aggregation counts as a derivative",
          "latencyMs": 52,
          "evidenceIds": [],
          "status": "WARNED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL"
            ]
          },
          "outputPayload": {
            "coveragePercent": 60.0,
            "independentSources": 4,
            "missingDimensions": [
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": [
              "HISTORICAL"
            ],
            "continue": true
          },
          "trigger": "EVIDENCE_CONFLICT",
          "selectionReason": "Sources disagree on historical — the amendment history and the corroborating read disagree on whether aggregation counts as a derivative",
          "budgetAtDecision": {
            "tokensUsed": 11040,
            "toolCalls": 6,
            "elapsedMs": 3300
          }
        },
        {
          "id": "node_7",
          "stepNumber": 7,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "No unused specialist bears on the remaining gaps",
          "latencyMs": 96,
          "evidenceIds": [],
          "status": "WARNED",
          "inputPayload": {
            "coveragePercent": 60.0,
            "missingDimensions": [
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": [
              "HISTORICAL"
            ]
          },
          "outputPayload": {
            "selected": [],
            "round": 3
          },
          "trigger": "BUDGET_EXHAUSTED",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Historical State Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "No unused specialist bears on the remaining gaps",
          "budgetAtDecision": {
            "tokensUsed": 11040,
            "toolCalls": 6,
            "elapsedMs": 3396
          }
        },
        {
          "id": "node_8",
          "stepNumber": 8,
          "agentRole": "Verdict Synthesiser",
          "actionType": "VERDICT_EMISSION",
          "summary": "Sublicensing appears permitted for aggregated derivatives, though the governing clause could not be located and two sources disagree on scope.",
          "latencyMs": 784,
          "tokenCostUsd": 0.0031,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-RECORDS-R1",
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "WARNED",
          "inputPayload": {
            "coveragePercent": 60.0,
            "evidenceCount": 4
          },
          "outputPayload": {
            "verdict": "Sublicensing appears permitted for aggregated derivatives, though the governing clause could not be located and two sources disagree on scope."
          },
          "budgetAtDecision": {
            "tokensUsed": 14780,
            "toolCalls": 6,
            "elapsedMs": 4180
          }
        }
      ],
      "evidenceLedger": [
        {
          "id": "EVID-RETRIEVAL-R1",
          "toolName": "Vector Knowledge Base",
          "sourceType": "VECTOR_RAG",
          "summary": "Retrieved three passages describing derivative-work handling; none names sublicensing explicitly.",
          "rawPayload": {
            "passages": 3,
            "topSimilarity": 0.71,
            "namesSublicensing": false
          },
          "confidence": 0.71,
          "timestamp": "2026-08-26 14:22:10",
          "verified": true
        },
        {
          "id": "EVID-RECORDS-R1",
          "toolName": "System of Record API",
          "sourceType": "API_TOOL",
          "summary": "Vendor 44 holds an active Tier-2 data agreement, amended twice, with derivative rights flagged 'conditional'.",
          "rawPayload": {
            "vendorId": 44,
            "tier": 2,
            "amendments": 2,
            "derivativeRights": "conditional"
          },
          "confidence": 0.94,
          "timestamp": "2026-08-26 14:22:10",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R1",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "No governing sublicensing clause located in the indexed policy set.",
          "rawPayload": {
            "clausesMatched": 0,
            "indexCoverage": "partial"
          },
          "confidence": 0.18,
          "timestamp": "2026-08-26 14:22:10",
          "verified": false
        },
        {
          "id": "EVID-HISTORY-R2",
          "toolName": "Historical State Store",
          "sourceType": "DATABASE",
          "summary": "Amendment 2 narrowed derivative rights to internal use; the change was never propagated to the entitlement record.",
          "rawPayload": {
            "amendment": 2,
            "effective": "2026-04-01",
            "propagated": false
          },
          "confidence": 0.88,
          "timestamp": "2026-08-26 14:22:12",
          "verified": true
        },
        {
          "id": "EVID-CORROBORATION-R2",
          "toolName": "Independent Reputation Service",
          "sourceType": "API_TOOL",
          "summary": "Independent read treats aggregation as exempt from the derivative restriction, contradicting the amendment history.",
          "rawPayload": {
            "agreesWithRecords": false,
            "basis": "aggregation-exemption"
          },
          "confidence": 0.79,
          "timestamp": "2026-08-26 14:22:12",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R2",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Retry located an adjacent retention clause but still no sublicensing provision.",
          "rawPayload": {
            "clausesMatched": 0,
            "adjacentMatches": 1
          },
          "confidence": 0.22,
          "timestamp": "2026-08-26 14:22:12",
          "verified": false
        }
      ],
      "claims": [
        {
          "id": "CLAIM-01",
          "statement": "Source grounding evidence is divided on the conclusion",
          "confidence": 0.71,
          "evidenceRefs": [
            "EVID-RETRIEVAL-R1"
          ],
          "status": "UNVERIFIED"
        },
        {
          "id": "CLAIM-02",
          "statement": "Structured records evidence supports the conclusion",
          "confidence": 0.94,
          "evidenceRefs": [
            "EVID-RECORDS-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-03",
          "statement": "Historical evidence is divided on the conclusion",
          "confidence": 0.84,
          "evidenceRefs": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "UNVERIFIED"
        },
        {
          "id": "CLAIM-04",
          "statement": "Aggregated derivatives fall outside the amendment's restriction",
          "confidence": 0.62,
          "evidenceRefs": [],
          "status": "UNVERIFIED"
        },
        {
          "id": "CLAIM-05",
          "statement": "The entitlement record reflects the current agreement",
          "confidence": 0.55,
          "evidenceRefs": [],
          "status": "UNVERIFIED"
        }
      ]
    },
    {
      "id": "exec_aexather_4418",
      "agentVersion": "Aexather-Agent-v2.3",
      "origin": "LIVE",
      "timestamp": "2026-08-26 13:04:51",
      "title": "Refund eligibility: investigation stalled below the coverage bar",
      "inputPrompt": "Determine whether order 8812 qualifies for a refund under the published returns policy.",
      "status": "FAILURE",
      "totalLatencyMs": 3120,
      "totalTokenCostUsd": 0.0108,
      "evidenceCoveragePercent": 40.0,
      "finalVerdict": "The evidence is insufficient to settle refund eligibility for order 8812; the policy and corroboration dimensions were never closed.",
      "nodes": [
        {
          "id": "node_1",
          "stepNumber": 1,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Dispatching specialists to close source grounding, structured records and policy constraints",
          "latencyMs": 198,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 0.0,
            "missingDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Vector Retrieval Specialist",
              "System of Record Specialist",
              "Policy and Constraints Specialist"
            ],
            "round": 1
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.85,
              "selected": true
            },
            {
              "action": "System of Record Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.84,
              "selected": true
            },
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": false
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": false
            }
          ],
          "selectionReason": "Dispatching specialists to close source grounding, structured records and policy constraints",
          "budgetAtDecision": {
            "tokensUsed": 0,
            "toolCalls": 0,
            "elapsedMs": 198
          }
        },
        {
          "id": "node_2",
          "stepNumber": 2,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 2 returned a usable finding",
          "latencyMs": 1180,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-RECORDS-R1",
            "EVID-POLICY-R1"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Vector Retrieval Specialist",
              "System of Record Specialist",
              "Policy and Constraints Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 4860,
            "toolCalls": 3,
            "elapsedMs": 1378
          }
        },
        {
          "id": "node_3",
          "stepNumber": 3,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage 40.0% below the 80.0% threshold — still missing historical, independent corroboration and policy constraints",
          "latencyMs": 41,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 40.0,
            "independentSources": 2,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": [],
            "continue": true
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "selectionReason": "Coverage 40.0% below the 80.0% threshold — still missing historical, independent corroboration and policy constraints",
          "budgetAtDecision": {
            "tokensUsed": 4860,
            "toolCalls": 3,
            "elapsedMs": 1419
          }
        },
        {
          "id": "node_4",
          "stepNumber": 4,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Retrying the specialists that returned nothing usable",
          "latencyMs": 176,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 40.0,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Historical State Specialist",
              "Independent Corroboration Specialist",
              "Policy and Constraints Specialist"
            ],
            "round": 2
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.7,
              "selected": true
            },
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "Retrying the specialists that returned nothing usable",
          "budgetAtDecision": {
            "tokensUsed": 4860,
            "toolCalls": 3,
            "elapsedMs": 1595
          }
        },
        {
          "id": "node_5",
          "stepNumber": 5,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 0 returned a usable finding",
          "latencyMs": 1102,
          "evidenceIds": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2",
            "EVID-POLICY-R2"
          ],
          "status": "WARNED",
          "inputPayload": {
            "specialists": [
              "Historical State Specialist",
              "Independent Corroboration Specialist",
              "Policy and Constraints Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 0
          },
          "budgetAtDecision": {
            "tokensUsed": 9640,
            "toolCalls": 6,
            "elapsedMs": 2697
          }
        },
        {
          "id": "node_6",
          "stepNumber": 6,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage stalled at 40.0% with historical, independent corroboration and policy constraints still unestablished",
          "latencyMs": 38,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 40.0,
            "independentSources": 2,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": [],
            "continue": false
          },
          "trigger": "NO_PROGRESS",
          "selectionReason": "Coverage stalled at 40.0% with historical, independent corroboration and policy constraints still unestablished",
          "budgetAtDecision": {
            "tokensUsed": 9640,
            "toolCalls": 6,
            "elapsedMs": 2735
          }
        },
        {
          "id": "node_7",
          "stepNumber": 7,
          "agentRole": "Verdict Synthesiser",
          "actionType": "VERDICT_EMISSION",
          "summary": "The evidence is insufficient to settle refund eligibility for order 8812; the policy and corroboration dimensions were never closed.",
          "latencyMs": 385,
          "tokenCostUsd": 0.0024,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-RECORDS-R1"
          ],
          "status": "WARNED",
          "inputPayload": {
            "coveragePercent": 40.0,
            "evidenceCount": 2
          },
          "outputPayload": {
            "verdict": "The evidence is insufficient to settle refund eligibility for order 8812; the policy and corroboration dimensions were never closed."
          },
          "budgetAtDecision": {
            "tokensUsed": 12180,
            "toolCalls": 6,
            "elapsedMs": 3120
          }
        }
      ],
      "evidenceLedger": [
        {
          "id": "EVID-RETRIEVAL-R1",
          "toolName": "Vector Knowledge Base",
          "sourceType": "VECTOR_RAG",
          "summary": "Retrieved the published returns window and two exception notes.",
          "rawPayload": {
            "passages": 3,
            "topSimilarity": 0.82
          },
          "confidence": 0.82,
          "timestamp": "2026-08-26 13:04:53",
          "verified": true
        },
        {
          "id": "EVID-RECORDS-R1",
          "toolName": "System of Record API",
          "sourceType": "API_TOOL",
          "summary": "Order 8812 settled 41 days ago against a 30-day standard window.",
          "rawPayload": {
            "orderId": 8812,
            "ageDays": 41,
            "window": 30
          },
          "confidence": 0.96,
          "timestamp": "2026-08-26 13:04:53",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R1",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Specialist returned no usable finding",
          "rawPayload": {
            "available": false
          },
          "confidence": 0.0,
          "timestamp": "2026-08-26 13:04:53",
          "verified": false
        },
        {
          "id": "EVID-HISTORY-R2",
          "toolName": "Historical State Store",
          "sourceType": "DATABASE",
          "summary": "Specialist returned no usable finding",
          "rawPayload": {
            "available": false
          },
          "confidence": 0.0,
          "timestamp": "2026-08-26 13:04:54",
          "verified": false
        },
        {
          "id": "EVID-CORROBORATION-R2",
          "toolName": "Independent Reputation Service",
          "sourceType": "API_TOOL",
          "summary": "Specialist returned no usable finding",
          "rawPayload": {
            "available": false
          },
          "confidence": 0.0,
          "timestamp": "2026-08-26 13:04:54",
          "verified": false
        },
        {
          "id": "EVID-POLICY-R2",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Specialist returned no usable finding on retry",
          "rawPayload": {
            "available": false
          },
          "confidence": 0.0,
          "timestamp": "2026-08-26 13:04:54",
          "verified": false
        }
      ],
      "claims": [
        {
          "id": "CLAIM-01",
          "statement": "Source grounding evidence supports the conclusion",
          "confidence": 0.82,
          "evidenceRefs": [
            "EVID-RETRIEVAL-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-02",
          "statement": "Structured records evidence supports the conclusion",
          "confidence": 0.96,
          "evidenceRefs": [
            "EVID-RECORDS-R1"
          ],
          "status": "SUPPORTED"
        }
      ]
    },
    {
      "id": "exec_aexather_4419",
      "agentVersion": "Aexather-Agent-v2.3",
      "origin": "LIVE",
      "timestamp": "2026-08-26 11:47:33",
      "title": "Entitlement scope: SSO provisioning confirmed across five dimensions",
      "inputPrompt": "Confirm whether the enterprise tier entitlement includes SSO provisioning for sub-accounts.",
      "status": "SUCCESS",
      "totalLatencyMs": 3684,
      "totalTokenCostUsd": 0.0141,
      "evidenceCoveragePercent": 100.0,
      "finalVerdict": "The enterprise tier includes SSO provisioning for sub-accounts; the governing clause, the entitlement record and an independent read all agree.",
      "nodes": [
        {
          "id": "node_1",
          "stepNumber": 1,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Establishing an initial evidence base across the required dimensions",
          "latencyMs": 186,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 0.0,
            "missingDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ],
            "round": 1
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.85,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.84,
              "selected": true
            },
            {
              "action": "System of Record Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": false
            },
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": false
            }
          ],
          "selectionReason": "Establishing an initial evidence base across the required dimensions",
          "budgetAtDecision": {
            "tokensUsed": 0,
            "toolCalls": 0,
            "elapsedMs": 186
          }
        },
        {
          "id": "node_2",
          "stepNumber": 2,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 3 returned a usable finding",
          "latencyMs": 1204,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 3
          },
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1390
          }
        },
        {
          "id": "node_3",
          "stepNumber": 3,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "latencyMs": 44,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "POLICY_CONSTRAINTS",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 60.0,
            "independentSources": 3,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": [],
            "continue": true
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "selectionReason": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1434
          }
        },
        {
          "id": "node_4",
          "stepNumber": 4,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Dispatching specialists to close historical and independent corroboration",
          "latencyMs": 152,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 60.0,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ],
            "round": 2
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "Dispatching specialists to close historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1586
          }
        },
        {
          "id": "node_5",
          "stepNumber": 5,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 2 specialist(s); 2 returned a usable finding",
          "latencyMs": 1188,
          "evidenceIds": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ]
          },
          "outputPayload": {
            "findings": 2,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2774
          }
        },
        {
          "id": "node_6",
          "stepNumber": 6,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Evidence coverage 100.0% meets the 80.0% threshold",
          "latencyMs": 39,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 100.0,
            "independentSources": 5,
            "missingDimensions": [],
            "contradictions": [],
            "continue": false
          },
          "trigger": "EVIDENCE_SUFFICIENT",
          "selectionReason": "Evidence coverage 100.0% meets the 80.0% threshold",
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2813
          }
        },
        {
          "id": "node_7",
          "stepNumber": 7,
          "agentRole": "Verdict Synthesiser",
          "actionType": "VERDICT_EMISSION",
          "summary": "The enterprise tier includes SSO provisioning for sub-accounts; the governing clause, the entitlement record and an independent read all agree.",
          "latencyMs": 871,
          "tokenCostUsd": 0.0029,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1",
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 100.0,
            "evidenceCount": 5
          },
          "outputPayload": {
            "verdict": "The enterprise tier includes SSO provisioning for sub-accounts; the governing clause, the entitlement record and an independent read all agree."
          },
          "budgetAtDecision": {
            "tokensUsed": 12960,
            "toolCalls": 5,
            "elapsedMs": 3684
          }
        }
      ],
      "evidenceLedger": [
        {
          "id": "EVID-RETRIEVAL-R1",
          "toolName": "Vector Knowledge Base",
          "sourceType": "VECTOR_RAG",
          "summary": "Retrieved four passages that directly ground the question.",
          "rawPayload": {
            "passages": 4,
            "topSimilarity": 0.93
          },
          "confidence": 0.93,
          "timestamp": "2026-08-26 11:47:35",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R1",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Located the governing clause and its effective date.",
          "rawPayload": {
            "clausesMatched": 1,
            "effective": "2026-06-01"
          },
          "confidence": 0.91,
          "timestamp": "2026-08-26 11:47:35",
          "verified": true
        },
        {
          "id": "EVID-RECORDS-R1",
          "toolName": "System of Record API",
          "sourceType": "API_TOOL",
          "summary": "The authoritative record matches the retrieved passages.",
          "rawPayload": {
            "match": true
          },
          "confidence": 0.97,
          "timestamp": "2026-08-26 11:47:35",
          "verified": true
        },
        {
          "id": "EVID-HISTORY-R2",
          "toolName": "Historical State Store",
          "sourceType": "DATABASE",
          "summary": "No amendment has altered the position since the effective date.",
          "rawPayload": {
            "amendmentsSince": 0
          },
          "confidence": 0.89,
          "timestamp": "2026-08-26 11:47:35",
          "verified": true
        },
        {
          "id": "EVID-CORROBORATION-R2",
          "toolName": "Independent Reputation Service",
          "sourceType": "API_TOOL",
          "summary": "An independent read reaches the same conclusion.",
          "rawPayload": {
            "agreesWithRecords": true
          },
          "confidence": 0.86,
          "timestamp": "2026-08-26 11:47:35",
          "verified": true
        }
      ],
      "claims": [
        {
          "id": "CLAIM-01",
          "statement": "Source grounding evidence supports the conclusion",
          "confidence": 0.93,
          "evidenceRefs": [
            "EVID-RETRIEVAL-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-02",
          "statement": "Policy constraints evidence supports the conclusion",
          "confidence": 0.91,
          "evidenceRefs": [
            "EVID-POLICY-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-03",
          "statement": "Structured records evidence supports the conclusion",
          "confidence": 0.97,
          "evidenceRefs": [
            "EVID-RECORDS-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-04",
          "statement": "Historical evidence supports the conclusion",
          "confidence": 0.89,
          "evidenceRefs": [
            "EVID-HISTORY-R2"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-05",
          "statement": "Independent corroboration evidence supports the conclusion",
          "confidence": 0.86,
          "evidenceRefs": [
            "EVID-CORROBORATION-R2"
          ],
          "status": "SUPPORTED"
        }
      ]
    },
    {
      "id": "exec_aexather_4420",
      "agentVersion": "Aexather-Agent-v2.3",
      "origin": "LIVE",
      "timestamp": "2026-08-26 09:15:02",
      "title": "Retention schedule: amended effective date established",
      "inputPrompt": "Establish the effective date of the amended data-retention schedule and whether it applies retroactively.",
      "status": "SUCCESS",
      "totalLatencyMs": 3521,
      "totalTokenCostUsd": 0.0137,
      "evidenceCoveragePercent": 100.0,
      "finalVerdict": "The amended retention schedule took effect on 2026-06-01 and applies prospectively only; no amendment since has altered that.",
      "nodes": [
        {
          "id": "node_1",
          "stepNumber": 1,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Establishing an initial evidence base across the required dimensions",
          "latencyMs": 186,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 0.0,
            "missingDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ],
            "round": 1
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.85,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.84,
              "selected": true
            },
            {
              "action": "System of Record Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": false
            },
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": false
            }
          ],
          "selectionReason": "Establishing an initial evidence base across the required dimensions",
          "budgetAtDecision": {
            "tokensUsed": 0,
            "toolCalls": 0,
            "elapsedMs": 186
          }
        },
        {
          "id": "node_2",
          "stepNumber": 2,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 3 returned a usable finding",
          "latencyMs": 1204,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 3
          },
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1390
          }
        },
        {
          "id": "node_3",
          "stepNumber": 3,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "latencyMs": 44,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "POLICY_CONSTRAINTS",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 60.0,
            "independentSources": 3,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": [],
            "continue": true
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "selectionReason": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1434
          }
        },
        {
          "id": "node_4",
          "stepNumber": 4,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Dispatching specialists to close historical and independent corroboration",
          "latencyMs": 152,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 60.0,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ],
            "round": 2
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "Dispatching specialists to close historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1586
          }
        },
        {
          "id": "node_5",
          "stepNumber": 5,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 2 specialist(s); 2 returned a usable finding",
          "latencyMs": 1188,
          "evidenceIds": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ]
          },
          "outputPayload": {
            "findings": 2,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2774
          }
        },
        {
          "id": "node_6",
          "stepNumber": 6,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Evidence coverage 100.0% meets the 80.0% threshold",
          "latencyMs": 39,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 100.0,
            "independentSources": 5,
            "missingDimensions": [],
            "contradictions": [],
            "continue": false
          },
          "trigger": "EVIDENCE_SUFFICIENT",
          "selectionReason": "Evidence coverage 100.0% meets the 80.0% threshold",
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2813
          }
        },
        {
          "id": "node_7",
          "stepNumber": 7,
          "agentRole": "Verdict Synthesiser",
          "actionType": "VERDICT_EMISSION",
          "summary": "The amended retention schedule took effect on 2026-06-01 and applies prospectively only; no amendment since has altered that.",
          "latencyMs": 708,
          "tokenCostUsd": 0.0029,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1",
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 100.0,
            "evidenceCount": 5
          },
          "outputPayload": {
            "verdict": "The amended retention schedule took effect on 2026-06-01 and applies prospectively only; no amendment since has altered that."
          },
          "budgetAtDecision": {
            "tokensUsed": 12960,
            "toolCalls": 5,
            "elapsedMs": 3521
          }
        }
      ],
      "evidenceLedger": [
        {
          "id": "EVID-RETRIEVAL-R1",
          "toolName": "Vector Knowledge Base",
          "sourceType": "VECTOR_RAG",
          "summary": "Retrieved four passages that directly ground the question.",
          "rawPayload": {
            "passages": 4,
            "topSimilarity": 0.93
          },
          "confidence": 0.93,
          "timestamp": "2026-08-26 09:15:04",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R1",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Located the governing clause and its effective date.",
          "rawPayload": {
            "clausesMatched": 1,
            "effective": "2026-06-01"
          },
          "confidence": 0.91,
          "timestamp": "2026-08-26 09:15:04",
          "verified": true
        },
        {
          "id": "EVID-RECORDS-R1",
          "toolName": "System of Record API",
          "sourceType": "API_TOOL",
          "summary": "The authoritative record matches the retrieved passages.",
          "rawPayload": {
            "match": true
          },
          "confidence": 0.97,
          "timestamp": "2026-08-26 09:15:04",
          "verified": true
        },
        {
          "id": "EVID-HISTORY-R2",
          "toolName": "Historical State Store",
          "sourceType": "DATABASE",
          "summary": "No amendment has altered the position since the effective date.",
          "rawPayload": {
            "amendmentsSince": 0
          },
          "confidence": 0.89,
          "timestamp": "2026-08-26 09:15:04",
          "verified": true
        },
        {
          "id": "EVID-CORROBORATION-R2",
          "toolName": "Independent Reputation Service",
          "sourceType": "API_TOOL",
          "summary": "An independent read reaches the same conclusion.",
          "rawPayload": {
            "agreesWithRecords": true
          },
          "confidence": 0.86,
          "timestamp": "2026-08-26 09:15:04",
          "verified": true
        }
      ],
      "claims": [
        {
          "id": "CLAIM-01",
          "statement": "Source grounding evidence supports the conclusion",
          "confidence": 0.93,
          "evidenceRefs": [
            "EVID-RETRIEVAL-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-02",
          "statement": "Policy constraints evidence supports the conclusion",
          "confidence": 0.91,
          "evidenceRefs": [
            "EVID-POLICY-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-03",
          "statement": "Structured records evidence supports the conclusion",
          "confidence": 0.97,
          "evidenceRefs": [
            "EVID-RECORDS-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-04",
          "statement": "Historical evidence supports the conclusion",
          "confidence": 0.89,
          "evidenceRefs": [
            "EVID-HISTORY-R2"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-05",
          "statement": "Independent corroboration evidence supports the conclusion",
          "confidence": 0.86,
          "evidenceRefs": [
            "EVID-CORROBORATION-R2"
          ],
          "status": "SUPPORTED"
        }
      ]
    },
    {
      "id": "exec_aexather_4421",
      "agentVersion": "Aexather-Agent-v2.3",
      "origin": "LIVE",
      "timestamp": "2026-08-25 17:02:44",
      "title": "Processor authority: delegated signing confirmed",
      "inputPrompt": "Determine whether the named processor holds delegated authority to sign data-transfer addenda.",
      "status": "SUCCESS",
      "totalLatencyMs": 3760,
      "totalTokenCostUsd": 0.0144,
      "evidenceCoveragePercent": 100.0,
      "finalVerdict": "The processor holds delegated signing authority for transfer addenda under the current delegation, corroborated independently.",
      "nodes": [
        {
          "id": "node_1",
          "stepNumber": 1,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Establishing an initial evidence base across the required dimensions",
          "latencyMs": 186,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 0.0,
            "missingDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ],
            "round": 1
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.85,
              "selected": true
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.84,
              "selected": true
            },
            {
              "action": "System of Record Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": false
            },
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": false
            }
          ],
          "selectionReason": "Establishing an initial evidence base across the required dimensions",
          "budgetAtDecision": {
            "tokensUsed": 0,
            "toolCalls": 0,
            "elapsedMs": 186
          }
        },
        {
          "id": "node_2",
          "stepNumber": 2,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 3 specialist(s); 3 returned a usable finding",
          "latencyMs": 1204,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Vector Retrieval Specialist",
              "Policy and Constraints Specialist",
              "System of Record Specialist"
            ]
          },
          "outputPayload": {
            "findings": 3,
            "conclusive": 3
          },
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1390
          }
        },
        {
          "id": "node_3",
          "stepNumber": 3,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "latencyMs": 44,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "POLICY_CONSTRAINTS",
              "STRUCTURED_RECORDS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 60.0,
            "independentSources": 3,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": [],
            "continue": true
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "selectionReason": "Coverage 60.0% below the 80.0% threshold — still missing historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1434
          }
        },
        {
          "id": "node_4",
          "stepNumber": 4,
          "agentRole": "Adaptive Router",
          "actionType": "INTENT_ROUTING",
          "summary": "Dispatching specialists to close historical and independent corroboration",
          "latencyMs": 152,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 60.0,
            "missingDimensions": [
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION"
            ],
            "contradictions": []
          },
          "outputPayload": {
            "selected": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ],
            "round": 2
          },
          "trigger": "INSUFFICIENT_COVERAGE",
          "candidates": [
            {
              "action": "Historical State Specialist",
              "score": 0.82,
              "selected": true
            },
            {
              "action": "Independent Corroboration Specialist",
              "score": 0.83,
              "selected": true
            },
            {
              "action": "Vector Retrieval Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "System of Record Specialist",
              "score": 0.0,
              "selected": false
            },
            {
              "action": "Policy and Constraints Specialist",
              "score": 0.0,
              "selected": false
            }
          ],
          "selectionReason": "Dispatching specialists to close historical and independent corroboration",
          "budgetAtDecision": {
            "tokensUsed": 5340,
            "toolCalls": 3,
            "elapsedMs": 1586
          }
        },
        {
          "id": "node_5",
          "stepNumber": 5,
          "agentRole": "Specialist Executor",
          "actionType": "TOOL_INVOCATION",
          "summary": "Dispatched 2 specialist(s); 2 returned a usable finding",
          "latencyMs": 1188,
          "evidenceIds": [
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "specialists": [
              "Historical State Specialist",
              "Independent Corroboration Specialist"
            ]
          },
          "outputPayload": {
            "findings": 2,
            "conclusive": 2
          },
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2774
          }
        },
        {
          "id": "node_6",
          "stepNumber": 6,
          "agentRole": "Evidence Engine",
          "actionType": "INVARIANT_GUARD",
          "summary": "Evidence coverage 100.0% meets the 80.0% threshold",
          "latencyMs": 39,
          "evidenceIds": [],
          "status": "COMPLETED",
          "inputPayload": {
            "coveredDimensions": [
              "SOURCE_GROUNDING",
              "STRUCTURED_RECORDS",
              "HISTORICAL",
              "INDEPENDENT_CORROBORATION",
              "POLICY_CONSTRAINTS"
            ]
          },
          "outputPayload": {
            "coveragePercent": 100.0,
            "independentSources": 5,
            "missingDimensions": [],
            "contradictions": [],
            "continue": false
          },
          "trigger": "EVIDENCE_SUFFICIENT",
          "selectionReason": "Evidence coverage 100.0% meets the 80.0% threshold",
          "budgetAtDecision": {
            "tokensUsed": 9820,
            "toolCalls": 5,
            "elapsedMs": 2813
          }
        },
        {
          "id": "node_7",
          "stepNumber": 7,
          "agentRole": "Verdict Synthesiser",
          "actionType": "VERDICT_EMISSION",
          "summary": "The processor holds delegated signing authority for transfer addenda under the current delegation, corroborated independently.",
          "latencyMs": 947,
          "tokenCostUsd": 0.0029,
          "evidenceIds": [
            "EVID-RETRIEVAL-R1",
            "EVID-POLICY-R1",
            "EVID-RECORDS-R1",
            "EVID-HISTORY-R2",
            "EVID-CORROBORATION-R2"
          ],
          "status": "COMPLETED",
          "inputPayload": {
            "coveragePercent": 100.0,
            "evidenceCount": 5
          },
          "outputPayload": {
            "verdict": "The processor holds delegated signing authority for transfer addenda under the current delegation, corroborated independently."
          },
          "budgetAtDecision": {
            "tokensUsed": 12960,
            "toolCalls": 5,
            "elapsedMs": 3760
          }
        }
      ],
      "evidenceLedger": [
        {
          "id": "EVID-RETRIEVAL-R1",
          "toolName": "Vector Knowledge Base",
          "sourceType": "VECTOR_RAG",
          "summary": "Retrieved four passages that directly ground the question.",
          "rawPayload": {
            "passages": 4,
            "topSimilarity": 0.93
          },
          "confidence": 0.93,
          "timestamp": "2026-08-25 17:02:46",
          "verified": true
        },
        {
          "id": "EVID-POLICY-R1",
          "toolName": "Policy Document Index",
          "sourceType": "DOCUMENT",
          "summary": "Located the governing clause and its effective date.",
          "rawPayload": {
            "clausesMatched": 1,
            "effective": "2026-06-01"
          },
          "confidence": 0.91,
          "timestamp": "2026-08-25 17:02:46",
          "verified": true
        },
        {
          "id": "EVID-RECORDS-R1",
          "toolName": "System of Record API",
          "sourceType": "API_TOOL",
          "summary": "The authoritative record matches the retrieved passages.",
          "rawPayload": {
            "match": true
          },
          "confidence": 0.97,
          "timestamp": "2026-08-25 17:02:46",
          "verified": true
        },
        {
          "id": "EVID-HISTORY-R2",
          "toolName": "Historical State Store",
          "sourceType": "DATABASE",
          "summary": "No amendment has altered the position since the effective date.",
          "rawPayload": {
            "amendmentsSince": 0
          },
          "confidence": 0.89,
          "timestamp": "2026-08-25 17:02:46",
          "verified": true
        },
        {
          "id": "EVID-CORROBORATION-R2",
          "toolName": "Independent Reputation Service",
          "sourceType": "API_TOOL",
          "summary": "An independent read reaches the same conclusion.",
          "rawPayload": {
            "agreesWithRecords": true
          },
          "confidence": 0.86,
          "timestamp": "2026-08-25 17:02:46",
          "verified": true
        }
      ],
      "claims": [
        {
          "id": "CLAIM-01",
          "statement": "Source grounding evidence supports the conclusion",
          "confidence": 0.93,
          "evidenceRefs": [
            "EVID-RETRIEVAL-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-02",
          "statement": "Policy constraints evidence supports the conclusion",
          "confidence": 0.91,
          "evidenceRefs": [
            "EVID-POLICY-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-03",
          "statement": "Structured records evidence supports the conclusion",
          "confidence": 0.97,
          "evidenceRefs": [
            "EVID-RECORDS-R1"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-04",
          "statement": "Historical evidence supports the conclusion",
          "confidence": 0.89,
          "evidenceRefs": [
            "EVID-HISTORY-R2"
          ],
          "status": "SUPPORTED"
        },
        {
          "id": "CLAIM-05",
          "statement": "Independent corroboration evidence supports the conclusion",
          "confidence": 0.86,
          "evidenceRefs": [
            "EVID-CORROBORATION-R2"
          ],
          "status": "SUPPORTED"
        }
      ]
    }
  ];

export const DEMO_CONTRACTS: BehavioralContract[] = [
    {
      "id": "CONTRACT-01",
      "title": "Every claim rests on evidence",
      "description": "A verdict is only as good as what supports it. Each claim must cite at least one ledger entry and clear the runtime's own usable-confidence floor.",
      "expression": "execution.claims.all(c, c.evidenceRefs.size() >= 1 && c.confidence >= 0.5)",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "evaluationsCount": 1543,
      "passRatePercent": 99.4,
      "lastViolatedAt": "2026-08-26 14:22:12",
      "indeterminateCount": 0
    },
    {
      "id": "CONTRACT-02",
      "title": "Contradictions are never concluded over",
      "description": "The runtime must not emit a verdict while two sources still disagree on a dimension. A confident answer the evidence does not support is the failure this platform exists to catch.",
      "expression": "execution.nodes.filter(n, n.actionType == \"INVARIANT_GUARD\").all(n, !has(n.outputPayload.contradictions) || n.outputPayload.contradictions.size() == 0)",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "evaluationsCount": 1543,
      "passRatePercent": 98.8,
      "lastViolatedAt": "2026-08-26 14:22:12",
      "indeterminateCount": 0
    },
    {
      "id": "CONTRACT-03",
      "title": "Independence behind every conclusion",
      "description": "A concluded run must rest on at least two distinct tools. One source called twice is not corroboration, however confident it sounds.",
      "expression": "execution.status != \"SUCCESS\" || execution.evidenceLedger.filter(e, e.verified).size() >= 2",
      "severity": "HIGH",
      "status": "ACTIVE",
      "evaluationsCount": 1543,
      "passRatePercent": 100.0,
      "indeterminateCount": 0
    },
    {
      "id": "CONTRACT-04",
      "title": "Reasoning and latency budget bound",
      "description": "An adaptive loop decides for itself when to stop, so it needs a limit it cannot reason past. Runs stay within eight decision steps and five seconds end to end.",
      "expression": "execution.nodes.size() <= 8 && execution.totalLatencyMs <= 5000",
      "severity": "MEDIUM",
      "status": "ACTIVE",
      "evaluationsCount": 890,
      "passRatePercent": 100.0,
      "indeterminateCount": 0
    },
    {
      "id": "CONTRACT-05",
      "title": "Coverage floor before a verdict",
      "description": "Draft. Would require every concluded run to have closed at least four of the five evidence dimensions before the synthesiser is allowed to speak.",
      "expression": "execution.status != \"SUCCESS\" || execution.evidenceCoveragePercent >= 80.0",
      "severity": "HIGH",
      "status": "DRAFT",
      "evaluationsCount": 0,
      "passRatePercent": null,
      "indeterminateCount": 0
    }
  ];

export const DEMO_COUNTERFACTUAL: CounterfactualExperiment = {
    "id": "EXP-A7C21F94E0B3",
    "originalTraceId": "exec_aexather_4417",
    "failureDescription": "exec_aexather_4417 concluded as contract violation with evidence coverage of 60.0%",
    "originalVerdict": "Sublicensing appears permitted for aggregated derivatives, though the governing clause could not be located and two sources disagree on scope.",
    "expectedVerdict": "A conclusion meeting the configured evidence coverage threshold, with every claim citing evidence",
    "hypothesizedCause": "Baseline reproduced across 1 replay(s) (contract violation at 60.0% coverage, 6 evidence entries, 5 claim(s)) on a model that reports deterministic output. The largest single effect came from: Make the policy-specialist available with a widened index (78%)",
    "recommendedFix": "Adopt: Make the policy-specialist available with a widened index",
    "status": "RESOLVED",
    "perturbations": [
      {
        "id": "PERT-01",
        "type": "TOOL_INJECTION",
        "description": "Make the policy-specialist available with a widened index",
        "diffSummary": "Coverage 60.0% → 100.0% (+40.0), outcome contract violation → SUCCESS",
        "resultingStatus": "SUCCESS",
        "verdict": "Amendment 2 restricts derivative use to internal purposes; sublicensing of aggregated derivatives is not permitted.",
        "attributionScorePercent": 78,
        "isFix": true
      },
      {
        "id": "PERT-02",
        "type": "TOOL_INJECTION",
        "description": "Make the corroboration-specialist available a second time",
        "diffSummary": "Coverage 60.0% → 80.0% (+20.0), outcome contract violation → SUCCESS",
        "resultingStatus": "SUCCESS",
        "verdict": "The independent read is withdrawn on re-query; the amendment history stands unopposed.",
        "attributionScorePercent": 70,
        "isFix": true
      },
      {
        "id": "PERT-03",
        "type": "CONTEXT_COMPRESSION",
        "description": "Require confidence of at least 0.30 for a finding to count as evidence",
        "diffSummary": "Coverage 60.0% → 80.0% (+20.0), outcome contract violation → contract violation",
        "resultingStatus": "CONTRACT_VIOLATION",
        "verdict": "Admitting the weak policy readings closes the dimension but the claims still cite nothing.",
        "attributionScorePercent": 15,
        "isFix": false
      },
      {
        "id": "PERT-04",
        "type": "PROMPT_MUTATION",
        "description": "Rewrite the system prompt for policy-specialist",
        "diffSummary": "Coverage 60.0% → 60.0% (+0.0), outcome contract violation → contract violation",
        "resultingStatus": "CONTRACT_VIOLATION",
        "verdict": "Sharpening the instruction did not surface a clause the index does not contain.",
        "attributionScorePercent": 0,
        "isFix": false
      }
    ]
  };

export const DEMO_REGRESSION_TESTS: RegressionTestCase[] = [
    {
      "id": "REG-AGENT-001",
      "originExecutionId": "exec_aexather_4417",
      "title": "A verdict may not rest on an uncited claim",
      "inputQuery": "Establish whether vendor 44 is permitted to sublicense the aggregated dataset under its current agreement.",
      "expectedOutcome": "Must conclude successfully with at least 80.0% evidence coverage and satisfy CONTRACT-01",
      "contractsEnforced": [
        "CONTRACT-01"
      ],
      "expectedStatus": "SUCCESS",
      "minimumCoveragePercent": 80.0,
      "lastRunStatus": "NOT_RUN",
      "latencyTargetMs": 8360,
      "addedDate": "2026-08-26"
    },
    {
      "id": "REG-AGENT-002",
      "originExecutionId": "exec_aexather_4418",
      "title": "A stalled investigation must not report a conclusion",
      "inputQuery": "Determine whether order 8812 qualifies for a refund under the published returns policy.",
      "expectedOutcome": "Must conclude successfully with at least 80.0% evidence coverage",
      "contractsEnforced": [
        "CONTRACT-01"
      ],
      "expectedStatus": "SUCCESS",
      "minimumCoveragePercent": 80.0,
      "lastRunStatus": "NOT_RUN",
      "latencyTargetMs": 6240,
      "addedDate": "2026-08-26"
    },
    {
      "id": "REG-AGENT-003",
      "originExecutionId": "exec_aexather_4417",
      "title": "Two sources that disagree must not be concluded over",
      "inputQuery": "Establish whether vendor 44 may sublicense under the amended derivative-rights clause.",
      "expectedOutcome": "Must conclude successfully with at least 80.0% evidence coverage and satisfy CONTRACT-02",
      "contractsEnforced": [
        "CONTRACT-02"
      ],
      "expectedStatus": "SUCCESS",
      "minimumCoveragePercent": 80.0,
      "lastRunStatus": "NOT_RUN",
      "latencyTargetMs": 8360,
      "addedDate": "2026-08-25"
    },
    {
      "id": "REG-AGENT-004",
      "originExecutionId": "exec_aexather_4420",
      "title": "An effective date must be corroborated independently",
      "inputQuery": "Establish the effective date of the amended data-retention schedule and whether it applies retroactively.",
      "expectedOutcome": "Must conclude successfully with at least 80.0% evidence coverage and satisfy CONTRACT-03",
      "contractsEnforced": [
        "CONTRACT-03"
      ],
      "expectedStatus": "SUCCESS",
      "minimumCoveragePercent": 80.0,
      "lastRunStatus": "NOT_RUN",
      "latencyTargetMs": 7042,
      "addedDate": "2026-08-24"
    }
  ];

export const DEMO_CANDIDATES: CandidateVersion[] = [
    {
      "version": "Aexather Agent v2.4 (Widened Policy Index + Retry)",
      "createdAt": "2026-08-26 15:10:00",
      "status": "CANDIDATE",
      "changesSummary": [
        "Policy index widened to the full clause corpus, closing the dimension that stalled exec_aexather_4417",
        "A specialist that returns nothing usable is retried once, with the prompt saying so",
        "Independent corroboration is dispatched whenever two sources disagree on a dimension"
      ],
      "shadowComparison": {
        "totalEvaluations": 1543,
        "agreementRatePercent": 99.2,
        "latencyDeltaMs": -720,
        "costDeltaPercent": -28.5
      },
      "regressionRunId": null,
      "accuracyPercent": null,
      "contractPassRatePercent": null,
      "contractEvaluations": 0,
      "regressionCount": null,
      "previousFailuresFixed": null,
      "p95LatencyMs": null,
      "costPerRunUsd": null
    },
    {
      "version": "Aexather Agent v2.3 (Baseline)",
      "createdAt": "2026-08-15 10:00:00",
      "status": "PRODUCTION",
      "changesSummary": [
        "Five-specialist registry with a fixed 80% evidence-coverage threshold",
        "No retry: one weak reading forfeits a dimension for the whole run"
      ],
      "regressionRunId": null,
      "accuracyPercent": null,
      "contractPassRatePercent": null,
      "contractEvaluations": 0,
      "regressionCount": null,
      "previousFailuresFixed": null,
      "p95LatencyMs": null,
      "costPerRunUsd": null
    }
  ];
