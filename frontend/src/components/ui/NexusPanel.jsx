import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const VARIANT_CLASSES = {
  default: 'bg-[#10151D] border-white/[0.08] shadow-nexus-panel',
  elevated: 'bg-[#151C26] border-white/[0.11] shadow-nexus-elevated',
  inset: 'bg-[#0A0E13] border-white/[0.07] shadow-inner',
  cyan: 'bg-[#10151D] border-[#00D9FF]/30 shadow-nexus-cyan',
  lime: 'bg-[#10151D] border-[#C7FF4A]/30 shadow-nexus-lime',
  warning: 'bg-[#17130A] border-[#F59E0B]/35 shadow-nexus-panel',
  critical: 'bg-[#190B10] border-[#FF3B5C]/40 shadow-nexus-crimson',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3.5 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function NexusPanel({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  code,
  headerAction,
  interactive = false,
  as: Component = 'div',
  ...rest
}) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;
  const paddingClass = PADDING_CLASSES[padding] ?? PADDING_CLASSES.md;
  const hasHeader = Boolean(title || subtitle || code || headerAction);

  return (
    <Component
      className={twMerge(
        clsx(
          'rounded-md border text-[#E8EDF3] transition-colors duration-150',
          variantClass,
          interactive && 'hover:border-white/[0.18]',
          !hasHeader && paddingClass,
          className
        )
      )}
      {...rest}
    >
      {hasHeader ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                {code ? (
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#00D9FF]">
                    {code}
                  </span>
                ) : null}
                {title ? (
                  <h3 className="font-display text-sm font-semibold tracking-tight text-[#E8EDF3] sm:text-base truncate">
                    {title}
                  </h3>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-[#8B96A5] leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
          <div className={paddingClass}>{children}</div>
        </>
      ) : (
        children
      )}
    </Component>
  );
}
