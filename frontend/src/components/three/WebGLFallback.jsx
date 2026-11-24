import React, { Component, useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const STATUS_STYLE_MAP = {
  Critical: {
    stroke: '#FF3B5C',
    fill: 'rgba(255, 59, 92, 0.22)',
    text: '#FF6B84',
    badgeClass: 'border-[#FF3B5C]/50 bg-[#290D16]/90 text-[#FF6B84]',
  },
  Warning: {
    stroke: '#F59E0B',
    fill: 'rgba(245, 158, 11, 0.22)',
    text: '#FBBF24',
    badgeClass: 'border-[#F59E0B]/50 bg-[#261B08]/90 text-[#FBBF24]',
  },
  'Attention Required': {
    stroke: '#00D9FF',
    fill: 'rgba(0, 217, 255, 0.20)',
    text: '#67E8F9',
    badgeClass: 'border-[#00D9FF]/50 bg-[#08242E]/90 text-[#67E8F9]',
  },
  Healthy: {
    stroke: '#C7FF4A',
    fill: 'rgba(199, 255, 74, 0.20)',
    text: '#C7FF4A',
    badgeClass: 'border-[#C7FF4A]/50 bg-[#17240A]/90 text-[#C7FF4A]',
  },
  'Not Assessed': {
    stroke: '#00D9FF',
    fill: 'rgba(0, 217, 255, 0.12)',
    text: '#8B96A5',
    badgeClass: 'border-white/15 bg-[#10151D]/90 text-[#8B96A5]',
  },
};

const DEFAULT_HOTSPOTS = [
  { key: 'engine', label: 'Engine Core', code: 'SYS-ENG' },
  { key: 'electrical', label: 'Electrical Bus', code: 'SYS-ELC' },
  { key: 'transmission', label: 'Drivetrain', code: 'SYS-TRN' },
  { key: 'brakes', label: 'Braking System', code: 'SYS-BRK' },
  { key: 'cooling_lubrication', label: 'Thermal & Oil', code: 'SYS-THM' },
  { key: 'suspension_tyres', label: 'Chassis & Tyres', code: 'SYS-SUS' },
  { key: 'fuel_system', label: 'Fuel Delivery', code: 'SYS-FUL' },
];

// Pixel-aligned coordinates inside 1600x900 studio renders
const CAR_SVG_COORDS = {
  cooling_lubrication: { x: 745, y: 522, lx: 560, ly: 350 },
  engine: { x: 895, y: 445, lx: 760, ly: 225 },
  electrical: { x: 1055, y: 382, lx: 1030, ly: 195 },
  brakes: { x: 1072, y: 525, lx: 910, ly: 735 },
  transmission: { x: 1225, y: 495, lx: 1215, ly: 735 },
  fuel_system: { x: 1320, y: 422, lx: 1345, ly: 230 },
  suspension_tyres: { x: 1445, y: 485, lx: 1440, ly: 690 },
};

const MOTO_SVG_COORDS = {
  suspension_tyres: { x: 425, y: 605, lx: 250, ly: 720 },
  transmission: { x: 675, y: 585, lx: 530, ly: 755 },
  fuel_system: { x: 830, y: 315, lx: 690, ly: 165 },
  engine: { x: 845, y: 545, lx: 845, ly: 760 },
  cooling_lubrication: { x: 1015, y: 475, lx: 1230, ly: 390 },
  electrical: { x: 1085, y: 245, lx: 1235, ly: 170 },
  brakes: { x: 1215, y: 605, lx: 1350, ly: 710 },
};

/**
 * Checks whether WebGL1 or WebGL2 is available in the current browser context.
 */
export function detectWebGLSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
      return false;
    }
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      return false;
    }

    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) {
      loseExt.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}

function getSubsystemStatus(subsystemStatuses, key) {
  const entry = subsystemStatuses?.[key];
  const raw = typeof entry === 'string' ? entry : entry?.status;
  return raw && STATUS_STYLE_MAP[raw] ? raw : 'Not Assessed';
}

