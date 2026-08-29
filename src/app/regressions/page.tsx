'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { usePlatformStore } from '@/store/platformStore';
import { RegressionTestCase } from '@/types/platform';
import { formatLatency, shortId } from '@/lib/utils';
import {
  ListChecks,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  CircleDashed,
  FlaskConical,
} from 'lucide-react';

/**
 * How a case's last result reads on the row.
 *
 * `NOT_RUN` is deliberately its own state rather than folded into either of the others. A case
 * nobody has replayed has not passed and has not failed, and showing it as green was how a
 * freshly written case came to count toward the suite's standing on no evidence.
 */
const RUN_STATUS_STYLES: Record<
  RegressionTestCase['lastRunStatus'],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  PASSED: {
    label: 'Passed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    Icon: XCircle,
  },
  NOT_RUN: {
    label: 'Not run',
    className: 'bg-slate-50 text-slate-500 border-slate-200',
    Icon: CircleDashed,
  },
};

export default function RegressionSuitePage() {
  const {
    regressionSuites,
    regressionSummary,
    candidates,
    addRegressionCase,
    runRegressionSuite,
    runMutationTest,
  } = usePlatformStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [runNotification, setRunNotification] = useState<string | null>(null);
  const [notificationTone, setNotificationTone] = useState<'good' | 'bad'>('good');

  // Form State
  const [title, setTitle] = useState('');
  const [originExecutionId, setOriginExecutionId] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [contractId, setContractId] = useState('CONTRACT-01');

  const productionVersion = candidates.find((c) => c.status === 'PRODUCTION')?.version;

  const counted = (status: RegressionTestCase['lastRunStatus']) =>
    regressionSuites.filter((t) => t.lastRunStatus === status).length;

  const passing = regressionSummary?.passingCases ?? counted('PASSED');
  const failing = regressionSummary?.failingCases ?? counted('FAILED');
  const notRun = regressionSummary?.notRunCases ?? counted('NOT_RUN');

  const announce = (message: string, tone: 'good' | 'bad') => {
    setRunNotification(message);
    setNotificationTone(tone);
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !inputQuery || !expectedOutcome) return;

    try {
      const created = await addRegressionCase({
        title,
        originExecutionId: originExecutionId || undefined,
        inputQuery,
        expectedOutcome,
        contractId,
      });

      toast.success(`${created.id} codified. Run the suite to establish whether it holds.`);
      setTitle('');
      setOriginExecutionId('');
      setInputQuery('');
      setExpectedOutcome('');
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not codify the case.');
    }
  };

  const handleRunAllSuites = async () => {
    setIsRunningAll(true);
    setRunNotification(null);
    try {
      /*
       * Replayed under the production version's own configuration when there is one. Without the
       * lookup the run would execute the deployment default while being recorded under that
       * version's label, and the promotion gate reading it would be measuring the wrong agent.
       */
      const result = await runRegressionSuite(productionVersion);

      if (result.failedCount === 0) {
        announce(
          `All ${result.totalCount} case(s) held${productionVersion ? ` under ${productionVersion}` : ''}.`,
          'good'
        );
      } else {
        const detail = result.results
          .filter((r) => r.status === 'FAILED')
          .map((r) => `${r.caseId} — ${r.failureReason ?? 'no reason recorded'}`)
          .join('; ');
        announce(`${result.failedCount} of ${result.totalCount} case(s) failed. ${detail}`, 'bad');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The suite could not be replayed.');
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleMutationTest = async () => {
    setIsMutating(true);
    setRunNotification(null);
    try {
      // Asks whether the suite would notice a broken agent. It replays the whole suite once per
      // degradation, so the backend hands back a job rather than holding the request open.
      const report = await runMutationTest();
      announce(
        `Suite strength ${report.suiteStrength}% — ${report.verdict}`,
        report.survived === 0 ? 'good' : 'bad'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mutation testing did not complete.');
    } finally {
      setIsMutating(false);
    }
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
            Golden Benchmark Suites &amp; Release Gates
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
            onClick={() => void handleMutationTest()}
            disabled={isMutating || isRunningAll}
            title="Deliberately degrade the agent and report whether these cases would notice"
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-60"
          >
            <FlaskConical className={`w-4 h-4 ${isMutating ? 'animate-pulse' : ''}`} />
            <span>{isMutating ? 'Degrading agent…' : 'Test the Suite'}</span>
          </button>

          <button
            onClick={() => void handleRunAllSuites()}
            disabled={isRunningAll || isMutating}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold bg-[#2B66FF] hover:bg-[#1E52DE] text-white shadow-md shadow-blue-500/20 transition disabled:opacity-60"
          >
            <Play className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Replaying suite…' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {runNotification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-start justify-between gap-4 animate-in fade-in ${
            notificationTone === 'good'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start space-x-2">
            {notificationTone === 'good' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{runNotification}</span>
          </div>
          <button onClick={() => setRunNotification(null)} className="text-slate-400 hover:text-slate-700 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Test Matrix Table */}
      <div className="aniwall-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <span>
            Active Test Suites: <strong className="text-slate-900">{regressionSuites.length}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-emerald-600 font-extrabold">{passing} passing</span>
            <span className={failing > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400 font-bold'}>
              {failing} failing
            </span>
            {notRun > 0 && <span className="text-slate-400 font-bold">{notRun} not run</span>}
            {regressionSummary?.lastRunVersion && (
              <span className="text-slate-400 font-medium">
                last run: {regressionSummary.lastRunVersion}
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {regressionSuites.map((test) => {
            const runStatus = RUN_STATUS_STYLES[test.lastRunStatus] ?? RUN_STATUS_STYLES.NOT_RUN;
            const StatusIcon = runStatus.Icon;

            return (
              <div
                key={test.id}
                className="p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${runStatus.className}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{runStatus.label}</span>
                    </span>
                    <span className="font-bold text-slate-500">{test.id}</span>
                    {test.originExecutionId && (
                      <span className="font-medium text-slate-400" title={test.originExecutionId}>
                        from {shortId(test.originExecutionId)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{test.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Input Query: {test.inputQuery}</p>
                  {test.contractsEnforced.length > 0 && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      Pins: {test.contractsEnforced.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 shrink-0 text-xs font-semibold">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Verdict</span>
                    <span className="text-blue-700 font-bold">{test.expectedOutcome}</span>
                  </div>
                  {test.minimumCoveragePercent != null && (
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Coverage Floor</span>
                      <span className="text-slate-800 font-bold">{test.minimumCoveragePercent}%</span>
                    </div>
                  )}
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
            );
          })}
        </div>
      </div>

      {/* Codify Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center">
          <div className="w-full max-w-lg mt-12 mb-12 rounded-xl bg-white p-0 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <h2 className="text-xl font-medium text-slate-900">
                Codify Regression Test
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTest} className="px-8 py-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Test Case Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Low Vector Similarity Grounding Fallback Guard"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Origin Trace ID</label>
                <input
                  type="text"
                  value={originExecutionId}
                  onChange={(e) => setOriginExecutionId(e.target.value)}
                  placeholder="Optional — leave blank for a hand-written case"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Input Query Payload</label>
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="e.g., Synthesize user telemetry with unverified RAG vector chunk"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Expected Output Verdict</label>
                <input
                  type="text"
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="e.g., ESCALATE_TO_HUMAN"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-emerald-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800">Contract Pinned by this Case</label>
                <input
                  type="text"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder="e.g., CONTRACT-01"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
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
                  className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm transition"
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
