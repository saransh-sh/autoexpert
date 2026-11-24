import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import TelemetryBadge from './ui/TelemetryBadge';

export default function SafetyBanner({ alert, className = '' }) {
  if (!alert || !alert.triggered) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`mb-6 rounded-md border border-[#FF3B5C]/50 border-l-4 border-l-[#FF3B5C] bg-[#160A0E] p-5 shadow-nexus-crimson ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#FF3B5C]/25 pb-3">
        <div className="flex items-center gap-2.5">
          <TelemetryBadge variant="critical" dot pulse>
            CRITICAL SAFETY HALT
          </TelemetryBadge>
          {alert.fact ? (
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FF8FA3]">
              TRIGGER: {alert.fact}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF6B84]">
          {alert.level || 'EMERGENCY_INTERLOCK'}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#FF3B5C]/40 bg-[#290D16] text-[#FF3B5C]">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-[#E8EDF3] sm:text-base">
            Critical Hazard Detected — Cease Vehicle Operation Immediately
          </h3>
          <p className="rounded border border-white/[0.08] bg-[#0B0608] p-3.5 font-mono text-xs leading-relaxed text-[#E8EDF3]">
            {alert.message}
          </p>
          <div className="flex items-start gap-2.5 rounded border border-[#FF3B5C]/25 bg-[#1F0B11] p-3 text-xs leading-relaxed text-[#FFC2CD]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
            <span>
              Interactive diagnostic sequence terminated. Reasoning engine halted to prioritize
              operator and vehicle safety. Pull over safely when possible and obtain certified
              mechanical inspection before restarting or driving.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
