import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SafetyBanner({ alert }) {
  if (!alert || !alert.triggered) return null;

  return (
    <div className="bg-[#2C131D] border-3 border-black p-5 mb-6 shadow-[5px_5px_0px_#000000] relative rotate-[-0.5deg]">
      {/* Top warning ribbon */}
      <div className="bg-[#FF4785] text-white border-2 border-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 mb-3 flex items-center justify-between shadow-[2px_2px_0px_#000000]">
        <span>/// CRITICAL_SAFETY_HALT ///</span>
        <span>PROTOCOL: EMERGENCY_INTERLOCK</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#FF7844] text-black border-2 border-black shrink-0 shadow-[3px_3px_0px_#000000] -rotate-2">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#FED156] text-black border-2 border-black text-[10px] font-black px-2.5 py-0.5 uppercase tracking-widest shadow-[2px_2px_0px_#000000]">
              [ HAZARD_LEVEL: CRITICAL_01 ]
            </span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
              CRITICAL HAZARD DETECTED — CEASE VEHICLE OPERATION IMMEDIATELY
            </h3>
          </div>
          <p className="text-xs text-white font-mono leading-relaxed bg-[#13111C] p-3.5 border-2 border-black shadow-[3px_3px_0px_#000000]">
            {alert.message}
          </p>
          <div className="flex items-start gap-2 text-[11px] text-[#FFAAB8] bg-[#1A0A0E] p-3 border-2 border-black shadow-[2px_2px_0px_#000000] uppercase font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF4785] mt-0.5" />
            <span>
              NOTICE: Interactive diagnostic sequence terminated. Reasoning core halted to prioritize operator &amp; vehicle safety. Certified mechanical inspection required before engine restart.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
