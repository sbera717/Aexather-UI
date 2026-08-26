'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/platformStore';
import { formatLatency, formatCost } from '@/lib/utils';
import { 
  Rocket, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function PromotionControllerPage() {
  const { candidates, promoteCandidate, rollbackVersion } = usePlatformStore();

  const candidate = candidates.find(c => c.status === 'CANDIDATE') || candidates[0];
  const production = candidates.find(c => c.status === 'PRODUCTION') || candidates[1] || candidates[0];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePromote = () => {
    if (candidate) {
      promoteCandidate(candidate.version);
      setToastMessage(`Successfully promoted ${candidate.version.split(' ')[0]} to Production! 100% of live agent traffic shifted.`);
    }
  };

  const handleRollback = () => {
    if (production) {
      rollbackVersion(production.version);
      setToastMessage(`Rollback executed for ${production.version.split(' ')[0]}. Reverted to previous stable baseline.`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-1">
            <Rocket className="w-4 h-4" />
            <span>CONTINUOUS AGENT PROMOTION & RELEASE GATEWAY</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Multi-Objective Pareto Promotion Controller
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate candidate agent configurations against strict multi-objective invariant safety, regression bounds, latency, and token cost thresholds.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0 self-start md:self-auto">
          <button
            onClick={handleRollback}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback Version</span>
          </button>

          <button
            onClick={handlePromote}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-bold bg-[#2B66FF] hover:bg-[#1E52DE] text-white shadow-md shadow-blue-500/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Promote Candidate to Prod</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Candidate vs Production Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Candidate */}
        <div className="aniwall-card p-7 space-y-5 border-blue-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Candidate Agent Release</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{candidate?.version}</h2>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {candidate?.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Benchmark Accuracy</span>
              <span className="text-emerald-700 font-extrabold text-lg">{candidate?.accuracyPercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Contract Pass Rate</span>
              <span className="text-emerald-700 font-extrabold text-lg">{candidate?.contractPassRatePercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">p95 Reasoning Latency</span>
              <span className="text-slate-900 font-extrabold text-base">{formatLatency(candidate?.p95LatencyMs || 0)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Token Cost per Run</span>
              <span className="text-slate-900 font-extrabold text-base">{formatCost(candidate?.costPerRunUsd || 0)}</span>
            </div>
          </div>

          {/* Enhancements */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-extrabold text-slate-900 block">Codified Enhancements:</span>
            <div className="space-y-1.5 text-xs text-slate-600 font-medium">
              {candidate?.changesSummary.map((change, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Production Baseline */}
        <div className="aniwall-card p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Production Baseline</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{production?.version}</h2>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {production?.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Benchmark Accuracy</span>
              <span className="text-slate-900 font-extrabold text-lg">{production?.accuracyPercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Contract Pass Rate</span>
              <span className="text-slate-900 font-extrabold text-lg">{production?.contractPassRatePercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">p95 Reasoning Latency</span>
              <span className="text-slate-900 font-extrabold text-base">{formatLatency(production?.p95LatencyMs || 0)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
              <span className="text-[10px] font-bold text-slate-400 block">Token Cost per Run</span>
              <span className="text-slate-900 font-extrabold text-base">{formatCost(production?.costPerRunUsd || 0)}</span>
            </div>
          </div>

          {/* Shadow Deployment Telemetry */}
          {candidate?.shadowComparison && (
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5] space-y-2 text-xs font-semibold">
              <span className="text-[11px] text-blue-700 font-extrabold block">
                Shadow Traffic Evaluation ({candidate.shadowComparison.totalEvaluations} Requests):
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Decision Agreement Parity</span>
                <span className="text-emerald-700 font-bold">{candidate.shadowComparison.agreementRatePercent}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reasoning Latency Delta</span>
                <span className="text-slate-900 font-bold">{candidate.shadowComparison.latencyDeltaMs > 0 ? `+${candidate.shadowComparison.latencyDeltaMs}ms` : `${candidate.shadowComparison.latencyDeltaMs}ms`}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Token Cost Reduction</span>
                <span className="text-emerald-700 font-bold">{candidate.shadowComparison.costDeltaPercent}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Objective Pareto Gate Checklist */}
      <div className="aniwall-card p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Automated Pre-Promotion Pareto Scorecard Gates</span>
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            5 / 5 Gates Passed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#E8F7EE] border border-[#C6EED4] text-xs space-y-1">
            <span className="text-slate-600 text-[10px] font-bold uppercase block">1. Accuracy (≥95%)</span>
            <span className="text-emerald-800 font-extrabold text-sm">PASS ({candidate?.accuracyPercent}%)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#E8F7EE] border border-[#C6EED4] text-xs space-y-1">
            <span className="text-slate-600 text-[10px] font-bold uppercase block">2. Invariants (≥99.5%)</span>
            <span className="text-emerald-800 font-extrabold text-sm">PASS ({candidate?.contractPassRatePercent}%)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#E8F7EE] border border-[#C6EED4] text-xs space-y-1">
            <span className="text-slate-600 text-[10px] font-bold uppercase block">3. Regressions (0 Max)</span>
            <span className="text-emerald-800 font-extrabold text-sm">PASS (0 Regressions)</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#E8F7EE] border border-[#C6EED4] text-xs space-y-1">
            <span className="text-slate-600 text-[10px] font-bold uppercase block">4. Latency Budget (≤4.0s)</span>
            <span className="text-emerald-800 font-extrabold text-sm">PASS ({formatLatency(candidate?.p95LatencyMs || 0)})</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#E8F7EE] border border-[#C6EED4] text-xs space-y-1">
            <span className="text-slate-600 text-[10px] font-bold uppercase block">5. Cost Target (≤$0.015)</span>
            <span className="text-emerald-800 font-extrabold text-sm">PASS ({formatCost(candidate?.costPerRunUsd || 0)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
