import React from 'react';
import { twMerge } from 'tailwind-merge';

export const SUBSYSTEM_METADATA = {
  engine: { label: 'Engine Core', code: 'SYS-ENG', short: 'ENG' },
  electrical: { label: 'Electrical Bus', code: 'SYS-ELC', short: 'ELC' },
  transmission: { label: 'Drivetrain', code: 'SYS-TRN', short: 'TRN' },
  brakes: { label: 'Braking System', code: 'SYS-BRK', short: 'BRK' },
  cooling_lubrication: { label: 'Thermal & Oil', code: 'SYS-THM', short: 'THM' },
  suspension_tyres: { label: 'Chassis & Tyres', code: 'SYS-SUS', short: 'SUS' },
  fuel_system: { label: 'Fuel Delivery', code: 'SYS-FUL', short: 'FUL' },
  maintenance: { label: 'Service Interval', code: 'SYS-MNT', short: 'MNT' },
};

const STATUS_ACCENT = {
  Critical: '#FF3B5C',
  Warning: '#F59E0B',
  'Attention Required': '#00D9FF',
  Healthy: '#C7FF4A',
  'Not Assessed': '#00D9FF',
};

function resolveAccent(status) {
  const raw = typeof status === 'string' ? status : status?.status;
  return STATUS_ACCENT[raw] || '#00D9FF';
}

/**
 * Precision CAD-style SVG technical schematic icon for each of the 8 AutoExpert
 * diagnostic & maintenance categories.
 */
