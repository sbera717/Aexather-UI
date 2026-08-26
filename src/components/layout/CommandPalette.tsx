'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStore } from '@/store/platformStore';
import { 
  Search, 
  LayoutDashboard, 
  GitFork, 
  FlaskConical, 
  ShieldCheck, 
  ListChecks, 
  Rocket, 
  Cpu,
  Workflow,
  X
} from 'lucide-react';

export default function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = usePlatformStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    { name: 'Go to Dashboard', href: '/', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Inspect Lineage Studio & DAG Flow', href: '/studio', icon: GitFork, category: 'Agent Engineering' },
    { name: 'Run Causal Failure Attribution Debugger', href: '/debugger', icon: FlaskConical, category: 'Agent Engineering' },
    { name: 'Open Behavioral Invariant Contracts IDE (CEL)', href: '/contracts', icon: ShieldCheck, category: 'Policy Engine' },
    { name: 'View Regression CI/CD Benchmark Matrix', href: '/regressions', icon: ListChecks, category: 'Evaluation CI/CD' },
    { name: 'Open Pareto Promotion & Release Gateway', href: '/promotion', icon: Rocket, category: 'Release Management' },
  ];

  const filtered = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page name, or agent action..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button 
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching actions or navigation targets found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.href) router.push(item.href);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F1F4F9] text-left transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F8FAFD] border border-[#E9EEF5] flex items-center justify-center text-slate-500 group-hover:text-blue-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Quick Actions</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
}
