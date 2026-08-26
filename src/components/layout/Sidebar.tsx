'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles,
  LayoutDashboard,
  Workflow,
  ShieldCheck,
  ActivitySquare,
  Settings,
  User
} from 'lucide-react';

const mainLinks = [
  { href: '/', icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-50' },
  { href: '/studio', icon: Workflow, color: 'text-purple-500', bg: 'bg-purple-50' },
  { href: '/debugger', icon: ActivitySquare, color: 'text-amber-500', bg: 'bg-amber-50' },
  { href: '/contracts', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 bg-white border-r border-[#E9EEF5] flex flex-col items-center py-6 shrink-0 z-20">
      {/* Brand Icon */}
      <Link href="/" className="mb-10 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
        <Sparkles className="w-5 h-5" />
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col space-y-6">
        {mainLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link 
              key={link.href} 
              href={link.href}
              className="relative flex items-center justify-center group"
            >
              {isActive && (
                <div className="absolute -left-5 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
              <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-200 ${
                isActive 
                  ? `${link.bg} ${link.color} shadow-sm scale-110` 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col space-y-6">
        <button 
          onClick={() => {
            import('sonner').then(({ toast }) => toast.info('Settings menu opened'));
          }}
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
          <Settings className="w-5 h-5" />
        </button>
        <button 
          onClick={() => {
            import('sonner').then(({ toast }) => toast.info('User profile opened'));
          }}
          className="w-11 h-11 rounded-[14px] overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner hover:scale-105 transition-transform">
           {/* Profile Picture Placeholder */}
           <User className="w-6 h-6 text-slate-400 mt-1" />
        </button>
      </div>
    </aside>
  );
}
