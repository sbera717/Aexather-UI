'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { usePlatformStore } from '@/store/platformStore';
import { CandidateVersion } from '@/types/platform';
import { formatCost, formatCount, formatLatency, formatPercent, humanize, shortId } from '@/lib/utils';
import {
  Rocket,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  PlayCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/** The five thresholds the backend enforces. Mirrored here only to label the scorecard. */
const GATES = [
  { key: 'accuracy', label: '1. Accuracy (≥95%)' },
  { key: 'invariants', label: '2. Invariants (≥99.5%)' },
  { key: 'regressions', label: '3. Regressions (0 Max)' },
  { key: 'latency', label: '4. Latency Budget (≤4.0s)' },
  { key: 'cost', label: '5. Cost Target (≤$0.015)' },
] as const;

type GateVerdict = 'PASS' | 'FAIL' | 'UNMEASURED';

interface Gate {
  label: string;
  verdict: GateVerdict;
  detail: string;
}

/**
 * Reads the five gates off the candidate's measured scorecard.
 *
 * A figure the platform has not measured is `UNMEASURED`, not a pass. That is the whole point of
 * the gate: the backend refuses a promotion it has no evidence for, and a scorecard that showed
 * five green ticks over absent data would be claiming the opposite.
 */
function evaluateGates(candidate: CandidateVersion | undefined): Gate[] {
  if (!candidate) return [];

  const gate = (
    label: string,
    value: number | null | undefined,
    passes: (v: number) => boolean,
    render: (v: number) => string
  ): Gate =>
    value == null
      ? { label, verdict: 'UNMEASURED', detail: 'No suite run' }
      : { label, verdict: passes(value) ? 'PASS' : 'FAIL', detail: render(value) };

  return [
    gate(GATES[0].label, candidate.accuracyPercent, (v) => v >= 95, formatPercent),
    gate(GATES[1].label, candidate.contractPassRatePercent, (v) => v >= 99.5, formatPercent),
    gate(GATES[2].label, candidate.regressionCount, (v) => v === 0, (v) => `${v} regressions`),
    gate(GATES[3].label, candidate.p95LatencyMs, (v) => v <= 4000, formatLatency),
    gate(GATES[4].label, candidate.costPerRunUsd, (v) => v <= 0.015, formatCost),
  ];
}

const GATE_STYLES: Record<GateVerdict, { box: string; text: string; Icon: typeof CheckCircle2 }> = {
  PASS: {
    box: 'bg-[#E8F7EE] border-[#C6EED4]',
    text: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  FAIL: {
    box: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    Icon: XCircle,
  },
  UNMEASURED: {
    box: 'bg-slate-50 border-slate-200',
    text: 'text-slate-500',
    Icon: MinusCircle,
  },
};

/** One case's row in the inline suite runner. */
interface CaseProgress {
  caseId: string;
  title: string;
  status: 'RUNNING' | 'PASSED' | 'FAILED';
  latencyMs?: number;
  failureReason?: string;
}

export default function PromotionControllerPage() {
  const { candidates, regressionSuites, promoteCandidate, rollbackVersion, runRegressionSuite } =
    usePlatformStore();

  const candidate = candidates.find((c) => c.status === 'CANDIDATE') || candidates[0];
  const production = candidates.find((c) => c.status === 'PRODUCTION') || candidates[1] || candidates[0];

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'good' | 'bad'>('good');
  const [isPromoting, setIsPromoting] = useState(false);
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [caseProgress, setCaseProgress] = useState<CaseProgress[]>([]);

  const gates = evaluateGates(candidate);
  const passedGates = gates.filter((g) => g.verdict === 'PASS').length;

  const announce = (message: string, tone: 'good' | 'bad') => {
    setToastMessage(message);
    setToastTone(tone);
  };

  /**
   * Replays the golden suite against this candidate's own configuration, which is what the gates
   * are then read from. Nothing here is measured until this has run — that is why the scorecard
   * starts as "not measured" rather than as zeroes.
   */
  const handleRunSuite = async () => {
    if (!candidate) return;

    setIsRunningSuite(true);
    setToastMessage(null);
    setCaseProgress(
      regressionSuites.map((test) => ({ caseId: test.id, title: test.title, status: 'RUNNING' }))
    );

    try {
      // Each case reports as it settles, so the panel fills in rather than appearing at once.
      const result = await runRegressionSuite(candidate.version, (row) =>
        setCaseProgress((current) =>
          current.map((entry) =>
            entry.caseId === row.caseId
              ? {
                  caseId: row.caseId,
                  title: row.title,
                  status: row.status === 'PASSED' ? 'PASSED' : 'FAILED',
                  latencyMs: row.actualLatencyMs,
                  failureReason: row.failureReason,
                }
              : entry
          )
        )
      );

      announce(
        `Suite replayed under ${candidate.version}: ${result.passedCount} passed, ${result.failedCount} failed. The gates below now read from run ${shortId(result.runId, 6)}.`,
        result.failedCount === 0 ? 'good' : 'bad'
      );
    } catch (error) {
      setCaseProgress([]);
      announce(error instanceof Error ? error.message : 'The suite could not be replayed.', 'bad');
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handlePromote = async () => {
    if (!candidate) return;
    setIsPromoting(true);
    try {
      await promoteCandidate(candidate.version);
      announce(`Promoted ${candidate.version} to production. The incumbent was rolled back.`, 'good');
    } catch (error) {
      // A blocked promotion is the feature working. The backend's message names every failing gate
      // and the evidence behind it, so it is shown verbatim rather than summarised away.
      announce(error instanceof Error ? error.message : 'Promotion failed.', 'bad');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRollback = async () => {
    if (!production) return;
    try {
      await rollbackVersion(production.version);
      announce(`Rolled back ${production.version}.`, 'good');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rollback failed.');
    }
  };

  const scorecard = (version: CandidateVersion | undefined, accent: string) => (
    <div className="grid grid-cols-2 gap-3.5 text-xs">
      <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
        <span className="text-[10px] font-bold text-slate-400 block">Benchmark Accuracy</span>
        <span className={`${accent} font-extrabold text-lg`}>{formatPercent(version?.accuracyPercent)}</span>
      </div>
      <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
        <span className="text-[10px] font-bold text-slate-400 block">Contract Pass Rate</span>
        <span className={`${accent} font-extrabold text-lg`}>
          {formatPercent(version?.contractPassRatePercent)}
        </span>
      </div>
      <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
        <span className="text-[10px] font-bold text-slate-400 block">p95 Reasoning Latency</span>
        <span className="text-slate-900 font-extrabold text-base">{formatLatency(version?.p95LatencyMs)}</span>
      </div>
      <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5]">
        <span className="text-[10px] font-bold text-slate-400 block">Token Cost per Run</span>
        <span className="text-slate-900 font-extrabold text-base">{formatCost(version?.costPerRunUsd)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-1">
            <Rocket className="w-4 h-4" />
            <span>CONTINUOUS AGENT PROMOTION &amp; RELEASE GATEWAY</span>
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
            onClick={() => void handleRunSuite()}
            disabled={isRunningSuite || isPromoting}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-60"
          >
            <PlayCircle className={`w-3.5 h-3.5 ${isRunningSuite ? 'animate-spin' : ''}`} />
            <span>{isRunningSuite ? 'Replaying suite…' : 'Run Suite on Candidate'}</span>
          </button>

          <button
            onClick={() => void handleRollback()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback Version</span>
          </button>

          <button
            onClick={() => void handlePromote()}
            disabled={isPromoting}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-bold bg-[#2B66FF] hover:bg-[#1E52DE] text-white shadow-md shadow-blue-500/20 transition disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isPromoting ? 'Checking gates…' : 'Promote Candidate to Prod'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-start justify-between gap-4 animate-in fade-in ${
            toastTone === 'good'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start space-x-2">
            <Sparkles
              className={`w-4 h-4 shrink-0 mt-0.5 ${toastTone === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}
            />
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Candidate vs Production Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Candidate */}
        <div className="aniwall-card p-7 space-y-5 border-blue-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Candidate Agent Release
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">{candidate?.version}</h2>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {humanize(candidate?.status)}
            </span>
          </div>

          {scorecard(candidate, 'text-emerald-700')}

          {candidate?.regressionRunId ? (
            <p className="text-[11px] text-slate-400 font-medium">
              Measured from suite run{' '}
              <span className="font-mono" title={candidate.regressionRunId}>
                {shortId(candidate.regressionRunId, 6)}
              </span>
              {candidate.contractEvaluations ? ` · ${candidate.contractEvaluations} contract evaluations` : ''}
            </p>
          ) : (
            <p className="text-[11px] text-amber-700 font-semibold">
              No suite run on record — run the regression suite against this version before promoting.
            </p>
          )}

          {/* Enhancements */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-extrabold text-slate-900 block">Codified Enhancements:</span>
            <div className="space-y-1.5 text-xs text-slate-600 font-medium">
              {candidate?.changesSummary?.map((change, idx) => (
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Production Baseline
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">{production?.version}</h2>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              {humanize(production?.status)}
            </span>
          </div>

          {scorecard(production, 'text-slate-900')}

          {/* Relative movement, only once both sides have been measured */}
          {candidate?.previousFailuresFixed != null && (
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5] space-y-2 text-xs font-semibold">
              <span className="text-[11px] text-blue-700 font-extrabold block">Measured against this baseline:</span>
              <div className="flex justify-between text-slate-600">
                <span>Cases the candidate fixes</span>
                <span className="text-emerald-700 font-bold">{formatCount(candidate.previousFailuresFixed)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cases the candidate regresses</span>
                <span
                  className={
                    (candidate.regressionCount ?? 0) > 0 ? 'text-rose-700 font-bold' : 'text-slate-900 font-bold'
                  }
                >
                  {formatCount(candidate.regressionCount)}
                </span>
              </div>
            </div>
          )}

          {/* Shadow Deployment Telemetry */}
          {candidate?.shadowComparison && (
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E9EEF5] space-y-2 text-xs font-semibold">
              <span className="text-[11px] text-blue-700 font-extrabold block">
                Shadow Traffic Evaluation ({candidate.shadowComparison.totalEvaluations} Requests):
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Decision Agreement Parity</span>
                <span className="text-emerald-700 font-bold">
                  {candidate.shadowComparison.agreementRatePercent}%
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reasoning Latency Delta</span>
                <span className="text-slate-900 font-bold">
                  {candidate.shadowComparison.latencyDeltaMs > 0
                    ? `+${candidate.shadowComparison.latencyDeltaMs}ms`
                    : `${candidate.shadowComparison.latencyDeltaMs}ms`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Token Cost Reduction</span>
                <span className="text-emerald-700 font-bold">{candidate.shadowComparison.costDeltaPercent}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline suite runner — the evidence the gates are read from */}
      {caseProgress.length > 0 && (
        <div className="aniwall-card p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <span>Golden Suite · {candidate?.version}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400 shrink-0">
              {caseProgress.filter((c) => c.status !== 'RUNNING').length} / {caseProgress.length} complete
            </span>
          </div>

          <div className="space-y-2">
            {caseProgress.map((entry) => (
              <div
                key={entry.caseId}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-3.5 text-xs transition-all duration-300 ${
                  entry.status === 'RUNNING'
                    ? 'border-slate-200 bg-slate-50/70'
                    : entry.status === 'PASSED'
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-rose-200 bg-rose-50/60'
                }`}
              >
                <span className="shrink-0">
                  {entry.status === 'RUNNING' ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : entry.status === 'PASSED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </span>

                <span className="font-bold text-slate-500 w-32 shrink-0">{entry.caseId}</span>

                <span className="flex-1 min-w-0 font-semibold text-slate-800 truncate">
                  {entry.title}
                  {entry.failureReason && (
                    <span className="block font-medium text-rose-700 truncate">{entry.failureReason}</span>
                  )}
                </span>

                <span className="shrink-0 tabular-nums font-bold text-slate-500 w-20 text-right">
                  {entry.status === 'RUNNING' ? 'replaying…' : formatLatency(entry.latencyMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Objective Pareto Gate Checklist */}
      <div className="aniwall-card p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Automated Pre-Promotion Pareto Scorecard Gates</span>
          </h3>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
              passedGates === GATES.length
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
          >
            {passedGates} / {GATES.length} Gates Passed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {gates.map((gate) => {
            const style = GATE_STYLES[gate.verdict];
            const Icon = style.Icon;

            return (
              <div key={gate.label} className={`p-4 rounded-2xl border text-xs space-y-1 ${style.box}`}>
                <span className="text-slate-600 text-[10px] font-bold uppercase block">{gate.label}</span>
                <span className={`${style.text} font-extrabold text-sm flex items-center space-x-1.5`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{gate.verdict === 'UNMEASURED' ? 'NOT MEASURED' : gate.verdict}</span>
                </span>
                <span className="text-slate-500 text-[11px] font-semibold block">{gate.detail}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
          Gates are enforced server-side against the traces of this version&apos;s latest regression run. A figure the
          platform has not measured blocks the promotion — it never passes it.
        </p>
      </div>
    </div>
  );
}
