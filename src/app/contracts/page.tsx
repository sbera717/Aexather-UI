'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { usePlatformStore } from '@/store/platformStore';
import { formatPercent } from '@/lib/utils';
import { 
  ShieldCheck, 
  Plus, 
  Play, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles,
  Loader2,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// Helper to generate some fake historical data for the sparkline trend
const generateHistoricalData = (basePassRate: number) => {
  return Array.from({ length: 14 }).map((_, i) => {
    // Generate slight fluctuations around the base rate, improving over time
    const variance = (Math.random() * 5) - 2; 
    const trend = i * 0.2;
    return {
      day: i,
      rate: Math.min(100, Math.max(0, basePassRate - 5 + trend + variance))
    };
  });
};

export default function BehavioralContractsPage() {
  const { contracts, toggleContractStatus, addContract, testContract, selectedTraceId } =
    usePlatformStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newExpression, setNewExpression] = useState('');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');

  // Typing animation for demo purposes
  React.useEffect(() => {
    if (isModalOpen) {
      setNewTitle('');
      setNewDescription('');
      setNewExpression('');
      let isCancelled = false;

      const typeText = async (setter: React.Dispatch<React.SetStateAction<string>>, text: string, delay = 20) => {
        for (let i = 0; i <= text.length; i++) {
          if (isCancelled) return;
          setter(text.slice(0, i));
          await new Promise(r => setTimeout(r, delay));
        }
      };

      const runDemo = async () => {
        await new Promise(r => setTimeout(r, 400));
        if (isCancelled) return;
        await typeText(setNewTitle, 'Strict Vector Similarity Threshold Guard');
        
        await new Promise(r => setTimeout(r, 300));
        if (isCancelled) return;
        await typeText(setNewDescription, 'Reject RAG chunks with similarity score below 0.75');
        
        await new Promise(r => setTimeout(r, 300));
        if (isCancelled) return;
        await typeText(setNewExpression, 'execution.claims.all(c, c.evidenceRefs.size() >= 1 && c.confidence >= 0.75)', 15);
      };

      void runDemo();

      return () => {
        isCancelled = true;
      };
    }
  }, [isModalOpen]);

  // Memoize historical data so charts don't re-jitter on re-render
  const historicalDataMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    contracts.forEach(c => {
      // A contract with no decided evaluations has no trend either; the sparkline sits flat at
      // full height rather than drawing a fall from a rate that was never measured.
      map[c.id] = generateHistoricalData(c.passRatePercent ?? 100);
    });
    return map;
  }, [contracts]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newExpression) return;

    setIsSaving(true);
    try {
      // The backend compiles the CEL before it writes, so an expression that will never yield a
      // verdict is refused here rather than discovered later as a wave of indeterminate results.
      const created = await addContract({
        title: newTitle,
        description: newDescription || 'Enforced deterministic invariant rule.',
        expression: newExpression,
        severity: newSeverity,
      });

      toast.success(`${created.id} saved as ${created.status}. Activate it to start judging traffic.`);
      setNewTitle('');
      setNewDescription('');
      setNewExpression('');
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the contract.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (contractId: string) => {
    try {
      await toggleContractStatus(contractId);
    } catch (error) {
      // Activation compiles the expression server-side and can legitimately fail.
      toast.error(error instanceof Error ? error.message : 'Could not change the contract status.');
    }
  };

  const handleRunSimulation = async (contractId: string) => {
    setTestingId(contractId);
    setTestResult(null);
    try {
      setTestResult(await testContract(contractId, selectedTraceId || undefined));
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : 'The rule could not be evaluated.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-16 pt-8 px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-sm font-bold text-emerald-600 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span>BEHAVIORAL INVARIANTS & POLICIES</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            Declarative Policy Engine (CEL)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-2xl">
            Enforce deterministic safety invariants on multi-agent reasoning graphs, tool schemas, and claim citations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract Rule</span>
        </button>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {contracts.map((contract) => {
          const isActive = contract.status === 'ACTIVE';
          const isCritical = contract.severity === 'CRITICAL';
          const histData = historicalDataMap[contract.id] || [];

          return (
            <div
              key={contract.id}
              className={`aniwall-card p-8 transition-all duration-300 space-y-6 ${
                isActive
                  ? 'bg-white shadow-sm hover:shadow-md'
                  : 'bg-[#F8FAFD] opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 tracking-wider">
                      {contract.id}
                    </span>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wider ${
                      isCritical
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {contract.severity}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {contract.title}
                  </h3>
                </div>

                <button
                  onClick={() => void handleToggle(contract.id)}
                  className="text-slate-400 hover:text-slate-700 transition transform hover:scale-110 shrink-0"
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300" />
                  )}
                </button>
              </div>

              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {contract.description}
              </p>

              {/* Code Expression Block */}
              <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5] text-sm font-mono text-indigo-700 overflow-x-auto shadow-inner">
                <code>{contract.expression}</code>
              </div>

              {/* Stats & Sparkline Chart */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Pass Rate Trend</span>
                  <div className="flex items-baseline space-x-2">
                    <span
                      className={`text-2xl font-bold ${
                        contract.passRatePercent == null ? 'text-slate-400' : 'text-emerald-600'
                      }`}
                    >
                      {formatPercent(contract.passRatePercent)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {contract.passRatePercent == null
                        ? 'Not yet evaluated'
                        : `${contract.evaluationsCount} Evals`}
                    </span>
                  </div>
                </div>

                {/* Sparkline visualization */}
                <div className="w-32 h-12 opacity-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={histData}>
                      <YAxis domain={['dataMin - 5', 100]} hide />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke={isActive ? "#10B981" : "#94A3B8"} 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <button
                  onClick={() => void handleRunSimulation(contract.id)}
                  disabled={testingId === contract.id}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-600 font-bold transition text-xs disabled:opacity-50"
                >
                  {testingId === contract.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{testingId === contract.id ? 'Evaluating…' : 'Test Rule'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rule evaluation strip — pending while the expression runs, verdict once it lands */}
      {(testingId || testResult) && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 p-4 rounded-2xl bg-indigo-900 border border-indigo-700 text-sm font-bold text-white flex items-center justify-between gap-6 shadow-2xl z-50 min-w-[500px] max-w-[720px] animate-in slide-in-from-bottom-5">
          <div className="flex items-center space-x-3">
            {testingId ? (
              <Loader2 className="w-5 h-5 text-indigo-300 animate-spin shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <span className="leading-relaxed">
              {testingId
                ? `Compiling ${testingId} and evaluating it against the selected trace…`
                : testResult}
            </span>
          </div>
          {!testingId && (
            <button
              onClick={() => setTestResult(null)}
              className="text-indigo-400 hover:text-white transition shrink-0"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center">
          <div className="w-full max-w-xl mt-12 mb-12 rounded-xl bg-white p-0 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <h2 className="text-xl font-medium text-slate-900">Add Behavioral Invariant Rule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>

            <form id="contract-form" onSubmit={handleCreateContract} className="px-8 py-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Rule Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Strict Vector Similarity Threshold Guard"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Reject RAG chunks with similarity score below 0.75"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">CEL / Invariant Expression</label>
                <textarea
                  value={newExpression}
                  onChange={(e) => setNewExpression(e.target.value)}
                  placeholder="execution.claims.all(c, c.evidenceRefs.size() >= 1 && c.confidence >= 0.75)"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 font-mono text-sm text-indigo-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Severity Tier</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white"
                >
                  <option value="CRITICAL">CRITICAL (Rejects Execution on Breach)</option>
                  <option value="HIGH">HIGH (Flags Warning & Degrades Confidence)</option>
                  <option value="MEDIUM">MEDIUM (Telemetry Audit Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-center space-x-4 pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-2.5 rounded-lg border border-indigo-500 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
                >
                  {isSaving ? 'Compiling…' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
