'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/platformStore';
import { EvidenceSource } from '@/types/platform';
import { formatLatency, formatCost } from '@/lib/utils';
import { 
  Workflow, 
  Sparkles,
  Database,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExecutionStudioPage() {
  const { traces, selectedTraceId, setSelectedTraceId, selectedNodeId, setSelectedNodeId } = usePlatformStore();
  const [activeTab, setActiveTab] = useState<'NODE' | 'LEDGER' | 'CLAIMS'>('NODE');
  const [showInputPayload, setShowInputPayload] = useState(false);
  const [showOutputPayload, setShowOutputPayload] = useState(false);

  const currentTrace = traces.find(t => t.id === selectedTraceId) || traces[0];
  const currentNode = currentTrace?.nodes.find(n => n.id === selectedNodeId) || currentTrace?.nodes[0];

  if (!currentTrace) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No execution traces found.
      </div>
    );
  }

  const getSourceIcon = (type: EvidenceSource['sourceType']) => {
    switch (type) {
      case 'VECTOR_RAG': return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'API_TOOL': return <Globe className="w-4 h-4 text-emerald-600" />;
      case 'DATABASE': return <Database className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-amber-600" />;
    }
  };

  // Prepare data for the Timeline Chart
  const timelineData = currentTrace.nodes.map(n => ({
    name: `Step ${n.stepNumber}`,
    role: n.agentRole,
    latencyMs: n.latencyMs,
    isFailed: n.status === 'FAILED',
    isWarned: n.status === 'WARNED'
  }));

  return (
    <div className="space-y-10 pb-16 pt-8 px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Studio Top Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-sm font-bold text-indigo-600 mb-2">
            <Workflow className="w-5 h-5" />
            <span>AGENT REASONING LINEAGE & FLOW</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            {currentTrace.title}
          </h1>
        </div>

        {/* Trace Dropdown & Status */}
        <div className="flex items-center space-x-4 shrink-0 self-start md:self-auto">
          <select
            value={currentTrace.id}
            onChange={(e) => setSelectedTraceId(e.target.value)}
            className="px-6 py-3 rounded-full bg-white border border-slate-200 text-sm text-slate-800 font-bold shadow-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {traces.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} - {t.title.slice(0, 36)}...
              </option>
            ))}
          </select>

          <span className={`px-5 py-2.5 rounded-full text-sm font-extrabold shadow-sm ${
            currentTrace.status === 'CONTRACT_VIOLATION'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {currentTrace.status === 'CONTRACT_VIOLATION' ? 'Contract Breach' : 'Success'}
          </span>
        </div>
      </div>

      {/* NEW: Execution Timeline Chart */}
      <div className="aniwall-card p-8 space-y-6">
         <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                Execution Latency Timeline
              </span>
            </div>
            <div className="text-sm font-bold text-slate-500">
              Total Latency: <span className="text-indigo-600">{formatLatency(currentTrace.totalLatencyMs)}</span>
            </div>
          </div>
          
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}ms`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value}ms`, 'Latency']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Bar dataKey="latencyMs" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1000}>
                  {timelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isFailed ? '#f43f5e' : entry.isWarned ? '#f59e0b' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Main Studio Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Interactive Flow Graph */}
        <div className="lg:col-span-7 aniwall-card p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                Decision Pipeline DAG
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {currentTrace.nodes.length} Steps
              </span>
            </div>
          </div>

          {/* Connected Flow Node Cards */}
          <div className="space-y-6 relative py-2">
            {currentTrace.nodes.map((node, index) => {
              const isSelected = currentNode?.id === node.id;
              const isWarned = node.status === 'WARNED';
              const isFailed = node.status === 'FAILED';

              return (
                <div key={node.id} className="relative">
                  {/* Subtle Vertical Connector */}
                  {index < currentTrace.nodes.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-12 bg-indigo-100 -z-0"></div>
                  )}

                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative z-10 p-6 rounded-[24px] transition-all duration-300 cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 shadow-md transform -translate-y-1'
                        : isFailed
                        ? 'bg-[#FFF5F5] border-rose-300'
                        : isWarned
                        ? 'bg-[#FFFBEB] border-amber-300'
                        : 'bg-white border-[#EAEFF7] hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                          isFailed
                            ? 'bg-rose-600 text-white shadow-sm'
                            : isWarned
                            ? 'bg-amber-500 text-white shadow-sm'
                            : isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {node.stepNumber}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                              {node.agentRole}
                            </h3>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 uppercase tracking-wider">
                              {node.actionType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            {node.summary}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-sm font-semibold space-y-1">
                        <div className="text-slate-900">{formatLatency(node.latencyMs)}</div>
                        <div className="text-slate-400 text-xs">{formatCost(node.tokenCostUsd)}</div>
                      </div>
                    </div>

                    {/* Citations Badges */}
                    {node.evidenceIds.length > 0 && (
                      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Citations:</span>
                        {node.evidenceIds.map((eid) => (
                          <span
                            key={eid}
                            className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-50/50 border border-indigo-100 text-indigo-700"
                          >
                            {eid}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Step Details & Evidence Ledger Tabs */}
        <div className="lg:col-span-5 aniwall-card overflow-hidden">
          {/* Tab Pill Headers */}
          <div className="flex border-b border-slate-100 bg-[#F8FAFD] p-3 text-sm gap-2">
            <button
              onClick={() => setActiveTab('NODE')}
              className={`flex-1 py-3 rounded-[20px] font-bold transition-all ${
                activeTab === 'NODE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Step Details
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`flex-1 py-3 rounded-[20px] font-bold transition-all ${
                activeTab === 'LEDGER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Evidence ({currentTrace.evidenceLedger.length})
            </button>
            <button
              onClick={() => setActiveTab('CLAIMS')}
              className={`flex-1 py-3 rounded-[20px] font-bold transition-all ${
                activeTab === 'CLAIMS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Claims ({currentTrace.claims.length})
            </button>
          </div>

          <div className="p-8 space-y-6">
            {activeTab === 'NODE' && currentNode && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Agent Specialist Role
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{currentNode.agentRole}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{currentNode.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-[20px] bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-1">Execution Latency</span>
                    <span className="text-slate-900 font-extrabold text-lg">{formatLatency(currentNode.latencyMs)}</span>
                  </div>
                  <div className="p-5 rounded-[20px] bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-1">Token Burn</span>
                    <span className="text-slate-900 font-extrabold text-lg">{formatCost(currentNode.tokenCostUsd)}</span>
                  </div>
                </div>

                {/* Collapsible Input Payload to declutter */}
                <div className="space-y-2 border border-slate-100 rounded-[20px] overflow-hidden">
                  <button 
                    onClick={() => setShowInputPayload(!showInputPayload)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <span className="text-sm font-bold text-slate-700">Input Data Payload</span>
                    {showInputPayload ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showInputPayload && (
                    <div className="p-4 bg-white border-t border-slate-100">
                      <pre className="text-xs font-mono text-slate-600 overflow-x-auto">
                        {JSON.stringify(currentNode.inputPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Collapsible Output Payload to declutter */}
                <div className="space-y-2 border border-slate-100 rounded-[20px] overflow-hidden">
                  <button 
                    onClick={() => setShowOutputPayload(!showOutputPayload)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <span className="text-sm font-bold text-slate-700">Emitted Decision Payload</span>
                    {showOutputPayload ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showOutputPayload && (
                     <div className="p-4 bg-white border-t border-slate-100">
                      <pre className="text-xs font-mono text-indigo-600 overflow-x-auto">
                        {JSON.stringify(currentNode.outputPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'LEDGER' && (
              <div className="space-y-4">
                <span className="text-sm font-bold text-slate-800 block mb-2">
                  Grounding Sources in Ledger:
                </span>
                {currentTrace.evidenceLedger.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-[24px] bg-[#F8FAFD] border border-[#E9EEF5] space-y-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {getSourceIcon(ev.sourceType)}
                        </div>
                        <span className="font-bold text-slate-900">{ev.toolName}</span>
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {Math.round(ev.confidence * 100)}% Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{ev.summary}</p>
                    <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between pt-3 border-t border-slate-200/60">
                      <span>ID: {ev.id}</span>
                      <span>{ev.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'CLAIMS' && (
              <div className="space-y-4">
                <span className="text-sm font-bold text-slate-800 block mb-2">
                  Synthesized Semantic Claims:
                </span>
                {currentTrace.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-5 rounded-[24px] bg-white border border-slate-100 space-y-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{claim.id}</span>
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                        claim.status === 'SUPPORTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{claim.statement}</p>
                    <div className="text-[11px] font-bold text-slate-500 flex flex-wrap items-center gap-2 pt-2">
                      <span className="uppercase tracking-wider">Citations:</span>
                      {claim.evidenceRefs.map(ref => (
                        <span key={ref} className="text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
