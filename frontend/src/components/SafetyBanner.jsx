import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SafetyBanner({ alert }) {
  if (!alert || !alert.triggered) return null;

  return (
    <div className="bg-[#121212] border-2 border-[#E61919] p-5 mb-6 rounded-none font-mono relative">
      {/* Top warning ribbon */}
      <div className="bg-[#E61919] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-3 flex items-center justify-between">
        <span>/// CRITICAL_SAFETY_HALT ///</span>
        <span>PROTOCOL: EMERGENCY_INTERLOCK</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#E61919] text-white shrink-0 rounded-none">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black text-[#E61919] border border-[#E61919] text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
              [ HAZARD_LEVEL: CRITICAL_01 ]
            </span>
            <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wider">
              CRITICAL HAZARD DETECTED — CEASE VEHICLE OPERATION IMMEDIATELY
            </h3>
          </div>
          <p className="text-xs text-[#EAEAEA] font-mono leading-relaxed bg-[#0A0A0A] p-3 border border-neutral-800">
            {alert.message}
          </p>
          <div className="flex items-start gap-2 text-[11px] text-[#E61919] bg-[#0A0A0A] p-2.5 border border-[#E61919]/60 uppercase">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              NOTICE: Interactive diagnostic sequence terminated. Reasoning core halted to prioritize operator & vehicle safety. Certified mechanical inspection required before engine restart.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
