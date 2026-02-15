'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/usage', label: 'Usage', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/sessions', label: 'Sessions', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/memory', label: 'Memory', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

interface NavBarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function NavBar({ mobileOpen = false, onClose }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 h-screen w-64 z-50
        glass-nav flex flex-col p-4
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          OpenClaw
        </h2>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden text-white/60 hover:text-white p-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <ul className="flex-1 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-purple-500/10 border border-white/10'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/90 border border-transparent'
                  }
                `}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Divider */}
      <div className="border-t border-white/10 dark:border-white/10 my-3" />

      {/* Theme toggle (desktop only - mobile has it in header) */}
      <div className="hidden lg:flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-sm text-foreground/40">Theme</span>
        <ThemeToggle />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 border border-transparent"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-medium">Logout</span>
      </button>
    </nav>
  );
}
