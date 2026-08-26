import { create } from 'zustand';
import {
  ExecutionTrace,
  BehavioralContract,
  CounterfactualExperiment,
  RegressionTestCase,
  CandidateVersion
} from '@/types/platform';
import {
  MOCK_TRACES,
  MOCK_CONTRACTS,
  MOCK_COUNTERFACTUAL,
  MOCK_REGRESSION_TESTS,
  MOCK_CANDIDATES
} from '@/data/mockData';

interface PlatformState {
  traces: ExecutionTrace[];
  selectedTraceId: string;
  selectedNodeId: string | null;
  contracts: BehavioralContract[];
  counterfactual: CounterfactualExperiment;
  regressionSuites: RegressionTestCase[];
  candidates: CandidateVersion[];
  isCommandPaletteOpen: boolean;

  // Actions
  setSelectedTraceId: (traceId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  toggleContractStatus: (contractId: string) => void;
  addContract: (contract: BehavioralContract) => void;
  addRegressionCaseFromFailure: (testCase: RegressionTestCase) => void;
  promoteCandidate: (version: string) => void;
  rollbackVersion: (version: string) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  traces: MOCK_TRACES,
  selectedTraceId: MOCK_TRACES[0].id,
  selectedNodeId: MOCK_TRACES[0].nodes[0].id,
  contracts: MOCK_CONTRACTS,
  counterfactual: MOCK_COUNTERFACTUAL,
  regressionSuites: MOCK_REGRESSION_TESTS,
  candidates: MOCK_CANDIDATES,
  isCommandPaletteOpen: false,

  setSelectedTraceId: (traceId) => {
    set((state) => {
      const trace = state.traces.find((t) => t.id === traceId) || state.traces[0];
      return {
        selectedTraceId: traceId,
        selectedNodeId: trace?.nodes[0]?.id || null,
      };
    });
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

  toggleContractStatus: (contractId) => {
    set((state) => ({
      contracts: state.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: c.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' }
          : c
      ),
    }));
  },

  addContract: (contract) => {
    set((state) => ({
      contracts: [contract, ...state.contracts],
    }));
  },

  addRegressionCaseFromFailure: (testCase) => {
    set((state) => ({
      regressionSuites: [testCase, ...state.regressionSuites],
    }));
  },

  promoteCandidate: (version) => {
    set((state) => ({
      candidates: state.candidates.map((c) => {
        if (c.version === version) return { ...c, status: 'PRODUCTION' };
        if (c.status === 'PRODUCTION') return { ...c, status: 'ROLLED_BACK' };
        return c;
      }),
    }));
  },

  rollbackVersion: (version) => {
    set((state) => ({
      candidates: state.candidates.map((c) => {
        if (c.version === version) return { ...c, status: 'ROLLED_BACK' };
        return c;
      }),
    }));
  },
}));