export function SubsystemBlueprintIcon({
  subsystem = 'engine',
  status,
  active = false,
  size = 40,
  strokeWidth = 1.5,
  className = '',
  title,
}) {
  const accent = resolveAccent(status);
  const secondary = active ? '#E8EDF3' : '#8B96A5';
  const a11yProps = title
    ? { role: 'img', 'aria-label': title }
    : { 'aria-hidden': 'true' };

  const renderSchematic = () => {
    switch (subsystem) {
      case 'engine':
        // Piston, connecting rod, cylinder sleeve & overhead cam lobes
        return (
          <>
            <rect x="13" y="8" width="22" height="32" rx="1.5" stroke={secondary} strokeDasharray="2 2" />
            <circle cx="19" cy="11" r="2.2" stroke={accent} />
            <circle cx="29" cy="11" r="2.2" stroke={accent} />
            <rect x="16" y="16" width="16" height="10" rx="1.5" stroke={accent} fill={accent} fillOpacity="0.1" />
            <line x1="16" y1="20" x2="32" y2="20" stroke={secondary} />
            <line x1="24" y1="26" x2="24" y2="35" stroke={accent} strokeWidth={strokeWidth + 0.3} />
            <circle cx="24" cy="37" r="3.2" stroke={secondary} />
            <circle cx="24" cy="37" r="1.1" fill={accent} />
          </>
        );

      case 'electrical':
        // Dual-rail ECU bus, stator coil & regulated pulse waveform
        return (
          <>
            <rect x="10" y="14" width="28" height="22" rx="2" stroke={secondary} />
            <rect x="14" y="10" width="5" height="4" stroke={accent} />
            <rect x="29" y="10" width="5" height="4" stroke={accent} />
            <path d="M25 18L19.5 25H24.5L22.5 32L29 24H24L25 18Z" stroke={accent} fill={accent} fillOpacity="0.14" strokeLinejoin="round" />
            <line x1="6" y1="22" x2="10" y2="22" stroke={accent} />
            <line x1="38" y1="22" x2="42" y2="22" stroke={accent} />
            <line x1="6" y1="28" x2="10" y2="28" stroke={secondary} />
            <line x1="38" y1="28" x2="42" y2="28" stroke={secondary} />
          </>
        );

      case 'transmission':
        // Intermeshing primary/secondary helical gears & spline shaft
        return (
          <>
            <circle cx="18" cy="22" r="8" stroke={accent} strokeDasharray="3 2" />
            <circle cx="18" cy="22" r="4.5" stroke={secondary} />
            <circle cx="18" cy="22" r="1.4" fill={accent} />
            <circle cx="31" cy="29" r="6.5" stroke={secondary} strokeDasharray="2.5 2" />
            <circle cx="31" cy="29" r="3" stroke={accent} />
            <line x1="7" y1="22" x2="13.5" y2="22" stroke={secondary} />
            <line x1="34" y1="29" x2="41" y2="29" stroke={accent} />
            <path d="M18 11V14M18 30V33M7 22H10" stroke={accent} />
          </>
        );

      case 'brakes':
        // Ventilated drilled brake rotor + multi-piston radial caliper
        return (
          <>
            <circle cx="23" cy="24" r="13.5" stroke={secondary} />
            <circle cx="23" cy="24" r="10.2" stroke={accent} strokeDasharray="1.5 3.5" />
            <circle cx="23" cy="24" r="5" stroke={secondary} />
            <circle cx="23" cy="24" r="1.6" fill={accent} />
            <path
              d="M31 11.5C35.8 14.5 38.8 19.8 38.8 25.5C38.8 28.2 38 30.8 36.8 33L32.5 30.2C33.5 28.5 34 26.8 34 24.8C34 20.8 31.8 17.2 28.5 15.2L31 11.5Z"
              stroke={accent}
              fill={accent}
              fillOpacity="0.16"
              strokeLinejoin="round"
            />
          </>
        );

      case 'cooling_lubrication':
        // Cross-flow radiator fins + thermal circulation loop
        return (
          <>
            <rect x="11" y="12" width="26" height="22" rx="2" stroke={secondary} />
            <line x1="16" y1="12" x2="16" y2="34" stroke={accent} strokeOpacity="0.65" />
            <line x1="21" y1="12" x2="21" y2="34" stroke={accent} strokeOpacity="0.65" />
            <line x1="27" y1="12" x2="27" y2="34" stroke={accent} strokeOpacity="0.65" />
            <line x1="32" y1="12" x2="32" y2="34" stroke={accent} strokeOpacity="0.65" />
            <path d="M8 17H11M37 29H40" stroke={accent} />
            <path d="M24 18C26.5 21.2 28 23.2 28 25.4C28 27.6 26.2 29.4 24 29.4C21.8 29.4 20 27.6 20 25.4C20 23.2 21.5 21.2 24 18Z" stroke={accent} fill={accent} fillOpacity="0.15" />
          </>
        );

      case 'suspension_tyres':
        // Coilover helical damper strut + tyre tread arc
        return (
          <>
            <path d="M12 37C12 30.4 17.4 25 24 25C30.6 25 36 30.4 36 37" stroke={secondary} />
            <path d="M15.5 37C15.5 32.3 19.3 28.5 24 28.5C28.7 28.5 32.5 32.3 32.5 37" stroke={accent} strokeDasharray="2 2" />
            <line x1="24" y1="8" x2="24" y2="31" stroke={secondary} />
            <path d="M19.5 13H28.5L19.5 17H28.5L19.5 21H28.5" stroke={accent} strokeLinecap="round" strokeLinejoin="round" />
            <rect x="20.5" y="8" width="7" height="3" rx="1" stroke={secondary} />
            <circle cx="24" cy="36" r="2.2" fill={accent} />
          </>
        );

      case 'fuel_system':
        // Pressurized common fuel rail + dual injector nozzles + spray cones
        return (
          <>
            <rect x="10" y="11" width="28" height="5" rx="1.5" stroke={accent} fill={accent} fillOpacity="0.12" />
            <rect x="15" y="16" width="5" height="9" rx="1" stroke={secondary} />
            <rect x="28" y="16" width="5" height="9" rx="1" stroke={secondary} />
            <path d="M17.5 25L13.5 35M17.5 25L17.5 36M17.5 25L21.5 35" stroke={accent} strokeDasharray="2 2" />
            <path d="M30.5 25L26.5 35M30.5 25L30.5 36M30.5 25L34.5 35" stroke={accent} strokeDasharray="2 2" />
            <line x1="7" y1="13.5" x2="10" y2="13.5" stroke={accent} />
          </>
        );

      case 'maintenance':
        // Service gauge dial + precision caliper wrench arc
        return (
          <>
            <circle cx="24" cy="24" r="14" stroke={secondary} strokeDasharray="3 2" />
            <path d="M14 24A10 10 0 1 1 32 30" stroke={accent} strokeLinecap="round" />
            <line x1="24" y1="24" x2="30.5" y2="17.5" stroke={accent} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
            <circle cx="24" cy="24" r="2.2" fill={accent} />
            <path d="M24 10V12.5M38 24H35.5M10 24H12.5" stroke={secondary} />
          </>
        );

      default:
        return (
          <>
            <polygon points="24,8 37,16 37,32 24,40 11,32 11,16" stroke={accent} />
            <circle cx="24" cy="24" r="4" stroke={secondary} />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...a11yProps}
    >
      {title ? <title>{title}</title> : null}
      {/* Subtle architectural corner registration ticks */}
      <path d="M4 9V4H9M39 4H44V9M44 39V44H39M9 44H4V39" stroke={secondary} strokeOpacity="0.32" strokeWidth="1" />
      {renderSchematic()}
    </svg>
  );
}

const CAR_BLUEPRINT_NODES = [
  { key: 'cooling_lubrication', x: 642, y: 222, lx: 705, ly: 132 },
  { key: 'engine', x: 525, y: 196, lx: 560, ly: 62 },
  { key: 'electrical', x: 404, y: 162, lx: 388, ly: 52 },
  { key: 'brakes', x: 565, y: 256, lx: 635, ly: 332 },
  { key: 'transmission', x: 355, y: 242, lx: 382, ly: 332 },
  { key: 'fuel_system', x: 245, y: 186, lx: 192, ly: 76 },
  { key: 'suspension_tyres', x: 222, y: 254, lx: 120, ly: 332 },
];

const MOTO_BLUEPRINT_NODES = [
  { key: 'cooling_lubrication', x: 505, y: 204, lx: 660, ly: 175 },
  { key: 'electrical', x: 518, y: 120, lx: 650, ly: 74 },
  { key: 'brakes', x: 575, y: 255, lx: 675, ly: 324 },
  { key: 'engine', x: 416, y: 224, lx: 432, ly: 334 },
  { key: 'fuel_system', x: 424, y: 146, lx: 365, ly: 58 },
  { key: 'transmission', x: 325, y: 242, lx: 242, ly: 332 },
  { key: 'suspension_tyres', x: 228, y: 252, lx: 112, ly: 205 },
];

/**
 * Full architectural CAD orthographic wireframe overlay with internal powertrain
 * pathways and status-aware subsystem callout pins.
 */
export function ChassisDiagnosticOverlay({
  vehicleType = 'car',
  activeSubsystem = null,
  subsystemStatuses = {},
  onSelectSubsystem,
  showGrid = true,
  showLabels = true,
  compact = false,
  className = '',
}) {
  const isMoto = vehicleType === 'motorcycle';
  const nodes = isMoto ? MOTO_BLUEPRINT_NODES : CAR_BLUEPRINT_NODES;
  const interactive = typeof onSelectSubsystem === 'function';

  return (
    <div
      className={twMerge(
        'relative w-full overflow-hidden rounded-md border border-white/[0.08] bg-[#07090C]',
        className
      )}
    >
      <svg
        viewBox="0 0 800 380"
        className="w-full h-auto block"
        role="img"
        aria-label={`${isMoto ? 'Motorcycle' : 'Fastback Coupe'} CAD diagnostic schematic`}
      >
        <title>NEXUS Orthographic Diagnostic Blueprint</title>
        <defs>
          <pattern id="nexus-cad-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(232, 237, 243, 0.045)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {showGrid ? <rect x="0" y="0" width="800" height="380" fill="url(#nexus-cad-grid)" /> : null}

        {/* Ground Datum & Wheelbase Dimension Line */}
        <line x1="76" y1="298" x2="724" y2="298" stroke="#1F2A38" strokeWidth="1.2" />
        <line
          x1={isMoto ? 228 : 222}
          y1="308"
          x2={isMoto ? 575 : 565}
          y2="308"
          stroke="#00D9FF"
          strokeOpacity="0.4"
          strokeDasharray="4 3"
        />
        {!compact ? (
          <text
            x="400"
            y="323"
            textAnchor="middle"
            fill="#5E6B7D"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="1.6"
          >
            {isMoto ? 'WHEELBASE // 1465 MM · TRELLIS CHASSIS' : 'WHEELBASE // 2720 MM · FASTBACK MONOCOQUE'}
          </text>
        ) : null}

        {/* Precision Orthographic Vehicle Blueprint */}
        {isMoto ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Rear & Front Wheels + Drilled Rotors */}
            <circle cx="228" cy="252" r="46" stroke="#8B96A5" strokeWidth="2" />
            <circle cx="228" cy="252" r="32" stroke="#00D9FF" strokeOpacity="0.65" strokeWidth="1.4" />
            <circle cx="228" cy="252" r="18" stroke="#8B96A5" strokeDasharray="3 2" strokeWidth="1.1" />
            <circle cx="575" cy="255" r="44" stroke="#8B96A5" strokeWidth="2" />
            <circle cx="575" cy="255" r="30" stroke="#00D9FF" strokeOpacity="0.65" strokeWidth="1.4" />
            <circle cx="575" cy="255" r="22" stroke="#00D9FF" strokeDasharray="2 3" strokeWidth="1.2" />

            {/* Fairing, Tank, Tail Silhouette */}
            <path
              d="M598 182 C580 144, 540 120, 502 108 L480 142 C455 124, 410 124, 376 146 L354 176 C318 176, 260 156, 206 130 L196 142 C240 170, 290 192, 344 198 L368 258 L468 258 C492 232, 536 212, 598 182 Z"
              stroke="#E8EDF3"
              strokeOpacity="0.82"
              strokeWidth="1.6"
              fill="rgba(0, 217, 255, 0.03)"
            />
            {/* Windscreen */}
            <path d="M565 144 Q534 102 496 90 L490 105" stroke="#00D9FF" strokeWidth="1.4" />
            {/* Trellis Frame + Inverted Forks + Swingarm */}
            <path
              d="M506 150 L446 164 L366 214 L388 238 L466 202 Z"
              stroke="#00D9FF"
              strokeOpacity="0.7"
              strokeWidth="1.3"
            />
            <line x1="506" y1="145" x2="575" y2="255" stroke="#E8EDF3" strokeWidth="2.4" />
            <line x1="366" y1="220" x2="228" y2="252" stroke="#8B96A5" strokeWidth="2.4" />
            {/* Swept Exhaust Line */}
            <path d="M446 216 Q440 264 388 268 L286 244" stroke="#8B96A5" strokeDasharray="4 2" strokeWidth="1.5" />
          </g>
        ) : (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Outer Fastback GT Silhouette */}
            <path
              d="M118 258 L108 214 C112 184, 148 172, 204 166 C268 134, 336 106, 412 106 C474 106, 518 134, 558 166 C616 174, 658 192, 682 216 L686 248 L658 262 L614 262 A49 49 0 0 0 516 262 L272 262 A50 50 0 0 0 172 262 Z"
              stroke="#E8EDF3"
              strokeOpacity="0.86"
              strokeWidth="1.6"
              fill="rgba(0, 217, 255, 0.03)"
            />
            {/* Tinted Greenhouse Window Contour */}
            <path
              d="M276 164 C324 134, 376 118, 424 118 C468 118, 504 138, 536 164 Z"
              stroke="#00D9FF"
              strokeOpacity="0.78"
              strokeWidth="1.4"
              fill="rgba(0, 217, 255, 0.06)"
            />
            {/* Side Aero Shoulder Character Line */}
            <path d="M148 202 Q380 186 646 206" stroke="#00D9FF" strokeOpacity="0.45" strokeWidth="1.1" />
            {/* Internal Cutaway Powertrain Spine */}
            <path
              d="M242 192 L292 228 L496 228 L536 196"
              stroke="#8B96A5"
              strokeOpacity="0.55"
              strokeDasharray="4 3"
              strokeWidth="1.2"
            />
            {/* Rear & Front Spoked Alloy Wheels + Drilled Rotors */}
            {[222, 565].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="254" r="44" stroke="#8B96A5" strokeWidth="2" />
                <circle cx={cx} cy="254" r="30" stroke="#00D9FF" strokeOpacity="0.68" strokeWidth="1.4" />
                <circle cx={cx} cy="254" r="20" stroke="#00D9FF" strokeDasharray="2 3" strokeWidth="1.1" />
                <circle cx={cx} cy="254" r="5" stroke="#E8EDF3" strokeWidth="1.2" />
              </g>
            ))}
          </g>
        )}

        {/* Subsystem Diagnostic Callout Pins */}
        {nodes.map((node) => {
          const meta = SUBSYSTEM_METADATA[node.key];
          const status = subsystemStatuses?.[node.key]?.status || subsystemStatuses?.[node.key] || 'Not Assessed';
          const accent = resolveAccent(status);
          const isActive = activeSubsystem === node.key;
          const isFlagged = status === 'Critical' || status === 'Warning';
          const midX = (node.x + node.lx) / 2;

          return (
            <g
              key={node.key}
              onClick={interactive ? () => onSelectSubsystem(node.key) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSubsystem(node.key);
                      }
                    }
                  : undefined
              }
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `${meta.label} (${meta.code}) — ${status}` : undefined}
              className={interactive ? 'cursor-pointer focus:outline-none' : undefined}
            >
              <polyline
                points={`${node.x},${node.y} ${midX},${node.ly} ${node.lx},${node.ly}`}
                fill="none"
                stroke={accent}
                strokeWidth={isActive ? 1.8 : 1.1}
                strokeOpacity={isActive || isFlagged ? 0.95 : 0.45}
                strokeDasharray={isActive ? undefined : '3 3'}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 9 : 6}
                fill={accent}
                fillOpacity={0.22}
                stroke={accent}
                strokeWidth={1.5}
              />
              <circle cx={node.x} cy={node.y} r="2.6" fill={accent} />

              {showLabels ? (
                <g transform={`translate(${node.lx}, ${node.ly})`}>
                  <rect
                    x="-54"
                    y="-14"
                    width="108"
                    height="28"
                    rx="3"
                    fill={isActive ? '#0C1722' : '#0B0F15'}
                    fillOpacity="0.92"
                    stroke={accent}
                    strokeWidth={isActive ? 1.5 : 0.9}
                    strokeOpacity={isActive || isFlagged ? 0.95 : 0.45}
                  />
                  <text
                    x="0"
                    y="-2"
                    textAnchor="middle"
                    fill={accent}
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    letterSpacing="0.9"
                  >
                    {meta.code}
                  </text>
                  <text
                    x="0"
                    y="9"
                    textAnchor="middle"
                    fill="#E8EDF3"
                    fontSize="9.5"
                    fontFamily="Inter, sans-serif"
                  >
                    {compact ? meta.short : meta.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ChassisDiagnosticOverlay;
