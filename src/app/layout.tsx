import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import CommandPalette from '@/components/layout/CommandPalette';
import DataSourceGate from '@/components/layout/DataSourceGate';
import { Toaster } from 'sonner';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500', '600'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Aexather // AI Agent Behavior Engineering Platform',
  description: 'Enterprise Behavior CI/CD, Decision Lineage, Counterfactual Failure Attribution, and Invariant Contracts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="bg-[#F8F9FA] text-[#0F1115] antialiased min-h-screen w-full flex font-sans overflow-hidden">
        
        {/* Full Screen Layout */}
        <div className="w-full h-screen flex relative">
          
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main App Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-y-auto">
            <main className="flex-1">
              {children}
            </main>
          </div>

          {/* Global Command Palette */}
          <CommandPalette />

          {/* Loads live data on mount, and says so when it cannot */}
          <DataSourceGate />
          
          <Toaster position="bottom-right" richColors />
        </div>
      </body>
    </html>
  );
}
