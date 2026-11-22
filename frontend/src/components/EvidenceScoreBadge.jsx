import React from 'react';
import { Target } from 'lucide-react';

export default function EvidenceScoreBadge({ score }) {
  const numericScore = typeof score === 'number' ? score : 100.0;

  let colorClasses = 'bg-[#FF4785] text-white border-2 border-black shadow-[2px_2px_0px_#000000]';
  if (numericScore >= 90) {
    colorClasses = 'bg-[#49D49D] text-black border-2 border-black shadow-[2px_2px_0px_#000000]';
  } else if (numericScore >= 70) {
    colorClasses = 'bg-[#FED156] text-black border-2 border-black shadow-[2px_2px_0px_#000000]';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-black uppercase tracking-wider transition-transform hover:rotate-1 ${colorClasses}`}
    >
      <Target className="w-3.5 h-3.5 shrink-0" />
      <span>[ EVIDENCE_MATCH: {numericScore}% ]</span>
    </div>
  );
}
