import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const VARIANT_CLASSES = {
  primary:
    'bg-[#00D9FF] text-[#07090C] border border-[#00D9FF] hover:bg-[#33E1FF] hover:border-[#33E1FF] font-semibold shadow-sm',
  secondary:
    'bg-[#1B2430] text-[#E8EDF3] border border-white/[0.12] hover:bg-[#232F3F] hover:border-white/[0.2] font-medium',
  outline:
    'bg-[#0C1016] text-[#00D9FF] border border-[#00D9FF]/45 hover:bg-[#00D9FF]/10 hover:border-[#00D9FF] font-medium',
  lime:
    'bg-[#C7FF4A] text-[#07090C] border border-[#C7FF4A] hover:bg-[#D5FF75] font-semibold',
  danger:
    'bg-[#FF3B5C] text-white border border-[#FF3B5C] hover:bg-[#FF5470] font-semibold',
  ghost:
    'bg-transparent text-[#8B96A5] border border-transparent hover:text-[#E8EDF3] hover:bg-white/[0.06] font-medium',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded',
  md: 'px-4 py-2 text-sm gap-2 rounded-md',
  lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-md',
};

function renderIcon(icon) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const IconComp = icon;
  return <IconComp className="w-4 h-4 shrink-0" aria-hidden="true" />;
}

export default function HudButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  as,
  to,
  href,
  type = 'button',
  className = '',
  ...rest
}) {
  const Component = as || (to ? Link : href ? 'a' : 'button');
  const isDisabled = disabled || loading;

  const classes = twMerge(
    clsx(
      'inline-flex items-center justify-center whitespace-nowrap select-none transition-all duration-150',
      'active:scale-[0.985] nexus-focus',
      VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
      SIZE_CLASSES[size] || SIZE_CLASSES.md,
      isDisabled && 'opacity-50 pointer-events-none',
      className
    )
  );

  const componentProps = {
    className: classes,
    ...(Component === 'button' ? { type, disabled: isDisabled } : {}),
    ...(to ? { to } : {}),
    ...(href ? { href } : {}),
    ...(isDisabled && Component !== 'button' ? { 'aria-disabled': true } : {}),
    ...rest,
  };

  return (
    <Component {...componentProps}>
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        renderIcon(icon)
      )}
      <span>{children}</span>
      {!loading ? renderIcon(iconRight) : null}
    </Component>
  );
}
