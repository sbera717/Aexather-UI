'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/platformStore';
import { humanize, shortId } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  Loader2,
  RotateCw
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function CounterfactualDebuggerPage() {
  const { counterfactual, diagnoseTrace, codifyFailure } = usePlatformStore();
  const [activePerturbationId, setActivePerturbationId] = useState<string>(
    counterfactual?.perturbations[0]?.id || ''
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [armsReplayed, setArmsReplayed] = useState(0);

  /**
   * Re-runs the experiment: reproduce the baseline, replay it once per arm, score each.
   *
   * Minutes of work against a served model, so the backend hands back a job and the store polls it.
   * It fails rather than caveats when the run cannot serve as a baseline — no recorded
   * configuration, or it does not reproduce — and that reason is worth showing verbatim.
   */
  const handleRediagnose = async () => {
    if (!counterfactual) return;
    setIsDiagnosing(true);
    setArmsReplayed(0);
    try {
      const experiment = await diagnoseTrace(counterfactual.originalTraceId, (index) =>
        setArmsReplayed(index + 1)
      );
      setActivePerturbationId(experiment.perturbations[0]?.id ?? '');
      toast.success(`Diagnosis complete: ${experiment.perturbations.length} arm(s) scored.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Diagnosis failed.');
    } finally {
      setIsDiagnosing(false);
      setArmsReplayed(0);
    }
  };

  /** Pins this failure shut so it cannot come back silently — the loop the platform exists for. */
  const handleCodify = async () => {
    if (!counterfactual) return;
    try {
      const testCase = await codifyFailure(counterfactual.originalTraceId);
      toast.success(`${testCase.id} added to the regression suite.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not codify this failure.');
    }
  };

  if (!counterfactual) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No counterfactual failure experiments found.
      </div>
    );
  }

  const selectedPerturbation = counterfactual.perturbations.find(p => p.id === activePerturbationId) || counterfactual.perturbations[0];

  // Map data for Recharts Pie Chart
  const chartData = counterfactual.perturbations.map(p => ({
    name: humanize(p.type),
    value: p.attributionScorePercent,
    color: p.isFix ? '#4F46E5' : p.type === 'PROMPT_MUTATION' ? '#8B5CF6' : '#94A3B8'
  }));

  return (
    <div className="space-y-10 pb-16 pt-8 px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Header & Failure Case Overview */}
      <div className="aniwall-card p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-indigo-600 mb-2">
              <FlaskConical className="w-5 h-5" />
              <span>CAUSAL ATTRIBUTION DEBUGGER</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">{counterfactual.id}</span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-slate-900">
              {counterfactual.failureDescription}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => void handleRediagnose()}
              disabled={isDiagnosing}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-70 disabled:cursor-wait"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>
                    {armsReplayed === 0
                      ? 'Reproducing baseline…'
                      : `Replaying arm ${armsReplayed} of ${counterfactual.perturbations.length}…`}
                  </span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  <span>Re-run Diagnosis</span>
                </>
              )}
            </button>

            <span className={`px-5 py-2 rounded-full text-sm font-semibold shadow-sm ${
              counterfactual.status === 'RESOLVED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {humanize(counterfactual.status)}
            </span>
          </div>
        </div>

        {/* Causal Attribution Visual Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Root-Cause Impact (Why the AI agent failed)
            </span>
            <p className="text-slate-700 font-light text-base leading-relaxed">
              We replayed the run {counterfactual.perturbations.length} times, changing exactly one thing each
              time. Each score is an effect size measured against a reproduced baseline — not a share of one
              cause, which is why they need not sum to a hundred.
            </p>
          </div>
          
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Original Failed Run vs Controlled Perturbations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols: Original Failed Run */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
           <div className="p-8 rounded-[24px] bg-[#FFF5F5] border border-[#FFD6D6] space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-rose-200 pb-4">
              <span className="text-sm font-bold text-rose-800 uppercase tracking-wider flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Original Trace (Failed)</span>
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Actual Erroneous Verdict
                </span>
                <p className="font-bold text-rose-900 p-4 rounded-xl bg-white border border-rose-200 shadow-sm text-sm">
                  {counterfactual.originalVerdict}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Target Grounded Verdict
                </span>
                <p className="font-bold text-emerald-900 p-4 rounded-xl bg-white border border-emerald-200 shadow-sm text-sm">
                  {counterfactual.expectedVerdict}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Root Cause Diagnosis
                </span>
                <p className="text-slate-700 p-4 rounded-xl bg-white border border-slate-200 font-medium text-sm leading-relaxed">
                  {counterfactual.hypothesizedCause}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Perturbation Experiments */}
        <div className="lg:col-span-7 aniwall-card p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Controlled Perturbation Matrix</span>
            </span>
          </div>

          {/* Mutation Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {counterfactual.perturbations.map((p, idx) => {
              const isSelected = activePerturbationId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePerturbationId(p.id)}
                  className={`p-5 rounded-[20px] text-left border transition-all duration-300 space-y-3 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md transform -translate-y-1'
                      : 'bg-[#FAFCFF] border-[#EAEFF7] text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                      {isDiagnosing && idx >= armsReplayed && (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      )}
                      {humanize(p.type)}
                    </span>
                    {p.isFix ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {p.description.split(':')[0]}
                  </div>
                  <div className="text-xs font-extrabold text-indigo-600">
                    {p.attributionScorePercent}% Impact
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Mutation Detail */}
          {selectedPerturbation && (
            <div className="p-6 rounded-[20px] bg-[#F8FAFD] border border-[#E9EEF5] space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">{selectedPerturbation.description}</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold shadow-sm ${
                  selectedPerturbation.isFix
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {selectedPerturbation.isFix ? 'Fixes Failure' : 'Still Fails'}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Replay Emitted Verdict</span>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold shadow-sm">
                  {selectedPerturbation.verdict}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Causal Diff Summary</span>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  {selectedPerturbation.diffSummary}
                </p>
              </div>
            </div>
          )}

          {/* Recommended Fix Banner */}
          <div className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
            <div>
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                Provable Fix Identified
              </span>
              <p className="text-sm text-slate-800 font-semibold mt-1">
                {counterfactual.recommendedFix}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => void handleCodify()}
                className="px-6 py-3 rounded-full bg-white border border-emerald-300 text-emerald-800 text-sm font-bold shadow-sm hover:bg-emerald-100 transition-colors flex items-center space-x-2"
                title="Turn this failure into a permanent regression case"
              >
                <span>Codify as Regression</span>
              </button>

              <Link
                href="/contracts"
                className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors flex items-center space-x-2"
              >
                <span>Synthesize Rule</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
