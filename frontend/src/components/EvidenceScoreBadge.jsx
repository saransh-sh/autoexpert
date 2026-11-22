import React from 'react';
import { Target } from 'lucide-react';

export default function EvidenceScoreBadge({ score }) {
  const numericScore = typeof score === 'number' ? score : 100.0;

  let colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (numericScore >= 90) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (numericScore >= 70) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <Target className="w-3.5 h-3.5" />
      <span>Evidence-Match Score: {numericScore}%</span>
    </div>
  );
}
