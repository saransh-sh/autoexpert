import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair, Lock, RotateCcw, Unlock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import VehicleChassisMesh from './VehicleChassisMesh';
import MotoChassisMesh from './MotoChassisMesh';
import HologramEffects from './HologramEffects';
import WebGLFallback from './WebGLFallback';

export const SUBSYSTEM_HOTSPOTS = [
  { key: 'engine', label: 'Engine Core', code: 'SYS-ENG', position: [0.92, 0.62, 0.08] },
  { key: 'electrical', label: 'Electrical Bus', code: 'SYS-ELC', position: [0.18, 0.72, 0.42] },
  { key: 'transmission', label: 'Drivetrain', code: 'SYS-TRN', position: [-0.52, 0.44, 0.25] },
  { key: 'brakes', label: 'Braking System', code: 'SYS-BRK', position: [1.34, 0.38, 0.92] },
  { key: 'cooling_lubrication', label: 'Thermal & Oil', code: 'SYS-THM', position: [1.82, 0.42, 0.3] },
  { key: 'suspension_tyres', label: 'Chassis & Tyres', code: 'SYS-SUS', position: [-1.34, 0.46, 0.9] },
  { key: 'fuel_system', label: 'Fuel Delivery', code: 'SYS-FUL', position: [-1.02, 0.72, 0.48] },
];

const MOTO_HOTSPOT_POSITIONS = {
  engine: [0.14, 0.48, 0.22],
  electrical: [0.56, 0.92, 0.20],
  transmission: [-0.36, 0.38, 0.20],
  brakes: [0.90, 0.32, 0.20],
  cooling_lubrication: [0.50, 0.54, 0.20],
  suspension_tyres: [-0.86, 0.36, 0.22],
  fuel_system: [0.22, 0.92, 0.20],
};

const STATUS_VISUALS = {
  Critical: {
    color: '#FF3B5C',
    ringClass: 'border-[#FF3B5C] bg-[#290D16]/90 text-[#FF6B84]',
    dotClass: 'bg-[#FF3B5C]',
  },
  Warning: {
    color: '#F59E0B',
    ringClass: 'border-[#F59E0B] bg-[#261B08]/90 text-[#FBBF24]',
    dotClass: 'bg-[#F59E0B]',
  },
  'Attention Required': {
    color: '#00D9FF',
    ringClass: 'border-[#00D9FF] bg-[#08242E]/90 text-[#67E8F9]',
    dotClass: 'bg-[#00D9FF]',
  },
  Healthy: {
    color: '#C7FF4A',
    ringClass: 'border-[#C7FF4A] bg-[#17240A]/90 text-[#C7FF4A]',
    dotClass: 'bg-[#C7FF4A]',
  },
  'Not Assessed': {
    color: '#00D9FF',
    ringClass: 'border-[#00D9FF]/55 bg-[#0B1018]/90 text-[#8B96A5]',
    dotClass: 'bg-[#00D9FF]',
  },
};

function resolveStatus(subsystemStatuses, key) {
  const entry = subsystemStatuses?.[key];
  const raw = typeof entry === 'string' ? entry : entry?.status;
  return raw && STATUS_VISUALS[raw] ? raw : 'Not Assessed';
}

function getCameraPreset(vehicleType, isMobile) {
  if (vehicleType === 'motorcycle') {
    return isMobile ? [2.95, 1.42, 3.45] : [2.42, 1.18, 2.88];
  }
  return isMobile ? [4.25, 1.88, 4.85] : [3.48, 1.52, 4.05];
}

/**
 * Clickable 3D subsystem beacon + bounded HTML reticle pill.
 */
