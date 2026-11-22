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
  Flame,
  CheckCircle2,
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
    <div className="flex min-h-screen bg-[#13111C] text-[#FFFDF9] font-sans selection:bg-[#FF7844] selection:text-black">
      {/* Sidebar Tactical Chassis */}
      <aside className="w-64 bg-[#161320] border-r-2 border-black flex flex-col shrink-0">
        {/* Brand / Logo Stamp */}
        <div className="p-4 border-b-2 border-black bg-[#1E1A29]">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1.5 bg-[#FF7844] text-black font-mono font-black text-xs tracking-wider border-2 border-black shadow-[2px_2px_0px_#000000] -rotate-1">
              [AE // 2026]
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white uppercase font-sans">
                AUTOEXPERT
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#49D49D] font-mono block">
                HACKTOBER // VEHICLE INTEL
              </span>
            </div>
          </div>
          <div className="mt-3 px-2 py-1 bg-[#FED156] border-2 border-black text-[10px] text-black font-mono font-bold shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="truncate">PURE_SYMBOLIC // NO_LLM</span>
          </div>
        </div>

        {/* Navigation Matrix */}
        <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider transition-all duration-100 ${
                    isActive
                      ? 'bg-[#FF7844] text-black font-black border-2 border-black shadow-[3px_3px_0px_#000000] translate-x-1'
                      : 'border-2 border-transparent text-neutral-300 font-bold hover:text-black hover:bg-[#FED156] hover:border-black hover:shadow-[3px_3px_0px_#000000]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-neutral-400 group-hover:text-black'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border border-black/40 ${isActive ? 'bg-black/15 text-black' : 'bg-black/20 text-neutral-400'} shrink-0`}>
                      {item.code}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Telemetry Hardware Footer */}
        <div className="p-3 border-t-2 border-black bg-[#13111C] text-[10px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-neutral-400 uppercase">// ENGINE:</span>
            <span className="px-1.5 py-0.5 bg-[#49D49D] text-black font-mono font-bold border border-black text-[9px] shadow-[1px_1px_0px_#000000]">
              CORE_V1.0
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-neutral-400 uppercase">// LOGIC:</span>
            <span className="px-1.5 py-0.5 bg-[#FED156] text-black font-mono font-bold border border-black text-[9px] shadow-[1px_1px_0px_#000000]">
              3VL_DETERMINISTIC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-neutral-400 uppercase">// RESOLUTION:</span>
            <span className="px-1.5 py-0.5 bg-[#FF4785] text-white font-mono font-bold border border-black text-[9px] shadow-[1px_1px_0px_#000000]">
              5-TIER_HIERARCHY
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Telemetry Ribbon */}
        <header className="h-16 border-b-2 border-black bg-[#161320] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-[#49D49D] text-black border-2 border-black px-3 py-1 font-mono font-bold text-xs shadow-[2px_2px_0px_#000000] flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-black rounded-full animate-pulse"></span>
              SYS_STATUS: ONLINE // DETERMINISTIC CORE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#FED156] text-black border-2 border-black px-2.5 py-1 font-mono font-bold text-[11px] shadow-[2px_2px_0px_#000000] hidden sm:inline-block">
              3VL WORKING MEMORY
            </span>
            <span className="bg-[#FF4785] text-white border-2 border-black px-2.5 py-1 font-mono font-bold text-[11px] shadow-[2px_2px_0px_#000000] rotate-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              HACKTOBER 2026
            </span>
          </div>
        </header>

        {/* Page Outlet with Retro Dot Matrix Canvas */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#13111C] retro-dots">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
