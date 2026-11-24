import React from 'react';
import { Target } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export default function EvidenceScoreBadge({
  score,
  label = 'EVIDENCE MATCH',
  className = '',
}) {
  const numericScore = typeof score === 'number' ? score : 100.0;

  let toneClasses = 'bg-[#290D16] text-[#FF6B84] border-[#FF3B5C]/45';
  if (numericScore >= 90) {
    toneClasses = 'bg-[#17240A] text-[#C7FF4A] border-[#C7FF4A]/35';
  } else if (numericScore >= 70) {
    toneClasses = 'bg-[#261B08] text-[#FBBF24] border-[#F59E0B]/40';
  }

  return (
    <span
      title="Rule-condition match percentage (satisfied premises / total conditions) — not a statistical diagnostic probability."
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider leading-none whitespace-nowrap',
          toneClasses,
          className
        )
      )}
    >
      <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {label}: {numericScore}%
      </span>
    </span>
  );
}
