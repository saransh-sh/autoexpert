import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const VARIANT_CLASSES = {
  neutral: 'bg-[#151C26] text-[#8B96A5] border-white/[0.1]',
  unassessed: 'bg-[#151C26] text-[#8B96A5] border-white/[0.1]',
  cyan: 'bg-[#08242E] text-[#67E8F9] border-[#00D9FF]/35',
  attention: 'bg-[#08242E] text-[#67E8F9] border-[#00D9FF]/35',
  lime: 'bg-[#17240A] text-[#C7FF4A] border-[#C7FF4A]/35',
  healthy: 'bg-[#17240A] text-[#C7FF4A] border-[#C7FF4A]/35',
  amber: 'bg-[#261B08] text-[#FBBF24] border-[#F59E0B]/40',
  warning: 'bg-[#261B08] text-[#FBBF24] border-[#F59E0B]/40',
  crimson: 'bg-[#290D16] text-[#FF6B84] border-[#FF3B5C]/45',
  critical: 'bg-[#290D16] text-[#FF6B84] border-[#FF3B5C]/45',
};

const DOT_COLOR_CLASSES = {
  neutral: 'bg-[#8B96A5]',
  unassessed: 'bg-[#8B96A5]',
  cyan: 'bg-[#00D9FF]',
  attention: 'bg-[#00D9FF]',
  lime: 'bg-[#C7FF4A]',
  healthy: 'bg-[#C7FF4A]',
  amber: 'bg-[#F59E0B]',
  warning: 'bg-[#F59E0B]',
  crimson: 'bg-[#FF3B5C]',
  critical: 'bg-[#FF3B5C]',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px] gap-1.5',
  md: 'px-2.5 py-1 text-xs gap-2',
};

function renderIcon(icon) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const IconComp = icon;
  return <IconComp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
}

export default function TelemetryBadge({
  children,
  label,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  icon,
  className = '',
  ...rest
}) {
  const vClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
  const dotClass = DOT_COLOR_CLASSES[variant] || DOT_COLOR_CLASSES.neutral;
  const sClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded border font-mono font-medium uppercase tracking-wider leading-none whitespace-nowrap',
          vClass,
          sClass,
          className
        )
      )}
      {...rest}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {pulse ? (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotClass}`}
            />
          ) : null}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotClass}`} />
        </span>
      ) : null}
      {renderIcon(icon)}
      <span>{children ?? label}</span>
    </span>
  );
}
