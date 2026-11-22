import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Stethoscope,
  FileText,
  Wrench,
  BookOpen,
  Activity,
  GraduationCap,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/vehicles', label: 'My Vehicles', icon: Car },
  { path: '/diagnose', label: 'Diagnose Vehicle', icon: Stethoscope },
  { path: '/reports', label: 'Diagnostic Reports', icon: FileText },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { path: '/monitor', label: 'Expert System Monitor', icon: Activity },
  { path: '/demo', label: 'Academic Demo', icon: GraduationCap },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary rounded-lg text-white font-black shadow-md shadow-primary/20">
              AE
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AutoExpert
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-accent">
                Intelligent Diagnostic System
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 rounded border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Pure Symbolic Engine (No LLM)</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-border text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Engine:</span>
            <span className="font-mono text-slate-300">autoexpert v1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Inference:</span>
            <span className="text-emerald-400 font-medium">Deterministic 3VL</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">
              Symbolic Inference Engine Active
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full font-semibold">
              3VL Working Memory &bull; 5-Tier Conflict Resolution
            </span>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
