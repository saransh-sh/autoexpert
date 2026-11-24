import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

function renderIcon(icon) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const IconComp = icon;
  return <IconComp className="w-5 h-5 text-[#00D9FF] shrink-0" aria-hidden="true" />;
}

export default function SectionHeader({
  title,
  description,
  subtitle,
  eyebrow,
  code,
  icon,
  actions,
  bordered = true,
  className = '',
}) {
  const copy = description ?? subtitle;

  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
          bordered && 'border-b border-white/[0.08] pb-5',
          className
        )
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {eyebrow || code ? (
          <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8B96A5]">
            {code ? <span className="text-[#00D9FF] font-semibold">{code}</span> : null}
            {code && eyebrow ? <span className="text-white/20">/</span> : null}
            {eyebrow ? <span>{eyebrow}</span> : null}
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#E8EDF3] sm:text-3xl flex items-center gap-2.5">
          {renderIcon(icon)}
          <span>{title}</span>
        </h1>
        {copy ? (
          <p className="max-w-2xl text-sm text-[#8B96A5] leading-relaxed">
            {copy}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
