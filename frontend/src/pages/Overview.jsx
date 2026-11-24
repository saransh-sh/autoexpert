import React, { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Cpu,
  FileText,
  GitBranch,
  Layers,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import FloatingPathsBackground from '../components/FloatingPathsBackground';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const VehicleHologramCanvas = lazy(() =>
  import('../components/three/VehicleHologramCanvas')
);

const KM_TO_MI = 0.621371;

const SUBSYSTEM_ORDER = [
  'engine',
  'electrical',
  'transmission',
  'brakes',
  'cooling_lubrication',
  'suspension_tyres',
  'fuel_system',
];

const SUBSYSTEM_META = {
  engine: {
    label: 'Engine Core',
    code: 'SYS-ENG',
    scope: 'Compression, idle stability, timing, vibration & internal mounts',
  },
  electrical: {
    label: 'Electrical Bus',
    code: 'SYS-ELC',
    scope: 'Battery voltage, stator/alternator output, starter & ignition',
  },
  transmission: {
    label: 'Drivetrain',
    code: 'SYS-TRN',
    scope: 'Clutch engagement, gear selection, chain/belt & driveline slip',
  },
  brakes: {
    label: 'Braking System',
    code: 'SYS-BRK',
    scope: 'Pad thickness, rotor pulsation, hydraulic line & ABS safety',
  },
  cooling_lubrication: {
    label: 'Thermal & Oil',
    code: 'SYS-THM',
    scope: 'Coolant circulation, radiator fan, oil pressure & thermal limits',
  },
  suspension_tyres: {
    label: 'Chassis & Tyres',
    code: 'SYS-SUS',
    scope: 'Tyre tread depth, steering play, fork seals & chassis balance',
  },
  fuel_system: {
    label: 'Fuel Delivery',
    code: 'SYS-FUL',
    scope: 'Fuel rail pressure, injector/carb mixture & vapor leak checks',
  },
};

const ARCHITECTURE_PILLARS = [
  {
    code: '01 // FORWARD CHAINING',
    title: 'Multi-Pass Fixed-Point & 5-Tier Conflict Resolution',
    summary:
      'Evaluates applicable vehicle rules across up to 50 passes, resolving competing candidates strictly by Refraction, Safety Criticality, Condition Specificity, Priority, and Rule ID.',
    icon: Layers,
  },
  {
    code: '02 // BACKWARD CHAINING',
    title: 'Goal Verification & Call-Stack Cycle Prevention',
    summary:
      'Traces candidate rules backwards from a target fault_id, prevents cyclic loops via visited-goal tracking, and suppresses irrelevant queries (such as coolant checks on air-cooled bikes).',
    icon: GitBranch,
  },
  {
    code: '03 // 3-VALUED WORKING MEMORY',
    title: 'UNKNOWN Never Coerced to False',
    summary:
      'Every working memory entry retains TRUE, FALSE, or UNKNOWN along with source provenance (initial_fact, symptom, observation, measurement, derived) and full mutation logs.',
    icon: Cpu,
  },
];

function detectWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function formatDistance(kmValue, distanceUnit) {
  const km = Number(kmValue || 0);
  if (distanceUnit === 'mi') {
    return `${Math.round(km * KM_TO_MI).toLocaleString()} mi`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

function getStatusBadgeProps(status) {
  switch (status) {
    case 'Healthy':
      return { variant: 'healthy', label: 'Healthy', dot: true, pulse: false };
    case 'Attention Required':
      return { variant: 'attention', label: 'Attention Required', dot: true, pulse: false };
    case 'Warning':
      return { variant: 'warning', label: 'Warning', dot: true, pulse: false };
    case 'Critical':
      return { variant: 'critical', label: 'Critical', dot: true, pulse: true };
    default:
      return { variant: 'unassessed', label: 'Not Assessed', dot: false, pulse: false };
  }
}

function getReportBadgeProps(report) {
  if (report?.safety_warning_triggered || report?.highest_severity === 'critical') {
    return { variant: 'critical', label: 'Critical', dot: true, pulse: true };
  }
  if (report?.highest_severity === 'high') {
    return { variant: 'warning', label: 'Warning', dot: true, pulse: false };
  }
  if (report?.highest_severity === 'medium') {
    return { variant: 'attention', label: 'Attention Required', dot: true, pulse: false };
  }
  if (report?.highest_severity === 'low' && (report?.conclusions?.length || 0) === 0) {
    return { variant: 'healthy', label: 'Clear', dot: true, pulse: false };
  }
  return { variant: 'attention', label: 'Low', dot: false, pulse: false };
}

class HologramErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('3D hologram stage fell back to studio render:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function HologramStudioFallback({
  vehicleType = 'car',
  activeSubsystem = null,
  onSelectSubsystem,
  subsystemStatuses = {},
  isLoading = false,
}) {
  const imageSrc =
    vehicleType === 'motorcycle'
      ? '/assets/moto-telemetry-silhouette.jpg'
      : '/assets/hero-concept-chassis.jpg';

  return (
    <div className="relative h-[380px] sm:h-[460px] lg:h-[540px] w-full overflow-hidden bg-[#07090C]">
      <img
        src={imageSrc}
        alt={
          vehicleType === 'motorcycle'
            ? 'NEXUS AutoExpert sport motorcycle telemetry silhouette'
            : 'NEXUS AutoExpert concept vehicle chassis telemetry view'
        }
        className="h-full w-full object-cover object-center opacity-75"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/35 to-[#07090C]/45" />
      <div className="absolute inset-0 nexus-grid-bg opacity-35" aria-hidden="true" />

      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
        <TelemetryBadge variant="cyan" dot pulse={isLoading}>
          {isLoading ? 'LOADING 3D TELEMETRY' : 'STUDIO CHASSIS VIEW'}
        </TelemetryBadge>
        <span className="rounded border border-white/[0.1] bg-[#07090C]/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
          {vehicleType === 'motorcycle' ? 'PLATFORM: MOTO' : 'PLATFORM: CAR'}
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-1.5">
        {SUBSYSTEM_ORDER.map((key) => {
          const meta = SUBSYSTEM_META[key];
          const status = subsystemStatuses[key]?.status || 'Not Assessed';
          const isActive = activeSubsystem === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectSubsystem?.(key)}
              className={`rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors nexus-focus ${
                isActive
                  ? 'border-[#00D9FF] bg-[#00D9FF]/20 text-[#E8EDF3]'
                  : status === 'Critical'
                    ? 'border-[#FF3B5C]/50 bg-[#190B10]/90 text-[#FF8FA3] hover:border-[#FF3B5C]'
                    : 'border-white/[0.12] bg-[#07090C]/85 text-[#8B96A5] hover:border-white/[0.28] hover:text-[#E8EDF3]'
              }`}
            >
              {meta.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded border border-[#00D9FF]/35 bg-[#10151D] px-3 py-2 shadow-nexus-elevated">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00D9FF]">
        {item.name}
      </div>
      <div className="mt-0.5 font-mono text-xs text-[#E8EDF3]">
        {item.count} {item.count === 1 ? 'rule' : 'rules'}
      </div>
    </div>
  );
}

export default function Overview() {
  const shouldReduceMotion = useReducedMotion();
  const architectureRef = useRef(null);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [activeVehicleType, setActiveVehicleType] = useState('car');
  const [activeSubsystem, setActiveSubsystem] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [ruleStats, setRuleStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const webglSupported = useMemo(() => detectWebGLSupport(), []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setApiError(null);

      const [vehiclesRes, reportsRes, statsRes, settingsRes] = await Promise.allSettled([
        api.getVehicles(),
        api.getReports({ limit: 100 }),
        api.getRuleStats(),
        api.getSettings(),
      ]);

      if (!active) return;

      if (vehiclesRes.status === 'fulfilled' && Array.isArray(vehiclesRes.value)) {
        const vList = vehiclesRes.value;
        setVehicles(vList);
        if (vList.length > 0) {
          const initialVehicle = vList[0];
          setSelectedVehicleId(initialVehicle.id);
          setActiveVehicleType(
            initialVehicle.vehicle_type === 'motorcycle' ? 'motorcycle' : 'car'
          );
        }
      } else {
        setApiError('Telemetry backend unreachable. Start FastAPI on port 8000 to load live fleet records.');
      }

      if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
        setReports(reportsRes.value);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setRuleStats(statsRes.value);
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setSettings(settingsRes.value);
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setHealthData(null);
      return undefined;
    }

    let active = true;
    setHealthLoading(true);

    api
      .getVehicleHealth(selectedVehicleId)
      .then((data) => {
        if (active) setHealthData(data);
      })
      .catch((err) => {
        console.error('Failed to load vehicle health:', err);
        if (active) setHealthData(null);
      })
      .finally(() => {
        if (active) setHealthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedVehicleId]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const handleVehicleSelectionChange = (event) => {
    const nextId = Number(event.target.value);
    setSelectedVehicleId(nextId);
    const matched = vehicles.find((v) => v.id === nextId);
    if (matched) {
      setActiveVehicleType(matched.vehicle_type === 'motorcycle' ? 'motorcycle' : 'car');
    }
  };

  const handleHotspotSelect = (subsystemKey) => {
    setActiveSubsystem(subsystemKey);
  };

  const scrollToArchitecture = () => {
    architectureRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const distanceUnit = settings?.distance_unit || 'km';
  const activeSubsystemMeta = activeSubsystem ? SUBSYSTEM_META[activeSubsystem] : null;
  const activeSubsystemInfo =
    activeSubsystem && healthData?.subsystems ? healthData.subsystems[activeSubsystem] : null;
  const activeSubsystemBadge = getStatusBadgeProps(activeSubsystemInfo?.status);

  const chartData = useMemo(() => {
    if (!ruleStats?.by_category) return [];
    return Object.entries(ruleStats.by_category)
      .map(([key, count]) => ({
        key,
        name: key.replace(/_/g, ' ').toUpperCase(),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [ruleStats]);

  const subsystemEntries = useMemo(() => {
    const map = healthData?.subsystems || {};
    return SUBSYSTEM_ORDER.map((key) => ({
      key,
      meta: SUBSYSTEM_META[key],
      info: map[key] || {
        status: 'Not Assessed',
        last_assessed: null,
        severity: null,
        conclusions_count: 0,
        evidence_score: 0,
      },
    }));
  }, [healthData]);

  return (
    <PageTransition className="w-full min-w-0 bg-[#07090C]">
      {/* BAND 1: CINEMATIC HERO & INTERACTIVE 3D HOLOGRAM CENTERPIECE */}
      <FloatingPathsBackground
        variant="cyan"
        intensity="medium"
        interactive
        className="border-b border-white/[0.08] bg-[#07090C]"
      >
        <div className="pointer-events-none absolute inset-0 nexus-grid-bg opacity-45" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-nexus-radial" aria-hidden="true" />

        <section
          aria-label="NEXUS AutoExpert Hero"
          className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1400px] flex-col justify-between px-4 pt-7 pb-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12"
        >
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 my-auto">
            {/* Left Editorial Column (Strict 4-element Hero Stack) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5 lg:col-span-5 min-w-0"
            >
              <TelemetryBadge variant="cyan" dot pulse={!shouldReduceMotion}>
                SYMBOLIC VEHICLE INTELLIGENCE
              </TelemetryBadge>

              <h1 className="font-display text-3xl font-bold tracking-tight leading-[1.08] text-[#E8EDF3] sm:text-4xl xl:text-[2.35rem]">
                UNDERSTAND YOUR MACHINE.
                <span className="mt-1 block text-[#00D9FF]">BEYOND THE DRIVE.</span>
              </h1>

              <p className="max-w-[52ch] text-sm leading-relaxed text-[#8B96A5] sm:text-base">
                Deterministic rule-based diagnostics across 55 expert car and motorcycle rules,
                forward and backward chaining, 3-valued logic working memory, and fully
                inspectable reasoning traces.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <HudButton
                  variant="primary"
                  size="lg"
                  iconRight={ArrowDown}
                  onClick={scrollToArchitecture}
                >
                  Explore AutoExpert
                </HudButton>
                <HudButton to="/diagnose" variant="outline" size="lg" icon={Stethoscope}>
                  Run Vehicle Analysis
                </HudButton>
              </div>
            </motion.div>

            {/* Right Interactive 3D Centerpiece */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 min-w-0"
            >
              <div className="overflow-hidden rounded-lg border border-white/[0.1] bg-[#0B0F15]/95 shadow-nexus-elevated">
                {/* Stage Header Bar & Car / Motorcycle Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0E131B] px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-[#00D9FF]" aria-hidden="true" />
                    <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#E8EDF3] truncate">
                      3D Diagnostic Chassis Stage
                    </span>
                    {selectedVehicle ? (
                      <span className="hidden sm:inline font-mono text-[10.5px] text-[#8B96A5] truncate">
                        {selectedVehicle.vehicle_type === activeVehicleType
                          ? `· ${selectedVehicle.year} ${selectedVehicle.manufacturer} ${selectedVehicle.model}`
                          : `· Preview Mode (Fleet: ${selectedVehicle.year} ${selectedVehicle.manufacturer} ${selectedVehicle.model})`}
                      </span>
                    ) : null}
                  </div>

                  <div
                    role="group"
                    aria-label="Vehicle hologram platform"
                    className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#07090C] p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveVehicleType('car')}
                      aria-pressed={activeVehicleType === 'car'}
                      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-none nexus-focus ${
                        activeVehicleType === 'car'
                          ? 'bg-[#00D9FF] font-semibold text-[#07090C]'
                          : 'bg-[#10151D] text-[#C2CBD6] hover:bg-[#1B2430] hover:text-[#E8EDF3]'
                      }`}
                    >
                      <Car className="h-3.5 w-3.5 shrink-0 text-current" aria-hidden="true" />
                      <span className="text-current">Car</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVehicleType('motorcycle')}
                      aria-pressed={activeVehicleType === 'motorcycle'}
                      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-none nexus-focus ${
                        activeVehicleType === 'motorcycle'
                          ? 'bg-[#00D9FF] font-semibold text-[#07090C]'
                          : 'bg-[#10151D] text-[#C2CBD6] hover:bg-[#1B2430] hover:text-[#E8EDF3]'
                      }`}
                    >
                      <Bike className="h-3.5 w-3.5 shrink-0 text-current" aria-hidden="true" />
                      <span className="text-current">Motorcycle</span>
                    </button>
                  </div>
                </div>

                {/* Lazy 3D Viewport + ErrorBoundary + Studio Fallback */}
                <div className="relative bg-[#07090C]">
                  <HologramErrorBoundary
                    fallback={
                      <HologramStudioFallback
                        vehicleType={activeVehicleType}
                        activeSubsystem={activeSubsystem}
                        onSelectSubsystem={handleHotspotSelect}
                        subsystemStatuses={healthData?.subsystems || {}}
                      />
                    }
                  >
                    <Suspense
                      fallback={
                        <HologramStudioFallback
                          isLoading
                          vehicleType={activeVehicleType}
                          activeSubsystem={activeSubsystem}
                          onSelectSubsystem={handleHotspotSelect}
                          subsystemStatuses={healthData?.subsystems || {}}
                        />
                      }
                    >
                      <VehicleHologramCanvas
                        vehicleType={activeVehicleType}
                        activeSubsystem={activeSubsystem}
                        onSelectSubsystem={handleHotspotSelect}
                        subsystemStatuses={healthData?.subsystems || {}}
                        scannerActive={true}
                        className="h-[380px] sm:h-[460px] lg:h-[540px]"
                      />
                    </Suspense>
                  </HologramErrorBoundary>
                </div>

                {/* Interactive Hotspot Telemetry Readout */}
                <div className="border-t border-white/[0.08] bg-[#0B1017] p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Subsystem hotspots">
                    {SUBSYSTEM_ORDER.map((key) => {
                      const meta = SUBSYSTEM_META[key];
                      const status = healthData?.subsystems?.[key]?.status || 'Not Assessed';
                      const isActive = activeSubsystem === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleHotspotSelect(key)}
                          aria-pressed={isActive}
                          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition-colors nexus-focus ${
                            isActive
                              ? 'border-[#00D9FF] bg-[#08242E] text-[#67E8F9]'
                              : status === 'Critical'
                                ? 'border-[#FF3B5C]/45 bg-[#290D16]/70 text-[#FF8FA3] hover:border-[#FF3B5C]'
                                : 'border-white/[0.09] bg-[#10151D] text-[#8B96A5] hover:border-white/[0.22] hover:text-[#E8EDF3]'
                          }`}
                        >
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activeSubsystemMeta ? (
                    <div className="flex flex-col gap-3 rounded-md border border-[#00D9FF]/25 bg-[#0E151E] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#00D9FF]">
                            {activeSubsystemMeta.code}
                          </span>
                          <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                            {activeSubsystemMeta.label}
                          </span>
                          <TelemetryBadge
                            variant={activeSubsystemBadge.variant}
                            dot={activeSubsystemBadge.dot}
                            pulse={activeSubsystemBadge.pulse}
                          >
                            {activeSubsystemBadge.label}
                          </TelemetryBadge>
                        </div>
                        <p className="text-xs text-[#8B96A5]">
                          {activeSubsystemMeta.scope}
                          {activeSubsystemInfo && activeSubsystemInfo.status !== 'Not Assessed'
                            ? ` · ${activeSubsystemInfo.evidence_score}% rule match (${activeSubsystemInfo.conclusions_count} fault${activeSubsystemInfo.conclusions_count === 1 ? '' : 's'})`
                            : ''}
                        </p>
                      </div>
                      <HudButton
                        to={`/diagnose?category=${activeSubsystem}`}
                        variant="outline"
                        size="sm"
                        iconRight={ArrowRight}
                        className="shrink-0 self-start sm:self-center"
                      >
                        Diagnose Subsystem
                      </HudButton>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 rounded-md border border-white/[0.07] bg-[#0E131B] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-[#8B96A5]">
                        Click any 3D hotspot marker or subsystem pill above to inspect status and launch a targeted diagnostic interview.
                      </span>
                      <HudButton
                        to="/diagnose?category=engine"
                        variant="ghost"
                        size="sm"
                        iconRight={ArrowRight}
                        className="shrink-0 self-start sm:self-center text-[#00D9FF]"
                      >
                        Diagnose Subsystem
                      </HudButton>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Subtle Technical HUD Telemetry Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 sm:grid-cols-4">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                KB Baseline
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#E8EDF3] truncate">
                v1.0.0 · {ruleStats?.total_rules ?? 55} Rules
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                Inference Modes
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#00D9FF] truncate">
                Forward + Backward
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                3D Viewport
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#E8EDF3] truncate">
                {webglSupported ? 'WebGL Interactive' : 'Studio 2D Fallback'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                Motion Profile
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#C7FF4A] truncate">
                {shouldReduceMotion ? 'Reduced Motion' : 'Telemetry Active'}
              </div>
            </div>
          </div>
        </section>
      </FloatingPathsBackground>

      {/* BAND 2: PRODUCT INTRODUCTION & EXPERT SYSTEM ARCHITECTURE */}
      <section
        id="architecture"
        ref={architectureRef}
        aria-label="Expert System Architecture"
        className="border-b border-white/[0.08] bg-[#07090C] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1400px] space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#E8EDF3] sm:text-3xl">
              Pure Symbolic Reasoning. Zero Black Boxes.
            </h2>
            <p className="text-sm leading-relaxed text-[#8B96A5] sm:text-base">
              Built on the shared <code className="text-[#00D9FF]">autoexpert_engine</code> package,
              AutoExpert turns physical observations and sensor readings into verifiable fault proofs
              and safety halts without probabilistic guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
            {/* Studio Powertrain Visual */}
            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0C1016] min-h-[280px] lg:col-span-5 flex flex-col justify-end">
              <img
                src="/assets/powertrain-cutaway.jpg"
                alt="Automotive powertrain technical cutaway"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/40 to-transparent" />
              <div className="relative z-10 p-6 space-y-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00D9FF]">
                  POWERTRAIN_APPLICABILITY
                </span>
                <h3 className="font-display text-lg font-semibold text-[#E8EDF3]">
                  Context-Aware Across Cars &amp; Motorcycles
                </h3>
                <p className="text-xs leading-relaxed text-[#E8EDF3]/80 max-w-md">
                  Rules declare explicit applicability constraints across vehicle type, cooling
                  architecture (liquid, air, oil), and fuel delivery so inapplicable checks never
                  pollute an interview.
                </p>
              </div>
            </div>

            {/* Three Architectural Pillars */}
            <div className="flex flex-col justify-between gap-6 lg:col-span-7">
              <div className="divide-y divide-white/[0.08] rounded-lg border border-white/[0.08] bg-[#10151D]">
                {ARCHITECTURE_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.code} className="flex items-start gap-4 p-5 sm:p-6">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#00D9FF]/30 bg-[#08242E] text-[#00D9FF]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#00D9FF]">
                          {pillar.code}
                        </div>
                        <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
                          {pillar.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#8B96A5]">{pillar.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <HudButton to="/about" variant="secondary" iconRight={ArrowRight}>
                  System Architecture
                </HudButton>
                <HudButton to="/demo" variant="outline" icon={Cpu}>
                  Run 10-Scenario Benchmark
                </HudButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 3: PRESERVED LIVE TELEMETRY & FLEET OVERVIEW */}
      <section
        id="telemetry-overview"
        aria-label="Fleet Telemetry Overview"
        className="border-b border-white/[0.08] bg-[#0A0E14] py-16 sm:py-20 nexus-dot-bg"
      >
        <div className="mx-auto max-w-[1400px] space-y-10 px-4 sm:px-6 lg:px-8">
          <SectionHeader
            code="SYS_01"
            eyebrow="FLEET TELEMETRY & AUDIT MATRIX"
            title="Operational Fleet Health & Knowledge Coverage"
            description="Live status derived from SQLite fleet records, deterministic diagnostic reports, and the active rule repository."
            actions={
              <>
                <HudButton to="/vehicles" variant="secondary" size="sm" icon={Car}>
                  Manage Fleet
                </HudButton>
                <HudButton to="/diagnose" variant="primary" size="sm" icon={Stethoscope}>
                  New Diagnosis
                </HudButton>
              </>
            }
          />

          {apiError ? (
            <NexusPanel variant="warning" padding="sm">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#FBBF24]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{apiError}</span>
                </div>
                <HudButton to="/about" variant="ghost" size="sm" className="text-[#FBBF24]">
                  View Architecture Spec
                </HudButton>
              </div>
            </NexusPanel>
          ) : null}

          {/* 4 Live KPI Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NexusPanel padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                  Registered Fleet Units
                </span>
                <Car className="h-4 w-4 text-[#00D9FF]" aria-hidden="true" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-[#E8EDF3] tabular-nums">
                {loading ? '—' : vehicles.length}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#8B96A5]">
                Cars &amp; motorcycles tracked
              </div>
            </NexusPanel>

            <NexusPanel padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                  Active KB Rules
                </span>
                <CheckCircle2 className="h-4 w-4 text-[#C7FF4A]" aria-hidden="true" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-[#E8EDF3] tabular-nums">
                {loading && !ruleStats ? '—' : ruleStats?.total_rules ?? 55}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#C7FF4A]">
                Validated IF-THEN rules
              </div>
            </NexusPanel>

            <NexusPanel padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                  Safety-Critical Triggers
                </span>
                <ShieldAlert className="h-4 w-4 text-[#FF3B5C]" aria-hidden="true" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-[#FF3B5C] tabular-nums">
                {loading && !ruleStats ? '—' : ruleStats?.safety_critical_rules ?? 15}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#FF6B84]">
                Priority emergency halts
              </div>
            </NexusPanel>

            <NexusPanel padding="md" className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                  Diagnostic Audits
                </span>
                <FileText className="h-4 w-4 text-[#00D9FF]" aria-hidden="true" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-[#E8EDF3] tabular-nums">
                {loading ? '—' : reports.length}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#8B96A5]">
                Recorded report dossiers
              </div>
            </NexusPanel>
          </div>

          {/* Fleet Vehicle Selector & 7-Subsystem Health Matrix */}
          <NexusPanel
            code="SUBSYSTEM_MATRIX"
            title="7-Subsystem Health Matrix"
            subtitle="Synced with the 3D chassis hotspots. Defaults strictly to Not Assessed until physical evidence is logged."
            headerAction={
              vehicles.length > 0 ? (
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <label
                    htmlFor="overview-vehicle-select"
                    className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Target Unit
                  </label>
                  <select
                    id="overview-vehicle-select"
                    value={selectedVehicleId || ''}
                    onChange={handleVehicleSelectionChange}
                    className="nexus-input w-full max-w-[calc(100vw-5rem)] font-mono text-xs sm:w-auto sm:min-w-[220px] sm:max-w-[320px]"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.manufacturer} {v.model} ({v.vehicle_type})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null
            }
          >
            {selectedVehicle ? (
              <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4 font-mono text-[11px] text-[#8B96A5]">
                <TelemetryBadge variant="cyan">
                  {selectedVehicle.vehicle_type}
                </TelemetryBadge>
                <span className="rounded border border-white/[0.08] bg-[#07090C] px-2.5 py-1 text-[#E8EDF3]">
                  {selectedVehicle.cooling_type?.replace('_', ' ')}
                </span>
                <span className="rounded border border-white/[0.08] bg-[#07090C] px-2.5 py-1 text-[#E8EDF3]">
                  {selectedVehicle.fuel_type}
                </span>
                <span className="rounded border border-white/[0.08] bg-[#07090C] px-2.5 py-1 text-[#E8EDF3]">
                  Odometer: {formatDistance(selectedVehicle.odometer_km, distanceUnit)}
                </span>
              </div>
            ) : null}

            {vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] bg-[#07090C] text-[#8B96A5]">
                  <Car className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold text-[#E8EDF3]">
                    No Fleet Assets Registered
                  </p>
                  <p className="max-w-md text-xs text-[#8B96A5]">
                    Add a car or motorcycle in the Fleet Garage to populate live subsystem telemetry
                    and service reminders.
                  </p>
                </div>
                <HudButton to="/vehicles" variant="primary" size="sm" iconRight={ArrowRight}>
                  Register Vehicle Asset
                </HudButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {subsystemEntries.map(({ key, meta, info }) => {
                  const badge = getStatusBadgeProps(info.status);
                  const isActive = activeSubsystem === key;
                  const isAssessed = info.status !== 'Not Assessed';
                  const score = Number(info.evidence_score || 0);

                  return (
                    <div
                      key={key}
                      className={`flex flex-col justify-between rounded-md border p-4 transition-colors ${
                        isActive
                          ? 'border-[#00D9FF]/60 bg-[#0D1922]'
                          : info.status === 'Critical'
                            ? 'border-[#FF3B5C]/45 bg-[#160B10]'
                            : 'border-white/[0.08] bg-[#0A0E14] hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleHotspotSelect(key)}
                            className="text-left min-w-0 nexus-focus rounded"
                          >
                            <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
                              {meta.code}
                            </span>
                            <span className="block font-display text-sm font-semibold text-[#E8EDF3] hover:text-[#00D9FF] transition-colors">
                              {meta.label}
                            </span>
                          </button>
                          <TelemetryBadge
                            variant={badge.variant}
                            dot={badge.dot}
                            pulse={badge.pulse}
                          >
                            {badge.label}
                          </TelemetryBadge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2.5 font-mono text-[10.5px]">
                          <div>
                            <span className="block text-[#5E6B7D] uppercase">Last Assessed</span>
                            <span className="text-[#E8EDF3]">
                              {healthLoading
                                ? '...'
                                : info.last_assessed
                                  ? info.last_assessed.slice(0, 10)
                                  : 'NEVER'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[#5E6B7D] uppercase">Conclusions</span>
                            <span className="text-[#E8EDF3]">
                              {healthLoading ? '...' : `${info.conclusions_count ?? 0} fault(s)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                        <div className="flex items-center justify-between font-mono text-[10.5px]">
                          <span className="text-[#8B96A5] uppercase">Evidence Score</span>
                          <span className={isAssessed ? 'font-semibold text-[#00D9FF]' : 'text-[#5E6B7D]'}>
                            {isAssessed ? `${score}%` : 'Awaiting Scan'}
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[#1B2430]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              info.status === 'Critical'
                                ? 'bg-[#FF3B5C]'
                                : info.status === 'Warning'
                                  ? 'bg-[#F59E0B]'
                                  : info.status === 'Healthy'
                                    ? 'bg-[#C7FF4A]'
                                    : 'bg-[#00D9FF]'
                            }`}
                            style={{ width: isAssessed ? `${Math.max(8, Math.min(100, score))}%` : '0%' }}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleHotspotSelect(key)}
                            className="font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5] hover:text-[#E8EDF3] nexus-focus rounded"
                          >
                            {isActive ? 'Highlighted on 3D' : 'Focus 3D Node'}
                          </button>
                          <Link
                            to={`/diagnose?category=${key}`}
                            className="inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-wider text-[#00D9FF] hover:text-[#33E1FF] nexus-focus rounded"
                          >
                            <span>Diagnose</span>
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NexusPanel>

          {/* Knowledge Base Distribution BarChart & Recent Diagnostic Reports */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <NexusPanel
              code="KB_COVERAGE"
              title="Rule Distribution by Domain"
              subtitle="Quantitative coverage across all 8 vehicle & maintenance domains"
              className="lg:col-span-6 min-w-0"
            >
              {chartData.length === 0 ? (
                <div className="flex h-64 items-center justify-center font-mono text-xs text-[#8B96A5]">
                  {loading ? 'Loading rule coverage metrics...' : 'Rule metrics unavailable.'}
                </div>
              ) : (
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 8, right: 18, top: 6, bottom: 6 }}
                    >
                      <CartesianGrid
                        stroke="rgba(232, 237, 243, 0.06)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="#8B96A5"
                        tick={{ fill: '#8B96A5', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={122}
                        stroke="#8B96A5"
                        tick={{ fill: '#E8EDF3', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0, 217, 255, 0.06)' }}
                        content={<ChartTooltip />}
                      />
                      <Bar
                        dataKey="count"
                        fill="#00D9FF"
                        background={{ fill: '#1B2430', radius: 4 }}
                        radius={[0, 4, 4, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </NexusPanel>

            <NexusPanel
              code="AUDIT_LOG"
              title="Recent Diagnostic Reports"
              subtitle="Latest recorded diagnostic sessions and safety indicators"
              headerAction={
                <Link
                  to="/reports"
                  className="inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wider text-[#00D9FF] hover:text-[#33E1FF] nexus-focus rounded"
                >
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
              className="lg:col-span-6 min-w-0"
            >
              {reports.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
                  <Activity className="h-8 w-8 text-[#5E6B7D]" aria-hidden="true" />
                  <p className="font-mono text-xs text-[#8B96A5]">
                    {loading
                      ? 'Loading diagnostic dossiers...'
                      : 'No diagnostic reports recorded yet.'}
                  </p>
                  {!loading ? (
                    <HudButton to="/diagnose" variant="outline" size="sm" icon={Stethoscope}>
                      Start First Diagnosis
                    </HudButton>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reports.slice(0, 4).map((rep) => {
                    const repBadge = getReportBadgeProps(rep);
                    return (
                      <Link
                        key={rep.id}
                        to="/reports"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.07] bg-[#0A0E14] px-4 py-3 transition-colors hover:border-[#00D9FF]/40 hover:bg-[#0E151E] nexus-focus"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#E8EDF3]">
                              {rep.report_code}
                            </span>
                            <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D9FF]">
                              {rep.category?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[#8B96A5]">
                            {rep.created_at?.slice(0, 10) || 'Unknown date'} ·{' '}
                            {rep.conclusions?.length || 0} fault(s)
                            {typeof rep.odometer_at_diagnosis === 'number'
                              ? ` · ${formatDistance(rep.odometer_at_diagnosis, distanceUnit)}`
                              : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rep.safety_warning_triggered ? (
                            <TelemetryBadge variant="critical" dot pulse>
                              Safety Halt
                            </TelemetryBadge>
                          ) : null}
                          <TelemetryBadge
                            variant={repBadge.variant}
                            dot={repBadge.dot}
                            pulse={repBadge.pulse && !rep.safety_warning_triggered}
                          >
                            {repBadge.label}
                          </TelemetryBadge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </NexusPanel>
          </div>
        </div>
      </section>

      {/* BAND 4: CINEMATIC FOOTER CTA BAND & SAFETY BOUNDARY */}
      <FloatingPathsBackground
        variant="dark"
        intensity="low"
        className="bg-[#07090C] py-16 sm:py-20"
      >
        <section aria-label="Launch AutoExpert" className="mx-auto max-w-[1400px] space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-lg border border-white/[0.09] bg-[#0B0F15]/90 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2.5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#E8EDF3] sm:text-3xl">
                Ready for Transparent Mechanical Diagnostics?
              </h2>
              <p className="text-sm leading-relaxed text-[#8B96A5]">
                Initiate a guided diagnostic interview, execute the 10-scenario verification
                benchmark, or inspect the complete symbolic engine architecture.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <HudButton to="/diagnose" variant="primary" size="lg" icon={Stethoscope}>
                Run Vehicle Analysis
              </HudButton>
              <HudButton to="/demo" variant="secondary" size="lg" icon={Cpu}>
                Academic Benchmark
              </HudButton>
              <HudButton to="/about" variant="outline" size="lg" iconRight={ArrowRight}>
                System Info
              </HudButton>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-[#0B0F15]/95 p-4 text-xs leading-relaxed text-[#8B96A5]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden="true" />
            <p>
              <strong className="font-semibold text-[#E8EDF3]">
                Preliminary Rule-Based Analysis Notice:
              </strong>{' '}
              AutoExpert provides educational diagnostic possibilities derived from deterministic
              IF-THEN mechanical rules. Evidence scores reflect rule-condition fulfillment, not
              statistical failure probability. Always consult a certified mechanic before performing
              repairs or operating a vehicle with active safety warnings.
            </p>
          </div>
        </section>
      </FloatingPathsBackground>
    </PageTransition>
  );
}