function HotspotNode({
  hotspot,
  position,
  status,
  isActive,
  isHovered,
  reducedMotion,
  onHover,
  onSelect,
}) {
  const haloRef = useRef(null);
  const visual = STATUS_VISUALS[status] || STATUS_VISUALS['Not Assessed'];
  const isFlagged = status === 'Critical' || status === 'Warning';
  const showLabel = isActive || isHovered || isFlagged;

  useFrame((state) => {
    if (!haloRef.current) return;
    if (reducedMotion) {
      haloRef.current.scale.setScalar(isActive ? 1.25 : 1);
      return;
    }
    const pulseSpeed = status === 'Critical' ? 4.2 : 2.4;
    const wave = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * (isActive || isFlagged ? 0.22 : 0.1);
    haloRef.current.scale.setScalar(wave);
  });

  return (
    <group position={position}>
      {/* Glowing 3D Anchor Core */}
      <mesh>
        <sphereGeometry args={[isActive ? 0.044 : 0.032, 14, 14]} />
        <meshBasicMaterial color={visual.color} />
      </mesh>
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.048, 0.072, 24]} />
        <meshBasicMaterial
          color={visual.color}
          transparent
          opacity={isActive || isFlagged ? 0.85 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive Bounded HUD Reticle */}
      <Html center zIndexRange={[10, 0]}>
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(hotspot.key);
            }}
            onMouseEnter={() => onHover(hotspot.key)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(hotspot.key)}
            onBlur={() => onHover(null)}
            aria-label={`${hotspot.label} (${hotspot.code}) — Status: ${status}`}
            aria-pressed={isActive}
            className={`group flex items-center justify-center rounded-full border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] ${
              isActive
                ? 'h-6 w-6 scale-110 shadow-[0_0_12px_rgba(0,217,255,0.5)]'
                : 'h-5 w-5 hover:scale-110'
            } ${visual.ringClass}`}
          >
            {isFlagged && !reducedMotion ? (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-55 ${visual.dotClass}`}
              />
            ) : null}
            <span className={`relative h-2 w-2 rounded-full ${visual.dotClass}`} />
          </button>

          {showLabel ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hotspot.key);
              }}
              className={`ml-2 whitespace-nowrap rounded border px-2 py-0.5 text-left backdrop-blur-md transition-colors ${visual.ringClass}`}
            >
              <span className="block font-mono text-[9.5px] font-semibold uppercase tracking-wider leading-tight">
                {hotspot.code}
                {isFlagged ? ` · ${status.toUpperCase()}` : ''}
              </span>
              <span className="block text-[11px] font-medium text-[#E8EDF3] leading-tight">
                {hotspot.label}
              </span>
            </button>
          ) : null}
        </div>
      </Html>
    </group>
  );
}

/**
 * Synchronizes camera framing when vehicleType or resetTrigger changes.
 */
function CameraRigController({ vehicleType, isMobile, resetTrigger, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    const [x, y, z] = getCameraPreset(vehicleType, isMobile);
    camera.position.set(x, y, z);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, vehicleType === 'motorcycle' ? 0.56 : 0.52, 0);
      controlsRef.current.update();
    }
  }, [vehicleType, isMobile, resetTrigger, camera, controlsRef]);

  return null;
}

/**
 * Vehicle rig applying subtle pointer parallax without competing with OrbitControls.
 */
function VehicleRig({
  vehicleType,
  activeSubsystem,
  onSelectSubsystem,
  subsystemStatuses,
  hoveredKey,
  onHover,
  hotspots,
  pointerRef,
  reducedMotion,
}) {
  const rigRef = useRef(null);

  useFrame((_, delta) => {
    if (!rigRef.current) return;
    const dt = Math.min(delta, 0.05);
    const targetRotY = reducedMotion ? 0 : pointerRef.current.x * 0.095;
    const targetRotX = reducedMotion ? 0 : -pointerRef.current.y * 0.035;

    rigRef.current.rotation.y = THREE.MathUtils.lerp(
      rigRef.current.rotation.y,
      targetRotY,
      dt * 3.5
    );
    rigRef.current.rotation.x = THREE.MathUtils.lerp(
      rigRef.current.rotation.x,
      targetRotX,
      dt * 3.5
    );
  });

  return (
    <group ref={rigRef}>
      {vehicleType === 'motorcycle' ? (
        <MotoChassisMesh
          activeSubsystem={activeSubsystem}
          subsystemStatuses={subsystemStatuses}
          reducedMotion={reducedMotion}
        />
      ) : (
        <VehicleChassisMesh
          activeSubsystem={activeSubsystem}
          subsystemStatuses={subsystemStatuses}
          reducedMotion={reducedMotion}
        />
      )}

      {hotspots.map((spot) => (
        <HotspotNode
          key={spot.key}
          hotspot={spot}
          position={spot.resolvedPosition}
          status={resolveStatus(subsystemStatuses, spot.key)}
          isActive={activeSubsystem === spot.key}
          isHovered={hoveredKey === spot.key}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelectSubsystem}
        />
      ))}
    </group>
  );
}

export default function VehicleHologramCanvas({
  vehicleType = 'car',
  activeSubsystem = null,
  onSelectSubsystem = () => {},
  subsystemStatuses = {},
  scannerActive = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sizeQuery = window.matchMedia('(max-width: 767px)');

    const onMotionChange = (e) => setReducedMotion(e.matches);
    const onSizeChange = (e) => setIsMobile(e.matches);

    setReducedMotion(motionQuery.matches);
    setIsMobile(sizeQuery.matches);

    motionQuery.addEventListener?.('change', onMotionChange);
    sizeQuery.addEventListener?.('change', onSizeChange);

    return () => {
      motionQuery.removeEventListener?.('change', onMotionChange);
      sizeQuery.removeEventListener?.('change', onSizeChange);
    };
  }, []);

  const resolvedHotspots = useMemo(() => {
    const isMoto = vehicleType === 'motorcycle';
    return SUBSYSTEM_HOTSPOTS.map((spot) => ({
      ...spot,
      resolvedPosition: isMoto ? MOTO_HOTSPOT_POSITIONS[spot.key] || spot.position : spot.position,
    }));
  }, [vehicleType]);

  const handlePointerMove = useCallback(
    (e) => {
      if (reducedMotion || isOrbiting || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    },
    [reducedMotion, isOrbiting]
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  }, []);

  const initialCamera = getCameraPreset(vehicleType, isMobile);
  const activeSpot = resolvedHotspots.find((h) => h.key === activeSubsystem);
  const activeStatus = activeSpot ? resolveStatus(subsystemStatuses, activeSpot.key) : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className={twMerge(
        'relative w-full h-full min-h-[340px] isolate overflow-hidden rounded-lg border border-white/[0.08] bg-[#07090C]',
        className
      )}
    >
      {/* Subtle Studio Radial Glow Behind Canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_58%_at_50%_54%,rgba(0,217,255,0.09)_0%,rgba(7,9,12,0)_72%)]"
      />

      <WebGLFallback
        vehicleType={vehicleType}
        activeSubsystem={activeSubsystem}
        onSelectSubsystem={onSelectSubsystem}
        subsystemStatuses={subsystemStatuses}
        hotspots={SUBSYSTEM_HOTSPOTS}
        contextLost={contextLost}
        className="border-0 rounded-none"
      >
        <Canvas
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          camera={{
            position: initialCamera,
            fov: isMobile ? 42 : 35,
            near: 0.1,
            far: 45,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (event) => {
              event.preventDefault();
              setContextLost(true);
            };
            const onRestored = () => {
              setContextLost(false);
            };
            canvas.addEventListener('webglcontextlost', onLost, false);
            canvas.addEventListener('webglcontextrestored', onRestored, false);
          }}
          className="h-full w-full block"
        >
          <HologramEffects
            vehicleType={vehicleType}
            scannerActive={scannerActive}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
          />

          <VehicleRig
            vehicleType={vehicleType}
            activeSubsystem={activeSubsystem}
            onSelectSubsystem={onSelectSubsystem}
            subsystemStatuses={subsystemStatuses}
            hoveredKey={hoveredKey}
            onHover={setHoveredKey}
            hotspots={resolvedHotspots}
            pointerRef={pointerRef}
            reducedMotion={reducedMotion}
          />

          <OrbitControls
            ref={controlsRef}
            target={[0, vehicleType === 'motorcycle' ? 0.56 : 0.52, 0]}
            enableZoom={zoomEnabled}
            enablePan={false}
            enableDamping
            dampingFactor={0.055}
            minPolarAngle={Math.PI * 0.16}
            maxPolarAngle={Math.PI * 0.48}
            minDistance={vehicleType === 'motorcycle' ? 2.0 : 2.8}
            maxDistance={vehicleType === 'motorcycle' ? 5.6 : 7.6}
            autoRotate={!reducedMotion && !activeSubsystem && !isOrbiting}
            autoRotateSpeed={0.42}
            onStart={() => setIsOrbiting(true)}
            onEnd={() => setIsOrbiting(false)}
          />

          <CameraRigController
            vehicleType={vehicleType}
            isMobile={isMobile}
            resetTrigger={resetTrigger}
            controlsRef={controlsRef}
          />
        </Canvas>
      </WebGLFallback>

      {/* Top HUD Telemetry Controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded border border-white/[0.1] bg-[#07090C]/80 px-2.5 py-1 backdrop-blur-md">
          <Crosshair
            className={`h-3.5 w-3.5 ${scannerActive ? 'text-[#00D9FF]' : 'text-[#5E6B7D]'}`}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8EDF3]">
            {vehicleType === 'motorcycle' ? 'SUPERBIKE TELEMETRY' : 'FASTBACK GT TELEMETRY'}
          </span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
            {scannerActive && !reducedMotion ? 'LIDAR ACTIVE' : 'STATIC FRAME'}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomEnabled((prev) => !prev)}
            aria-pressed={zoomEnabled}
            title={
              zoomEnabled
                ? 'Scroll zoom unlocked (click to lock so page scrolling stays smooth)'
                : 'Scroll zoom locked (click to enable mouse wheel zoom)'
            }
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-md transition-colors nexus-focus ${
              zoomEnabled
                ? 'border-[#00D9FF]/50 bg-[#08242E]/90 text-[#67E8F9]'
                : 'border-white/[0.1] bg-[#07090C]/80 text-[#8B96A5] hover:border-white/[0.2] hover:text-[#E8EDF3]'
            }`}
          >
            {zoomEnabled ? (
              <Unlock className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Lock className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{zoomEnabled ? 'Zoom: On' : 'Zoom: Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setResetTrigger((n) => n + 1)}
            title="Reset 3D camera angle"
            aria-label="Reset 3D camera angle"
            className="inline-flex items-center justify-center rounded border border-white/[0.1] bg-[#07090C]/80 p-1.5 text-[#8B96A5] backdrop-blur-md transition-colors hover:border-[#00D9FF]/45 hover:text-[#00D9FF] nexus-focus"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom HUD Hint / Selected Subsystem Readout */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-2 p-3 sm:p-4">
        <div className="rounded border border-white/[0.08] bg-[#07090C]/75 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5] backdrop-blur-sm">
          Drag to orbit · Click subsystem node to inspect
        </div>

        {activeSpot ? (
          <div className="rounded border border-[#00D9FF]/35 bg-[#08151E]/90 px-3 py-1.5 font-mono text-[10.5px] text-[#E8EDF3] backdrop-blur-md">
            <span className="text-[#00D9FF]">{activeSpot.code}</span>
            <span className="mx-1.5 text-white/25">/</span>
            <span>{activeSpot.label}</span>
            <span className="mx-1.5 text-white/25">/</span>
            <span className="text-[#C7FF4A]">{activeStatus}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
