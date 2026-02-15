'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import ThemeToggle from './ThemeToggle';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 glass-nav flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-foreground/80 hover:text-foreground p-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-bold text-foreground">OpenClaw</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Nav bar */}
      <NavBar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <main className="min-h-screen lg:ml-64 pt-14 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
