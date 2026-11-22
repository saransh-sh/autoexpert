import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SafetyBanner({ alert }) {
  if (!alert || !alert.triggered) return null;

  return (
    <div className="bg-red-950/80 border-2 border-red-600 rounded-xl p-5 mb-6 shadow-lg shadow-red-950/50 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-600 text-white rounded-lg shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded tracking-wider uppercase">
              Safety Interruption
            </span>
            <h3 className="text-lg font-bold text-red-200">
              CRITICAL HAZARD DETECTED — STOP VEHICLE SAFELY
            </h3>
          </div>
          <p className="mt-2 text-sm text-red-100 font-medium leading-relaxed">
            {alert.message}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-red-300 bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Diagnostic interview has been paused to prioritize human safety. Do not continue driving until inspected by a certified technician.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
