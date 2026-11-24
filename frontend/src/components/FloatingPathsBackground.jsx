import React, { useMemo, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const INTENSITY_COUNT = {
  low: 14,
  medium: 22,
  high: 30,
};

function resolvePathCount(intensity) {
  if (typeof intensity === 'number' && Number.isFinite(intensity)) {
    return Math.max(6, Math.min(36, Math.round(intensity)));
  }
  return INTENSITY_COUNT[intensity] ?? INTENSITY_COUNT.medium;
}

function getStrokePalette(variant, index) {
  if (variant === 'light') {
    const isAccent = index % 6 === 0;
    return {
      stroke: isAccent ? '#0891B2' : '#10151D',
      baseOpacity: isAccent ? 0.16 : 0.055 + (index % 5) * 0.015,
    };
  }

  if (variant === 'cyan') {
    const isLimeAccent = index % 9 === 0;
    const isWhiteThread = index % 4 === 1;
    return {
      stroke: isLimeAccent ? '#C7FF4A' : isWhiteThread ? '#E8EDF3' : '#00D9FF',
      baseOpacity: isLimeAccent
        ? 0.08
        : isWhiteThread
          ? 0.045 + (index % 4) * 0.012
          : 0.07 + (index % 6) * 0.02,
    };
  }

  // Default: 'dark' — refined cool-white trajectories with sparse cyan telemetry threads
  const isCyanThread = index % 5 === 0;
  return {
    stroke: isCyanThread ? '#00D9FF' : '#E8EDF3',
    baseOpacity: isCyanThread
      ? 0.075 + (index % 4) * 0.02
      : 0.035 + (index % 5) * 0.014,
  };
}

function buildStreamPaths(streamIndex, count, variant) {
  const paths = [];
  for (let i = 0; i < count; i += 1) {
    const offset = i * 6.5;
    const spread = i * 7.2;
    const d =
      streamIndex === 0
        ? [
            `M ${-220 - offset} ${-120 + spread}`,
            `C ${80 - offset * 0.4} ${140 + spread * 0.55},`,
            `${460 + offset * 0.25} ${390 - spread * 0.2},`,
            `${820 - offset * 0.15} ${270 + spread * 0.4}`,
            `S ${1180 + offset * 0.35} ${490 - spread * 0.25},`,
            `${1440 + offset} ${740 - spread * 0.35}`,
          ].join(' ')
        : [
            `M ${-220 - offset * 0.8} ${760 - spread}`,
            `C ${140 + offset * 0.3} ${520 - spread * 0.45},`,
            `${480 - offset * 0.25} ${250 + spread * 0.3},`,
            `${860 + offset * 0.2} ${370 - spread * 0.35}`,
            `S ${1190 - offset * 0.3} ${170 + spread * 0.25},`,
            `${1440 + offset} ${-90 + spread * 0.35}`,
          ].join(' ');

    const { stroke, baseOpacity } = getStrokePalette(variant, i + streamIndex * 3);

    paths.push({
      id: `stream-${streamIndex}-${i}`,
      d,
      stroke,
      baseOpacity,
      strokeWidth: 0.55 + (i % 4) * 0.22,
      duration: 20 + (i % 7) * 2.8,
      delay: (i % 6) * 0.45,
    });
  }
  return paths;
}

export default function FloatingPathsBackground({
  variant = 'dark',
  intensity = 'medium',
  interactive = false,
  className = '',
  children,
}) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const count = resolvePathCount(intensity);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 24, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 24, mass: 0.6 });
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  const streams = useMemo(() => {
    return [
      ...buildStreamPaths(0, count, variant),
      ...buildStreamPaths(1, Math.max(8, Math.floor(count * 0.75)), variant),
    ];
  }, [count, variant]);

  const handlePointerMove = (e) => {
    if (!interactive || shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    if (!interactive) return;
    pointerX.set(0);
    pointerY.set(0);
  };

  const isLight = variant === 'light';

  return (
    <div
      ref={containerRef}
      onMouseMove={interactive ? handlePointerMove : undefined}
      onMouseLeave={interactive ? handlePointerLeave : undefined}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        aria-hidden="true"
        style={
          interactive && !shouldReduceMotion
            ? { x: translateX, y: translateY }
            : undefined
        }
        className="pointer-events-none absolute inset-[-24px] select-none"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 680"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          style={{
            maskImage:
              'radial-gradient(ellipse 88% 82% at 50% 50%, #000000 42%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 88% 82% at 50% 50%, #000000 42%, transparent 100%)',
          }}
        >
          <title>NEXUS Telemetry Vector Paths</title>
          {streams.map((path) =>
            shouldReduceMotion ? (
              <path
                key={path.id}
                d={path.d}
                stroke={path.stroke}
                strokeWidth={path.strokeWidth}
                strokeOpacity={path.baseOpacity}
                strokeLinecap="round"
              />
            ) : (
              <motion.path
                key={path.id}
                d={path.d}
                stroke={path.stroke}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                initial={{
                  pathLength: 0.35,
                  pathOffset: 0,
                  opacity: path.baseOpacity * 0.65,
                }}
                animate={{
                  pathLength: [0.35, 0.82, 0.35],
                  pathOffset: [0, 1],
                  opacity: [
                    path.baseOpacity * 0.45,
                    path.baseOpacity,
                    path.baseOpacity * 0.45,
                  ],
                }}
                transition={{
                  duration: path.duration,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: path.delay,
                }}
              />
            )
          )}
        </svg>
      </motion.div>

      {/* Edge vignette fade so paths never compete with foreground typography */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          isLight
            ? 'bg-gradient-to-b from-white/70 via-transparent to-white/85'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(7,9,12,0.78)_100%)]'
        }`}
      />

      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}
