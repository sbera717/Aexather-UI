'use client';

import React from 'react';
import { usePlatformStore } from '@/store/platformStore';
import { 
  Search, 
  Settings, 
  Sparkles,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const { setCommandPaletteOpen } = usePlatformStore();
  const pathname = usePathname();

  const navLinks = [
    { label: 'Platform', href: '/' },
    { label: 'Studio', href: '/studio' },
    { label: 'Debugger', href: '/debugger' },
    { label: 'Contracts', href: '/contracts' },
  ];

  return (
    <header className="h-24 px-8 lg:px-16 flex items-center justify-between bg-transparent relative z-50">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2 shrink-0">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        <span className="font-bold text-xl tracking-tight text-[#0F1115]">
          Aexather<span className="font-light">Platform</span>
        </span>
      </div>

      {/* Center Navigation Links (Aniwall Style) */}
      <nav className="hidden md:flex items-center space-x-8">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              pathname === link.href ? 'text-[#0F1115]' : 'text-slate-500 hover:text-[#0F1115]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right Control Icons */}
      <div className="flex items-center space-x-4 shrink-0">
        {/* Search Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Action Button (Pill) */}
        <button className="hidden sm:block btn-pill-dark">
          Dashboard
        </button>
        
        {/* Mobile Menu */}
        <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-900">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
