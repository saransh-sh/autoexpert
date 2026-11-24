import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Car,
  Cpu,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Settings,
  Stethoscope,
  Wrench,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', code: 'SYS_01', icon: LayoutDashboard },
  { path: '/vehicles', label: 'Vehicles', code: 'FLT_02', icon: Car },
  { path: '/diagnose', label: 'Diagnose', code: 'DIAG_03', icon: Stethoscope },
  { path: '/reports', label: 'Reports', code: 'AUD_04', icon: FileText },
  { path: '/maintenance', label: 'Maintenance', code: 'MNT_05', icon: Wrench },
  { path: '/knowledge-base', label: 'Knowledge', code: 'KB_06', icon: BookOpen },
  { path: '/monitor', label: 'Monitor', code: 'MON_07', icon: Activity },
  { path: '/demo', label: 'Demo', code: 'EVAL_08', icon: GraduationCap },
  { path: '/about', label: 'System Info', code: 'ARCH_09', icon: Cpu },
  { path: '/settings', label: 'Settings', code: 'CFG_10', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-[#07090C] text-[#E8EDF3] font-sans">
      {/* Architectural Cockpit Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-white/[0.08] bg-[#07090C]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1520px] items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 rounded-md py-1 pr-2 nexus-focus"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded border border-[#00D9FF]/40 bg-[#0C141C]">
              <svg
                className="h-[18px] w-[18px] text-[#00D9FF]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2.5L20.5 7.4V16.6L12 21.5L3.5 16.6V7.4L12 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="2.75" fill="currentColor" />
              </svg>
            </div>
            <div className="leading-none">
              <span className="block font-display text-sm font-bold tracking-tight text-[#E8EDF3]">
                NEXUS
              </span>
              <span className="mt-0.5 block font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#00D9FF]">
                AUTOEXPERT
              </span>
            </div>
          </Link>

          {/* Desktop Single-Line Cockpit Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex h-full items-center gap-0.5 xl:gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative flex h-full items-center gap-1.5 whitespace-nowrap px-2 xl:px-2.5 text-[12px] font-medium transition-colors duration-150 nexus-focus ${
                      isActive
                        ? 'text-[#E8EDF3]'
                        : 'text-[#8B96A5] hover:text-[#E8EDF3]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-[#00D9FF]' : 'text-[#5E6B7D]'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                      {isActive ? (
                        shouldReduceMotion ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-1.5 bottom-0 h-[2px] rounded-full bg-[#00D9FF]"
                          />
                        ) : (
                          <motion.span
                            layoutId="nexus-active-rail"
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 36,
                            }}
                            aria-hidden="true"
                            className="absolute inset-x-1.5 bottom-0 h-[2px] rounded-full bg-[#00D9FF]"
                          />
                        )
                      ) : null}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Ambient Telemetry Indicator & Mobile Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              title="Deterministic 3-Valued Logic Symbolic Inference Core Active"
              className="hidden sm:flex items-center gap-2 rounded border border-white/[0.08] bg-[#10151D] px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7FF4A] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C7FF4A]" />
              </span>
              <span className="text-[#E8EDF3] font-medium">ONLINE</span>
              <span className="hidden 2xl:inline text-white/20">/</span>
              <span className="hidden 2xl:inline text-[#00D9FF]">3VL CORE</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-cockpit-nav"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-md border border-white/[0.1] bg-[#10151D] text-[#E8EDF3] hover:border-[#00D9FF]/40 hover:text-[#00D9FF] transition-colors nexus-focus"
            >
              {mobileMenuOpen ? (
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Cockpit Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="mobile-cockpit-nav"
              initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="lg:hidden border-b border-white/[0.1] bg-[#0B0F15] shadow-nexus-elevated"
            >
              <nav
                aria-label="Mobile navigation"
                className="mx-auto grid max-w-2xl grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-2"
              >
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-colors nexus-focus ${
                          isActive
                            ? 'border-[#00D9FF]/40 bg-[#00D9FF]/[0.08] text-[#E8EDF3]'
                            : 'border-transparent text-[#8B96A5] hover:bg-white/[0.04] hover:text-[#E8EDF3]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive ? 'text-[#00D9FF]' : 'text-[#5E6B7D]'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                            {item.code}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Main Content Area: full-bleed on /, spacious container framing on inner routes */}
      {isHome ? (
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 w-full min-w-0 nexus-dot-bg">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      )}

      {/* Architectural System Footer */}
      <footer className="border-t border-white/[0.07] bg-[#07090C]">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-5 text-xs text-[#8B96A5] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-display font-semibold text-[#E8EDF3]">
              NEXUS AUTOEXPERT
            </span>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[11px] text-[#8B96A5]">
              Symbolic 3VL Rule Engine · Zero LLM Dependencies
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/knowledge-base" className="hover:text-[#00D9FF] transition-colors">
              Knowledge Base
            </Link>
            <Link to="/monitor" className="hover:text-[#00D9FF] transition-colors">
              Engine Monitor
            </Link>
            <Link to="/demo" className="hover:text-[#00D9FF] transition-colors">
              Benchmarks
            </Link>
            <Link to="/about" className="hover:text-[#00D9FF] transition-colors">
              System Info
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