export function WebGLFallbackView({
  vehicleType = 'car',
  activeSubsystem = null,
  onSelectSubsystem = () => {},
  subsystemStatuses = {},
  hotspots = DEFAULT_HOTSPOTS,
  reason = '2D Telemetry Mode',
  className = '',
}) {
  const isMoto = vehicleType === 'motorcycle';
  const artworkSrc = isMoto
    ? '/assets/moto-telemetry-silhouette.jpg'
    : '/assets/hero-concept-chassis.jpg';
  const coordMap = isMoto ? MOTO_SVG_COORDS : CAR_SVG_COORDS;

  const activeSpot = hotspots.find((h) => h.key === activeSubsystem);
  const activeStatus = activeSpot
    ? getSubsystemStatus(subsystemStatuses, activeSpot.key)
    : null;
  const activeStyle = activeStatus ? STATUS_STYLE_MAP[activeStatus] : null;

  return (
    <div
      className={twMerge(
        'relative w-full h-full min-h-[340px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#07090C] select-none',
        className
      )}
      role="region"
      aria-label={`${isMoto ? 'Motorcycle' : 'Vehicle'} interactive telemetry blueprint`}
    >
      {/* Synchronized Studio Artwork + Interactive SVG Hotspot Overlay */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full block"
      >
        <title>NEXUS Vehicle Telemetry Interactive Schematic</title>
        <defs>
          <radialGradient id="nexus-fallback-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="48%" stopColor="#07090C" stopOpacity="0" />
            <stop offset="100%" stopColor="#07090C" stopOpacity="0.82" />
          </radialGradient>
          <pattern id="nexus-fallback-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(0, 217, 255, 0.06)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <image
          href={artworkSrc}
          x="0"
          y="0"
          width="1600"
          height="900"
          preserveAspectRatio="none"
        />

        <rect x="0" y="0" width="1600" height="900" fill="url(#nexus-fallback-grid)" />
        <rect x="0" y="0" width="1600" height="900" fill="url(#nexus-fallback-vignette)" />

        {/* Interactive Hotspot Nodes & Leader Callouts */}
        {hotspots.map((spot) => {
          const coords = coordMap[spot.key] || { x: 800, y: 450, lx: 800, ly: 320 };
          const status = getSubsystemStatus(subsystemStatuses, spot.key);
          const style = STATUS_STYLE_MAP[status];
          const isActive = activeSubsystem === spot.key;
          const isFlagged = status === 'Critical' || status === 'Warning';

          return (
            <g
              key={spot.key}
              role="button"
              tabIndex={0}
              aria-label={`${spot.label} (${spot.code}) — Status: ${status}`}
              aria-pressed={isActive}
              onClick={() => onSelectSubsystem(spot.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSubsystem(spot.key);
                }
              }}
              className="cursor-pointer focus:outline-none group"
            >
              {/* Angled Leader Line */}
              <polyline
                points={`${coords.x},${coords.y} ${(coords.x + coords.lx) / 2},${coords.ly} ${coords.lx},${coords.ly}`}
                fill="none"
                stroke={style.stroke}
                strokeWidth={isActive ? 2.4 : 1.4}
                strokeOpacity={isActive || isFlagged ? 0.9 : 0.45}
                strokeDasharray={isActive ? undefined : '4 4'}
              />

              {/* Outer Halo Ring */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isActive ? 24 : 18}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={isActive ? 2.2 : 1.3}
                strokeOpacity={isActive || isFlagged ? 0.95 : 0.65}
              />

              {/* Inner Precision Target Dot */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isActive ? 7 : 5}
                fill={style.stroke}
              />

              {/* Compact Tactical Pill Label */}
              <g transform={`translate(${coords.lx}, ${coords.ly})`}>
                <rect
                  x="-76"
                  y="-17"
                  width="152"
                  height="34"
                  rx="4"
                  fill={isActive ? '#0C151F' : 'rgba(11, 15, 21, 0.88)'}
                  stroke={style.stroke}
                  strokeWidth={isActive ? 1.8 : 1}
                  strokeOpacity={isActive || isFlagged ? 0.9 : 0.4}
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fill={style.stroke}
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  letterSpacing="1.1"
                >
                  {spot.code}
                </text>
                <text
                  x="0"
                  y="11"
                  textAnchor="middle"
                  fill="#E8EDF3"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                >
                  {spot.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Top HUD Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className="inline-flex items-center gap-2 rounded border border-white/[0.1] bg-[#07090C]/80 px-2.5 py-1 backdrop-blur-sm">
          <Layers className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8EDF3]">
            {reason} · {isMoto ? 'SUPERBIKE' : 'FASTBACK GT'}
          </span>
        </div>

        {activeSpot && activeStyle ? (
          <div
            className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm ${activeStyle.badgeClass}`}
          >
            <span>{activeSpot.code}</span>
            <span className="opacity-50">/</span>
            <span>{activeStatus}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    if (this.props.onError) {
      this.props.onError(err);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function WebGLFallback({
  children,
  vehicleType = 'car',
  activeSubsystem = null,
  onSelectSubsystem = () => {},
  subsystemStatuses = {},
  hotspots = DEFAULT_HOTSPOTS,
  contextLost = false,
  className = '',
}) {
  const [webglReady, setWebglReady] = useState(() => detectWebGLSupport());

  useEffect(() => {
    setWebglReady(detectWebGLSupport());
  }, []);

  const fallbackEl = (
    <WebGLFallbackView
      vehicleType={vehicleType}
      activeSubsystem={activeSubsystem}
      onSelectSubsystem={onSelectSubsystem}
      subsystemStatuses={subsystemStatuses}
      hotspots={hotspots}
      reason={contextLost ? 'WebGL Context Paused' : '2D Blueprint Mode'}
      className={className}
    />
  );

  if (!webglReady || contextLost) {
    return fallbackEl;
  }

  return <WebGLErrorBoundary fallback={fallbackEl}>{children}</WebGLErrorBoundary>;
}
