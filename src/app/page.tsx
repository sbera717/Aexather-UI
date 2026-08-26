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
  Zap
} from 'lucide-react';
import { usePlatformStore } from '@/store/platformStore';

export default function HybridDashboard() {
  const [promptInput, setPromptInput] = useState('');
  const router = useRouter();

  return (
    <div className="h-full flex">
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
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-700 uppercase">Pending</span>
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

              <div className="flex items-center space-x-2 pt-2">
                <button 
                  onClick={() => toast.success('Meeting scheduled successfully!')}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition shadow-sm">
                  Confirm
                </button>
                <button 
                  onClick={() => toast.error('Meeting declined. Agent has been notified.')}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition">
                  Decline
                </button>
              </div>
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Afternoon, John</h1>
            <p className="text-sm text-slate-500 mt-1">3 agents active · 1 pending action</p>
          </div>
          <div className="text-right">
            <span className="block text-sm font-medium text-slate-900">Tuesday, May 14</span>
            <span className="block text-xs text-slate-500">14:02 PM GMT</span>
          </div>
        </div>

        {/* Central 3D Orb & Status */}
        <div className="flex-1 flex flex-col items-center justify-center relative mt-16">
          {/* Subtle Ambient Glow behind Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-[380px] h-[380px] relative z-10">
            <NeuralParticleSphere />
          </div>

          <div className="mt-8 text-center space-y-2 relative z-10">
            <h2 className="text-2xl font-light text-slate-900 tracking-tight">Behavior Engine Online</h2>
            <p className="text-sm text-slate-500 font-medium">Monitoring agent execution traces and causal lineage</p>
          </div>

          {/* Suggestion Chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-10 max-w-lg">
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
        <div className="p-8 w-full max-w-4xl mx-auto relative z-10 mb-6">
          <div className="bg-[#F8FAFD] rounded-[24px] p-2 border border-[#E9EEF5] shadow-sm flex flex-col focus-within:border-blue-300 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full bg-transparent border-none px-6 py-5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
              placeholder="Query trace ID, filter by failure step, or evaluate causal graph..."
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
                  onClick={() => {
                    toast.loading('Analyzing trace...', { duration: 1500 });
                    setTimeout(() => router.push('/studio'), 1500);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 shadow-sm transition">
                  Analyze
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
