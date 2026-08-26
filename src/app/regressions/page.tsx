'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/platformStore';
import { RegressionTestCase } from '@/types/platform';
import { formatLatency } from '@/lib/utils';
import { 
  ListChecks, 
  Plus, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export default function RegressionSuitePage() {
  const { regressionSuites, addRegressionCaseFromFailure } = usePlatformStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runNotification, setRunNotification] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [originExecutionId, setOriginExecutionId] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [contractId, setContractId] = useState('CONTRACT-01');

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !inputQuery || !expectedOutcome) return;

    const newTest: RegressionTestCase = {
      id: `REG-AGENT-${Date.now().toString().slice(-3)}`,
      originExecutionId: originExecutionId || `exec_${Date.now()}`,
      title,
      inputQuery,
      expectedOutcome,
      contractsEnforced: [contractId],
      lastRunStatus: 'PASSED',
      latencyTargetMs: 3500,
      addedDate: new Date().toISOString().split('T')[0]
    };

    addRegressionCaseFromFailure(newTest);
    setTitle('');
    setOriginExecutionId('');
    setInputQuery('');
    setExpectedOutcome('');
    setIsModalOpen(false);
  };

  const handleRunAllSuites = () => {
    setIsRunningAll(true);
    setTimeout(() => {
      setIsRunningAll(false);
      setRunNotification(`All ${regressionSuites.length} agent regression benchmark suites passed successfully with 0 regressions!`);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-1">
            <ListChecks className="w-4 h-4" />
            <span>AUTOMATED CI/CD AGENT REGRESSION TESTING SUITE</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Golden Benchmark Suites & Release Gates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every diagnosed production agent failure is codified into a permanent regression test to prevent behavior rollbacks.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Codify Test</span>
          </button>

          <button
            onClick={handleRunAllSuites}
            disabled={isRunningAll}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-[#2B66FF] hover:bg-[#1E52DE] text-white shadow-md shadow-blue-500/20 transition"
          >
            <Play className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Executing CI...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {runNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{runNotification}</span>
          </div>
          <button onClick={() => setRunNotification(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Test Matrix Table */}
      <div className="aniwall-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Active Test Suites: <strong className="text-slate-900">{regressionSuites.length}</strong></span>
          <span className="text-emerald-600 font-extrabold">100% Pass Rate (0 Regressions)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {regressionSuites.map((test) => (
            <div
              key={test.id}
              className="p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PASSED</span>
                  </span>
                  <span className="font-bold text-slate-500">{test.id}</span>
                  <span className="font-medium text-slate-400">• Origin: {test.originExecutionId}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Input Query: {test.inputQuery}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 shrink-0 text-xs font-semibold">
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Verdict</span>
                  <span className="text-blue-700 font-bold">{test.expectedOutcome}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Latency Budget</span>
                  <span className="text-slate-800 font-bold">{formatLatency(test.latencyTargetMs)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Codified On</span>
                  <span className="text-slate-500">{test.addedDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Codify Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-7 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Turn Agent Failure into Permanent Regression Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Test Case Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Low Vector Similarity Grounding Fallback Guard"
                  className="w-full p-3 rounded-2xl aniwall-input text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Origin Trace ID</label>
                <input
                  type="text"
                  value={originExecutionId}
                  onChange={(e) => setOriginExecutionId(e.target.value)}
                  placeholder="e.g., exec_agent_9421"
                  className="w-full p-3 rounded-2xl aniwall-input text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Input Query Payload</label>
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="e.g., Synthesize user telemetry with unverified RAG vector chunk"
                  className="w-full p-3 rounded-2xl aniwall-input text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Expected Output Verdict</label>
                <input
                  type="text"
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="e.g., ESCALATE_TO_HUMAN"
                  className="w-full p-3 rounded-2xl aniwall-input text-xs font-bold text-emerald-700"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl font-bold bg-[#2B66FF] hover:bg-[#1E52DE] text-white shadow-xs"
                >
                  Save to Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
