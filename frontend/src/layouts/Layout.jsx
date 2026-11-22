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
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', code: 'SYS_01', icon: LayoutDashboard },
  { path: '/vehicles', label: 'My Vehicles', code: 'FLT_02', icon: Car },
  { path: '/diagnose', label: 'Diagnose Vehicle', code: 'DIAG_03', icon: Stethoscope },
  { path: '/reports', label: 'Diagnostic Reports', code: 'AUD_04', icon: FileText },
  { path: '/maintenance', label: 'Maintenance', code: 'MNT_05', icon: Wrench },
  { path: '/knowledge-base', label: 'Knowledge Base', code: 'KB_06', icon: BookOpen },
  { path: '/monitor', label: 'Expert System Monitor', code: 'MON_07', icon: Activity },
  { path: '/demo', label: 'Academic Demo', code: 'EVAL_08', icon: GraduationCap },
  { path: '/settings', label: 'Settings', code: 'CFG_09', icon: Settings },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#EAEAEA] font-mono selection:bg-[#E61919] selection:text-white">
      {/* Sidebar Tactical Chassis */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#262626] flex flex-col shrink-0">
        {/* Brand / Logo Stamp */}
        <div className="p-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1.5 bg-[#E61919] text-white font-mono font-black text-xs tracking-widest rounded-none">
              [AE//01]
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-[#EAEAEA] uppercase">
                AUTOEXPERT
              </h1>
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#E61919] block">
                TACTICAL TELEMETRY SYS
              </span>
            </div>
          </div>
          <div className="mt-3 px-2 py-1 bg-[#121212] border border-[#262626] text-[10px] text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-[#4AF626] shrink-0" />
            <span className="truncate">CORE: PURE_SYMBOLIC // NO_LLM</span>
          </div>
        </div>

        {/* Navigation Matrix */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider transition rounded-none border-l-2 ${
                    isActive
                      ? 'border-[#E61919] bg-[#181818] text-[#EAEAEA] font-bold'
                      : 'border-transparent text-neutral-400 hover:bg-[#121212] hover:text-[#EAEAEA]'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="text-[9px] text-neutral-600 font-mono shrink-0">
                  {item.code}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Telemetry Hardware Footer */}
        <div className="p-3 border-t border-[#262626] bg-[#0A0A0A] text-[10px] text-neutral-500 space-y-1.5 uppercase">
          <div className="flex justify-between border-b border-[#1E1E1E] pb-1">
            <span>// SUBSYSTEM:</span>
            <span className="text-neutral-300 font-bold">CORE_V1.0</span>
          </div>
          <div className="flex justify-between border-b border-[#1E1E1E] pb-1">
            <span>// LOGIC_MEM:</span>
            <span className="text-[#4AF626] font-bold">3VL_DETERMINISTIC</span>
          </div>
          <div className="flex justify-between">
            <span>// RESOLUTION:</span>
            <span className="text-neutral-300 font-bold">5-TIER_HIERARCHY</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Telemetry Ribbon */}
        <header className="h-14 border-b border-[#262626] bg-[#0A0A0A] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#4AF626] text-xs font-bold font-mono tracking-widest flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#4AF626] animate-pulse"></span>
              [ SYS_STATUS: ONLINE // ENGINE_ACTIVE ]
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2.5 py-1 border border-[#333333] bg-[#121212] text-[#EAEAEA] font-mono uppercase tracking-wider">
              [ 3VL_WORKING_MEMORY // 5-TIER_CONFLICT_RESOLUTION ]
            </span>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0A0A0A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
