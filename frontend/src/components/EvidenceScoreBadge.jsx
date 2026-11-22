import React from 'react';
import { Target } from 'lucide-react';

export default function EvidenceScoreBadge({ score }) {
  const numericScore = typeof score === 'number' ? score : 100.0;

  let colorClasses = 'border-[#E61919] text-[#E61919]';
  if (numericScore >= 90) {
    colorClasses = 'border-[#4AF626] text-[#4AF626]';
  } else if (numericScore >= 70) {
    colorClasses = 'border-[#F59E0B] text-[#F59E0B]';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-bold border uppercase tracking-wider bg-[#0A0A0A] ${colorClasses}`}
    >
      <Target className="w-3.5 h-3.5" />
      <span>[ EVIDENCE_MATCH: {numericScore}% ]</span>
    </div>
  );
}
