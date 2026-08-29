'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NeuralParticleSphere from '@/components/3d/NeuralParticleSphere';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Search,
  ActivitySquare,
  ChevronDown,
  Workflow,
  ShieldAlert,
  MoreHorizontal,
  Mic,
  Box,
  Zap,
  Loader2
} from 'lucide-react';
import { usePlatformStore } from '@/store/platformStore';
import { formatPercent } from '@/lib/utils';
import type { StepEvent } from '@/lib/api';

/** Opens on a question that exercises the full adaptive loop rather than closing in one round. */
const SUGGESTED_GOAL =
  'Confirm whether the named signatory holds delegated authority to execute transfer addenda.';

/** Graph node ids as the runtime emits them, in the vocabulary the rest of the platform uses. */
const NODE_LABELS: Record<string, string> = {
  route: 'Adaptive Router',
  investigate: 'Specialist Executor',
  evaluate: 'Evidence Engine',
  verdict: 'Verdict Synthesiser',
};

export default function HybridDashboard() {
  /*
   * Typing animation simulator for the prompt instead of pre-filling.
   */
  const [promptInput, setPromptInput] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [meetingStatus, setMeetingStatus] = useState<'CONFIRMED' | 'DECLINED' | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();

  const { startInvestigation, dashboard, connection } = usePlatformStore();

  React.useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    let isCancelled = false;

    const typePrompt = async () => {
      await new Promise(r => setTimeout(r, 600)); // Initial pause
      if (isCancelled) return;
      
      const text = SUGGESTED_GOAL;
      for (let i = 0; i <= text.length; i++) {
        if (isCancelled) return;
        setPromptInput(text.slice(0, i));
        // Add a natural-looking typing delay
        const delay = Math.random() * 20 + 15;
        await new Promise(r => setTimeout(r, delay));
      }
    };

    void typePrompt();

    return () => {
      isCancelled = true;
    };
  }, []);

  /**
   * Runs a real investigation, streaming each graph node as it lands.
   *
   * The prompt is the goal, not a search query: the platform answers by investigating, and what it
   * hands back is the record of how. Streaming matters more than it looks — the point of an
   * adaptive runtime is that the number of rounds is decided by what the evidence looks like, and
   * a spinner followed by a finished answer hides exactly that.
   */
  const handleInvestigate = async () => {
    const goal = promptInput.trim();
    if (!goal || isInvestigating) return;

    setIsInvestigating(true);
    setSteps([]);
    try {
      const trace = await startInvestigation(goal, (step) => {
        // __START__ and __END__ are the graph library's own bookends, not decisions the agent took.
        if (step.node.startsWith('__')) return;
        setSteps((current) => [...current, step]);
      });
      toast.success(
        `${trace.id} concluded as ${trace.status} at ${trace.evidenceCoveragePercent}% coverage.`
      );
      setPromptInput('');
      
      // Smooth transition
      setTimeout(() => {
        router.push('/studio');
      }, 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The investigation could not be started.');
      setIsInvestigating(false);
      return;
    }
    setIsInvestigating(false);
  };

  return (
    // Pinned to the viewport so this page never scrolls as a whole — the orb, the caption and the
    // prompt bar are one composition and should not slide past each other. `h-full` resolved
    // against a parent with no fixed height of its own, which is what let the page grow; a definite
    // height here is also what makes the agent column's own `h-full` mean something, so that column
    // scrolls on its own.
    <div className="h-screen flex">
      {/* LEFT COLUMN: Agent Queue (Ref 1) */}
      <div className="w-[420px] shrink-0 border-r border-[#E9EEF5] bg-[#FCFDFE] p-8 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-bold text-slate-800 text-lg">Active Agents</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Scheduler Agent Card */}
          <div className="bg-white border border-[#E9EEF5] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Scheduler Agent</h3>
                  <p className="text-[11px] text-slate-500">Calendar Ops</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${meetingStatus ? 'bg-slate-100' : 'bg-amber-50'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${meetingStatus ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`} />
                <span className={`text-[10px] font-bold uppercase ${meetingStatus ? 'text-slate-600' : 'text-amber-700'}`}>
                  {meetingStatus === 'CONFIRMED' ? 'Confirmed' : meetingStatus === 'DECLINED' ? 'Declined' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Confirm Meeting Schedule?</h4>
              <p className="text-[11px] text-slate-500">
                Your Scheduler Agent has proposed a meeting with the client. Please review the details.
              </p>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tue, Apr 16</span>
                  </div>
                  <span>10:00 AM - 10:45 AM</span>
                </div>
              </div>

              {!meetingStatus ? (
                <div className="flex items-center space-x-2 pt-2">
                  <button 
                    onClick={() => {
                      setMeetingStatus('CONFIRMED');
                      toast.success('Meeting scheduled successfully!');
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition shadow-sm">
                    Confirm
                  </button>
                  <button 
                    onClick={() => {
                      setMeetingStatus('DECLINED');
                      toast.error('Meeting declined. Agent has been notified.');
                    }}
                    className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition">
                    Decline
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 pt-3 pb-1 text-sm font-bold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{meetingStatus === 'CONFIRMED' ? 'Meeting Confirmed' : 'Meeting Declined'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Research Agent Card */}
          <div className="bg-white border border-[#E9EEF5] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Research Agent</h3>
                  <p className="text-[11px] text-slate-500">Sector Analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-700 uppercase">Analyzing</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-50">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Analyzing market trends</span>
                <span>124 data points</span>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">Confidence</span>
                  <span className="text-3xl font-light text-slate-800">92%</span>
                </div>
                <div className="w-16 h-8 opacity-50">
                  {/* Mock sparkline */}
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-purple-500 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="0,20 20,25 40,10 60,15 80,5 100,10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Agent Card */}
          <div className="bg-white border border-[#E9EEF5] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Marketing Agent</h3>
                  <p className="text-[11px] text-slate-500">Sector Ads</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Executing</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-50">
               <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Running A/B tests</span>
                <span>Phase 2 of 3</span>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">Budget Used</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-slate-800">$120</span>
                    <span className="text-xs text-slate-400">/$300</span>
                  </div>
                </div>
                 <div className="w-16 h-8 opacity-50">
                  {/* Mock sparkline */}
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="0,25 25,20 50,22 75,10 100,15" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Intelligence Hub (Ref 1) */}
      <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
        
        {/* Top Header */}
        <div className="px-12 py-8 flex items-start justify-between absolute top-0 left-0 right-0 z-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {currentTime ? (() => {
                const hour = currentTime.getHours();
                if (hour < 12) return 'Good Morning, Subrat';
                if (hour < 18) return 'Good Afternoon, Subrat';
                return 'Good Evening, Subrat';
              })() : 'Good Morning, Subrat'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">3 agents active · 1 pending action</p>
          </div>
          <div className="text-right">
            <span className="block text-sm font-medium text-slate-900">
              {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading...'}
            </span>
            <span className="block text-xs text-slate-500 uppercase">
              {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '--:--'}
            </span>
          </div>
        </div>

        {/* Central 3D Orb & Status */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative mt-20 overflow-hidden">
          {/* Subtle Ambient Glow behind Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,44vh)] h-[min(500px,44vh)] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 w-[min(380px,34vh)] h-[min(380px,34vh)] shrink-0">
            <NeuralParticleSphere />
          </div>

          <div className="mt-5 text-center space-y-1 relative z-10 shrink-0">
            <h2 className="text-xl font-light text-slate-900 tracking-tight">
              {isInvestigating ? 'Investigating' : 'Behavior Engine Online'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {isInvestigating
                ? 'Routing specialists, weighing evidence, deciding whether to continue'
                : 'Monitoring agent execution traces and causal lineage'}
            </p>
          </div>

          {/*
            The inline graph feed is removed here. It will be shown in a modal instead.
          */}


          {/* Live platform counters, when there is a backend to read them from */}
          {connection === 'live' && dashboard && (
            <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 relative z-10 text-center shrink-0">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Live traces</span>
                <span className="text-lg font-bold text-slate-800">{dashboard.totalExecutions}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg coverage</span>
                <span className="text-lg font-bold text-slate-800">{dashboard.avgEvidenceCoveragePercent}%</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract pass rate</span>
                <span className="text-lg font-bold text-slate-800">
                  {formatPercent(dashboard.overallContractPassRatePercent)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Violations</span>
                <span
                  className={`text-lg font-bold ${
                    dashboard.contractViolationCount > 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {dashboard.contractViolationCount}
                </span>
              </div>
            </div>
          )}

          {/* Suggestion Chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5 relative z-10 max-w-lg shrink-0">
            <button 
              onClick={() => router.push('/debugger')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600 shadow-sm transition">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Isolate Failures</span>
            </button>
            <button 
              onClick={() => router.push('/studio')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-amber-300 hover:text-amber-600 shadow-sm transition">
              <ActivitySquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Trace Lineage</span>
            </button>
            <button 
              onClick={() => router.push('/debugger')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 shadow-sm transition">
              <Workflow className="w-3.5 h-3.5 text-purple-500" />
              <span>Debug Steps</span>
            </button>
            <button 
              onClick={() => router.push('/contracts')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 shadow-sm transition">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verify Invariants</span>
            </button>
          </div>
        </div>

        {/* Bottom Input Area - Replaced Chatbot with Trace Query Bar */}
        <div className="px-8 pb-6 pt-2 w-full max-w-4xl mx-auto relative z-10 shrink-0">
          <div className="bg-[#F8FAFD] rounded-[24px] p-2 border border-[#E9EEF5] shadow-sm flex flex-col focus-within:border-blue-300 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleInvestigate();
              }}
              disabled={isInvestigating}
              className="w-full bg-transparent border-none px-6 py-4 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-60"
              placeholder="State what the agent should establish — it will investigate and record how."
            />
            
            <div className="flex items-center justify-between px-4 pb-3 pt-2">
              {/* Context Selector */}
              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Global Trace Index</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Right Controls */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => toast.info('Advanced filters menu opened')}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition mr-2">
                  <span>Advanced Filters</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void handleInvestigate()}
                  disabled={isInvestigating || !promptInput.trim()}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 shadow-sm transition disabled:opacity-50">
                  {isInvestigating ? 'Investigating…' : 'Investigate'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Investigation Progress Modal */}
      {isInvestigating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-xl mt-12 mb-12 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden border border-slate-200/50">
            {/* Colorful Light Header */}
            <div className="relative overflow-hidden px-6 py-5 bg-white border-b border-slate-100">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 animate-pulse" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Investigating Trace Lineage</h2>
                  <p className="text-xs text-indigo-600 mt-1 font-bold">Routing specialists and weighing evidence</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                  <ActivitySquare className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="px-6 pt-4 pb-8 flex-1 overflow-y-auto max-h-[60vh] space-y-2.5 relative bg-[#F8FAFD]">
              {/* Connecting vertical line */}
              <div className="absolute left-[2.85rem] top-8 bottom-12 w-0.5 bg-slate-200/60 z-0" />
              
              {steps.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm font-medium animate-pulse relative z-10">
                  Initializing agent swarm...
                </div>
              ) : (
                steps.map((step, index) => {
                  const isLatest = index === steps.length - 1;
                  return (
                    <div
                      key={`${step.node}-${index}`}
                      className={`relative z-10 rounded-xl border px-4 py-2.5 transition-all duration-500 ${
                        isLatest
                          ? 'border-indigo-300 bg-white shadow-[0_4px_20px_rgba(99,102,241,0.12)] scale-[1.01]'
                          : 'border-slate-100 bg-white/80 scale-100 hover:bg-white'
                      }`}
                    >
                      {/* Active glowing background */}
                      {isLatest && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 animate-pulse" />
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                            isLatest 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                              : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {isLatest ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`font-bold text-sm tracking-tight ${isLatest ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {NODE_LABELS[step.node] ?? step.node}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">Execution Round {step.round}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors duration-500 ${
                            isLatest ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {step.coverage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
