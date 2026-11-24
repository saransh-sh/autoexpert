import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  RotateCcw,
  Activity,
  Layers,
  Car,
  ShieldAlert,
  Cpu,
  Zap,
  Cog,
  Disc,
  Thermometer,
  Fuel,
  Wrench,
  Check,
  Info,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import SafetyBanner from '../components/SafetyBanner';
import EvidenceScoreBadge from '../components/EvidenceScoreBadge';
import TraceViewer from '../components/TraceViewer';
import {
  NexusPanel,
  HudButton,
  TelemetryBadge,
  SectionHeader,
  PageTransition,
} from '../components/ui';

const CATEGORIES = [
  {
    id: 'engine',
    code: 'ENG_01',
    label: 'Engine & Performance',
    subtitle: 'Cranking, combustion, intake airflow, exhaust smoke, mounts',
    icon: Cpu,
  },
  {
    id: 'electrical',
    code: 'ELC_02',
    label: 'Electrical & Starting',
    subtitle: 'Battery state, starter solenoid, headlamps, alternator/stator',
    icon: Zap,
  },
  {
    id: 'transmission',
    code: 'TRN_03',
    label: 'Transmission & Clutch',
    subtitle: 'Clutch slip, cable freeplay, gear shifts, CV axle clicking',
    icon: Cog,
  },
  {
    id: 'brakes',
    code: 'BRK_04',
    label: 'Braking System',
    subtitle: 'Pad thickness, rotor grinding, pedal feel, caliper drag',
    icon: Disc,
  },
  {
    id: 'cooling_lubrication',
    code: 'CLG_05',
    label: 'Cooling & Lubrication',
    subtitle: 'Thermal buildup, coolant loss, oil pressure, sump leaks',
    icon: Thermometer,
  },
  {
    id: 'suspension_tyres',
    code: 'SUS_06',
    label: 'Suspension & Tyres',
    subtitle: 'Steering shimmy, tread wear, tracking pull, tyre cord hazard',
    icon: Activity,
  },
  {
    id: 'fuel_system',
    code: 'FUL_07',
    label: 'Fuel Delivery System',
    subtitle: 'Idle stalls, fuel rail pressure, fuel odor, visible leaks',
    icon: Fuel,
  },
];

const COMMON_SYMPTOMS = {
  engine: [
    'engine_cranks',
    'engine_starts',
    'reduced_engine_power',
    'excessive_engine_vibration',
    'black_smoke_exhaust',
  ],
  electrical: [
    'engine_starts',
    'starter_clicks',
    'headlights_dim',
    'battery_warning_light_on',
  ],
  transmission: [
    'rpm_rises_without_speed',
    'clutch_slipping',
    'trans_shifts_harsh_or_delayed',
    'clicking_noise_on_sharp_turns',
  ],
  brakes: [
    'brake_grinding_noise',
    'brake_pedal_spongy',
    'brake_pulls_to_one_side',
  ],
  cooling_lubrication: [
    'engine_overheating',
    'coolant_level_low',
    'oil_pressure_warning_light',
    'visible_oil_leak',
  ],
  suspension_tyres: [
    'steering_vibration_at_speed',
    'tyre_wear_uneven',
    'vehicle_pulls_left_or_right',
    'tyre_cord_visible',
  ],
  fuel_system: [
    'engine_stalls_at_idle',
    'fuel_smell_present',
    'fuel_pressure_low',
    'visible_fuel_leak',
  ],
};

const SYMPTOM_META = {
  engine_cranks: {
    label: 'Engine cranks (turns over) when starting',
    hint: 'Starter motor spins the crankshaft normally',
  },
  engine_starts: {
    label: 'Engine cranks and starts normally',
    hint: 'Check ONLY if the engine actually starts and runs (asserts engine_starts = True)',
  },
  reduced_engine_power: {
    label: 'Noticeable loss of engine power or acceleration',
    hint: 'Sluggish throttle response under load or uphill',
  },
  excessive_engine_vibration: {
    label: 'Excessive engine or chassis vibration',
    hint: 'Harsh shaking felt through steering wheel, bars, or floorboards',
  },
  black_smoke_exhaust: {
    label: 'Black / dark exhaust smoke',
    hint: 'Indicates rich combustion or airflow restriction',
  },
  starter_clicks: {
    label: 'Rapid clicking sound from starter solenoid',
    hint: 'Repeated click sound when attempting ignition',
  },
  headlights_dim: {
    label: 'Headlights dim or flicker during start attempt',
    hint: 'Visible voltage sag under cranking draw',
  },
  battery_warning_light_on: {
    label: 'Battery / charging warning light illuminated',
    hint: 'Charging indicator stays lit while engine runs',
  },
  rpm_rises_without_speed: {
    label: 'Engine RPM surges without matching road speed',
    hint: 'Revs flare in gear during acceleration',
  },
  clutch_slipping: {
    label: 'Clutch slips under load or acceleration',
    hint: 'Drivetrain fails to transfer torque cleanly',
  },
  trans_shifts_harsh_or_delayed: {
    label: 'Transmission shifts harshly or delays',
    hint: 'Abrupt jerks or hesitation during gear changes',
  },
  clicking_noise_on_sharp_turns: {
    label: 'Rhythmic clicking noise during sharp turns',
    hint: 'Audible clack from outer drive axle during low-speed turns',
  },
  brake_grinding_noise: {
    label: 'Metallic grinding noise when braking',
    hint: 'Potential metal-on-metal pad-to-rotor contact',
    safetyHint: true,
  },
  brake_pedal_spongy: {
    label: 'Brake pedal or lever feels soft / spongy',
    hint: 'Excessive travel or hydraulic air/fluid compromise',
    safetyHint: true,
  },
  brake_pulls_to_one_side: {
    label: 'Vehicle pulls to one side under braking',
    hint: 'Asymmetric braking force or seized caliper slide',
  },
  engine_overheating: {
    label: 'Temperature gauge in red / overheating zone',
    hint: 'Engine operating temperature exceeds safe threshold',
    safetyHint: true,
  },
  coolant_level_low: {
    label: 'Coolant expansion tank below minimum mark',
    hint: 'Liquid-cooled systems only',
  },
  oil_pressure_warning_light: {
    label: 'Red oil pressure warning light illuminated',
    hint: 'Critical lubrication hazard — triggers immediate safety halt',
    safetyHint: true,
  },
  visible_oil_leak: {
    label: 'Visible oil leak or fresh oil beneath engine',
    hint: 'Wet oil film on sump, gasket, or ground',
  },
  steering_vibration_at_speed: {
    label: 'Steering vibrates at highway speed (80–100 km/h)',
    hint: 'Noticeable shimmy through wheel or handlebars',
  },
  tyre_wear_uneven: {
    label: 'Uneven tyre tread wear across shoulders',
    hint: 'Inner/outer edge scrubbing, cupping, or center wear',
  },
  vehicle_pulls_left_or_right: {
    label: 'Vehicle drifts or pulls left or right',
    hint: 'Requires constant steering correction on straight roads',
  },
  tyre_cord_visible: {
    label: 'Exposed tyre cords, steel belts, or bulge',
    hint: 'Severe blowout hazard — inspect carefully',
    safetyHint: true,
  },
  engine_stalls_at_idle: {
    label: 'Engine stalls or dies at idle',
    hint: 'RPM drops out at stoplights or closed throttle',
  },
  fuel_smell_present: {
    label: 'Raw fuel odor around vehicle or cabin',
    hint: 'Possible pressurized leak or evaporative breach',
    safetyHint: true,
  },
  fuel_pressure_low: {
    label: 'Measured fuel pressure below specification',
    hint: 'Confirmed low fuel rail or pump delivery pressure',
  },
  visible_fuel_leak: {
    label: 'Visible dripping or wet fuel around lines/tank',
    hint: 'Fire hazard — verify without open flame or sparks',
    safetyHint: true,
  },
};

const PROVENANCE_BADGE_VARIANT = {
  initial_fact: 'neutral',
  symptom: 'cyan',
  observation: 'attention',
  measurement: 'lime',
  derived: 'amber',
};

const SEVERITY_BADGE_VARIANT = {
  critical: 'critical',
  high: 'warning',
  medium: 'cyan',
  low: 'neutral',
};

function formatFactValue(val) {
  if (val === 'UNKNOWN' || val === null || val === undefined) return 'UNKNOWN';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

function getValueVariant(val) {
  if (val === 'UNKNOWN' || val === null || val === undefined) return 'amber';
  if (val === true) return 'lime';
  if (val === false) return 'crimson';
  return 'cyan';
}

function isNumericQuestion(question) {
  return ['numeric', 'number', 'float', 'int'].includes(
    String(question?.input_type || '').toLowerCase()
  );
}

export default function Diagnose() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const validCategoryIds = useMemo(
    () => new Set(CATEGORIES.map((c) => c.id)),
    []
  );

  const initialCatParam = searchParams.get('category');

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    validCategoryIds.has(initialCatParam) ? initialCatParam : 'electrical'
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);
  const [distanceUnit, setDistanceUnit] = useState('km');

  const [inSession, setInSession] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [safetyAlert, setSafetyAlert] = useState(null);
  const [workingMemory, setWorkingMemory] = useState({});
  const [wmFilter, setWmFilter] = useState('all');
  const [numericInput, setNumericInput] = useState('');
  const [completed, setCompleted] = useState(false);

  const [report, setReport] = useState(null);
  const [sessionExplanation, setSessionExplanation] = useState(null);
  const [forwardTrace, setForwardTrace] = useState(null);
  const [activeExplainTab, setActiveExplainTab] = useState('chain');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load vehicles & user preferences on mount
  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getVehicles(), api.getSettings()]).then(
      ([vehRes, setRes]) => {
        if (!active) return;
        if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value)) {
          setVehicles(vehRes.value);
          if (vehRes.value.length > 0) {
            setSelectedVehicleId(String(vehRes.value[0].id));
          }
        }
        if (setRes.status === 'fulfilled' && setRes.value) {
          if (typeof setRes.value.default_demo_playback_ms === 'number') {
            setPlaybackSpeedMs(setRes.value.default_demo_playback_ms);
          }
          if (setRes.value.distance_unit) {
            setDistanceUnit(setRes.value.distance_unit);
          }
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Sync optional ?category= query parameter
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && validCategoryIds.has(cat) && !inSession) {
      setSelectedCategory((prev) => {
        if (prev !== cat) {
          setSelectedSymptoms([]);
        }
        return cat;
      });
    }
  }, [searchParams, validCategoryIds, inSession]);

  const selectedVehicle = useMemo(
    () =>
      vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null,
    [vehicles, selectedVehicleId]
  );

  const isAirCooled = selectedVehicle?.cooling_type === 'air_cooled';

  // Ensure coolant_level_low is cleared if user switches to an air-cooled vehicle
  useEffect(() => {
    if (isAirCooled) {
      setSelectedSymptoms((prev) =>
        prev.filter((s) => s !== 'coolant_level_low')
      );
    }
  }, [isAirCooled]);

  const availableSymptoms = useMemo(() => {
    const base = COMMON_SYMPTOMS[selectedCategory] || [];
    return base.filter((sym) => !(isAirCooled && sym === 'coolant_level_low'));
  }, [selectedCategory, isAirCooled]);

  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const fetchCompletionArtifacts = async (
    sid,
    vehicleCtx,
    knownReportId = null
  ) => {
    const [reportOrSessionRes, explRes, fwdRes] = await Promise.allSettled([
      knownReportId ? api.getReport(knownReportId) : api.getSession(sid),
      api.getSessionExplanation(sid),
      api.runForwardChain({
        session_id: sid,
        vehicle_context: vehicleCtx,
      }),
    ]);

    if (reportOrSessionRes.status === 'fulfilled' && reportOrSessionRes.value) {
      if (knownReportId) {
        setReport(reportOrSessionRes.value);
      } else if (reportOrSessionRes.value.report) {
        setReport(reportOrSessionRes.value.report);
      }
    }

    if (explRes.status === 'fulfilled' && explRes.value) {
      setSessionExplanation(explRes.value);
    }

    if (fwdRes.status === 'fulfilled' && fwdRes.value) {
      setForwardTrace(fwdRes.value);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    setSessionExplanation(null);
    setForwardTrace(null);

    try {
      const res = await api.startDiagnostic({
        vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : null,
        category: selectedCategory,
        initial_symptoms: selectedSymptoms,
      });

      setSessionId(res.session_id);
      setSafetyAlert(res.safety_alert || null);
      setWorkingMemory(res.working_memory || {});
      setQuestionIndex(1);
      setInSession(true);

      // Bug #2 fix: if safety_alert triggered or no next_question, exit interview into Results/Halt view
      if (res.safety_alert || !res.next_question) {
        setCurrentQuestion(null);
        setCompleted(true);
        await fetchCompletionArtifacts(res.session_id, selectedVehicle, null);
      } else {
        setCurrentQuestion(res.next_question);
        setCompleted(false);
      }
    } catch (err) {
      setErrorMsg(`Failed to start diagnostic session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value) => {
    if (!currentQuestion || loading) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const provenance =
        value === 'UNKNOWN'
          ? 'observation'
          : typeof value === 'number'
            ? 'measurement'
            : 'observation';

      const res = await api.answerDiagnostic({
        session_id: sessionId,
        fact_key: currentQuestion.fact_key,
        value,
        provenance,
      });

      setWorkingMemory(res.working_memory || {});
      setSafetyAlert(res.safety_alert || null);
      setNumericInput('');

      const shouldComplete =
        Boolean(res.completed) ||
        Boolean(res.safety_alert) ||
        !res.next_question;

      if (shouldComplete) {
        setCurrentQuestion(null);
        setCompleted(true);
        await fetchCompletionArtifacts(
          sessionId,
          selectedVehicle,
          res.report_id || null
        );
      } else {
        setCurrentQuestion(res.next_question);
        setQuestionIndex((prev) => prev + 1);
      }
    } catch (err) {
      setErrorMsg(`Error submitting diagnostic answer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = (keepSelection = true) => {
    setInSession(false);
    setSessionId(null);
    setCurrentQuestion(null);
    setQuestionIndex(1);
    setSafetyAlert(null);
    setWorkingMemory({});
    setWmFilter('all');
    setNumericInput('');
    setCompleted(false);
    setReport(null);
    setSessionExplanation(null);
    setForwardTrace(null);
    setErrorMsg('');
    if (!keepSelection) {
      setSelectedSymptoms([]);
    }
  };

  // Derived data for Step 3 Results View
  const activeStepNumber = !inSession ? 1 : !completed ? 2 : 3;
  const displayedConclusions =
    report?.conclusions?.length > 0
      ? report.conclusions
      : forwardTrace?.conclusions || [];
  const displayedExplanation = report?.explanation || sessionExplanation || null;
  const traceSteps = forwardTrace?.execution_steps || [];

  // Working memory summary & filtered entries
  const wmEntries = useMemo(() => {
    const entries = Object.entries(workingMemory || {});
    return entries.filter(([, f]) => {
      const val = typeof f === 'object' && f !== null ? f.value : f;
      const prov =
        typeof f === 'object' && f !== null ? f.provenance : 'initial_fact';
      const isUnk = val === 'UNKNOWN' || val === null || val === undefined;
      if (wmFilter === 'derived') return prov === 'derived';
      if (wmFilter === 'unknown') return isUnk;
      if (wmFilter === 'observed')
        return ['symptom', 'observation', 'measurement'].includes(prov);
      return true;
    });
  }, [workingMemory, wmFilter]);

  const wmCounts = useMemo(() => {
    const all = Object.values(workingMemory || {});
    let derived = 0;
    let unknown = 0;
    for (const f of all) {
      const val = typeof f === 'object' && f !== null ? f.value : f;
      const prov =
        typeof f === 'object' && f !== null ? f.provenance : 'initial_fact';
      if (prov === 'derived') derived += 1;
      if (val === 'UNKNOWN' || val === null || val === undefined) unknown += 1;
    }
    return { total: all.length, derived, unknown };
  }, [workingMemory]);

  const formatOdometer = (km) => {
    if (km === null || km === undefined) return 'N/A';
    if (distanceUnit === 'mi') {
      return `${Math.round(km * 0.621371).toLocaleString()} mi`;
    }
    return `${Number(km).toLocaleString()} km`;
  };

  const selectedCategoryObj =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="DIAG_03"
        eyebrow="Backward & Forward Symbolic Inference"
        title="Interactive Vehicle Diagnosis"
        description="Configure target vehicle context, select initial symptoms, and run an adaptive 3-Valued Logic interview with real-time safety interlocks."
        icon={Stethoscope}
        actions={
          inSession ? (
            <HudButton
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={() => resetSession(true)}
            >
              Reset Session
            </HudButton>
          ) : null
        }
      />

      {/* 3-Phase Diagnostic Stepper */}
      <div
        aria-label="Diagnostic workflow progress"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {[
          { num: 1, label: 'Configure & Select', code: 'STEP_01' },
          { num: 2, label: 'Adaptive 3VL Interview', code: 'STEP_02' },
          { num: 3, label: 'Results & Reasoning Trace', code: 'STEP_03' },
        ].map((step) => {
          const isCurrent = activeStepNumber === step.num;
          const isDone = activeStepNumber > step.num;
          return (
            <div
              key={step.num}
              className={`flex items-center justify-between rounded-md border px-4 py-2.5 transition-colors ${
                isCurrent
                  ? 'border-[#00D9FF]/60 bg-[#08242E]/70 text-[#E8EDF3]'
                  : isDone
                    ? 'border-[#C7FF4A]/35 bg-[#121D09]/70 text-[#C7FF4A]'
                    : 'border-white/[0.07] bg-[#0B0F15] text-[#8B96A5]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded border font-mono text-[11px] font-semibold ${
                    isCurrent
                      ? 'border-[#00D9FF] bg-[#00D9FF] text-[#07090C]'
                      : isDone
                        ? 'border-[#C7FF4A]/50 bg-[#17240A] text-[#C7FF4A]'
                        : 'border-white/[0.12] bg-[#10151D] text-[#8B96A5]'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : step.num}
                </span>
                <span className="text-xs font-medium sm:text-sm">
                  {step.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider opacity-75">
                {step.code}
              </span>
            </div>
          );
        })}
      </div>

      {/* Inline Error Banner */}
      {errorMsg ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-[#FF3B5C]/45 bg-[#190B10] px-4 py-3 text-xs text-[#FFC2CD]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="font-mono text-[11px] uppercase text-[#FF8FA3] hover:text-white"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Unmissable Safety Halt Banner */}
      <SafetyBanner alert={safetyAlert} />

      {!inSession ? (
        /* STEP 1: CONFIGURE & SELECT */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Vehicle Context & Domain Selection */}
          <div className="space-y-6 lg:col-span-5">
            <NexusPanel
              code="VEH_CTX"
              title="Target Vehicle Context"
              subtitle="Filters rule applicability by vehicle type, cooling system, and fuel"
              padding="md"
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="vehicle-select"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Select Fleet Asset or Generic Mode
                  </label>
                  <select
                    id="vehicle-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="nexus-input font-mono text-xs"
                  >
                    <option value="">
                      Generic Mode (All 55 Car &amp; Motorcycle Rules)
                    </option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.year} {v.manufacturer} {v.model} ({v.vehicle_type} ·{' '}
                        {v.cooling_type?.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Specs Telemetry Card */}
                {selectedVehicle ? (
                  <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                          {selectedVehicle.year} {selectedVehicle.manufacturer}{' '}
                          {selectedVehicle.model}
                        </div>
                        <div className="font-mono text-[11px] text-[#8B96A5]">
                          {selectedVehicle.registration_no || `UNIT #${selectedVehicle.id}`}
                        </div>
                      </div>
                      <TelemetryBadge variant="cyan" icon={Car}>
                        {selectedVehicle.vehicle_type}
                      </TelemetryBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="rounded border border-white/[0.06] bg-[#10151D] px-2.5 py-2">
                        <span className="block text-[10px] text-[#8B96A5]">
                          COOLING
                        </span>
                        <span className="font-medium text-[#E8EDF3] uppercase">
                          {selectedVehicle.cooling_type?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div className="rounded border border-white/[0.06] bg-[#10151D] px-2.5 py-2">
                        <span className="block text-[10px] text-[#8B96A5]">
                          FUEL TYPE
                        </span>
                        <span className="font-medium text-[#E8EDF3] uppercase">
                          {selectedVehicle.fuel_type || 'N/A'}
                        </span>
                      </div>
                      <div className="rounded border border-white/[0.06] bg-[#10151D] px-2.5 py-2">
                        <span className="block text-[10px] text-[#8B96A5]">
                          TRANSMISSION
                        </span>
                        <span className="font-medium text-[#E8EDF3] uppercase">
                          {selectedVehicle.transmission || 'N/A'}
                        </span>
                      </div>
                      <div className="rounded border border-white/[0.06] bg-[#10151D] px-2.5 py-2">
                        <span className="block text-[10px] text-[#8B96A5]">
                          ODOMETER
                        </span>
                        <span className="font-medium text-[#E8EDF3]">
                          {formatOdometer(selectedVehicle.odometer_km)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-[#00D9FF]/25 bg-[#081921] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <TelemetryBadge variant="cyan">GENERIC MODE</TelemetryBadge>
                      <span className="font-mono text-[11px] text-[#67E8F9]">
                        Unfiltered KB Scope
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#8B96A5]">
                      No specific vehicle profile applied. All 55 car, motorcycle,
                      and maintenance rules remain eligible during inference.{' '}
                      {vehicles.length === 0 ? (
                        <Link
                          to="/vehicles"
                          className="text-[#00D9FF] hover:underline"
                        >
                          Register a vehicle
                        </Link>
                      ) : null}
                    </p>
                  </div>
                )}
              </div>
            </NexusPanel>

            <NexusPanel
              code="DOMAIN_7"
              title="Diagnostic Subsystem"
              subtitle="Select primary mechanical domain to scope interview queries"
              padding="md"
            >
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSymptoms([]);
                      }}
                      className={`flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-left transition-colors nexus-focus ${
                        active
                          ? 'border-[#00D9FF] bg-[#08242E]/85 text-[#E8EDF3] shadow-nexus-cyan'
                          : 'border-white/[0.07] bg-[#0B0F15] text-[#8B96A5] hover:border-white/[0.18] hover:text-[#E8EDF3]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${
                            active
                              ? 'border-[#00D9FF]/50 bg-[#0C3542] text-[#00D9FF]'
                              : 'border-white/[0.08] bg-[#10151D] text-[#8B96A5]'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate sm:text-sm">
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-[#8B96A5] truncate">
                            {cat.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] uppercase text-[#5E6B7D] shrink-0">
                        {cat.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </NexusPanel>
          </div>

          {/* Right Column: Initial Symptoms Matrix & Start Trigger */}
          <div className="lg:col-span-7">
            <NexusPanel
              code={selectedCategoryObj.code}
              title={`Initial Observed Symptoms — ${selectedCategoryObj.label}`}
              subtitle="Select all confirmed observations before starting; leave unobserved items unchecked"
              padding="md"
              headerAction={
                <TelemetryBadge variant="cyan">
                  {selectedSymptoms.length} SELECTED
                </TelemetryBadge>
              }
            >
              <div className="space-y-5">
                {isAirCooled && selectedCategory === 'cooling_lubrication' ? (
                  <div className="flex items-center gap-2.5 rounded-md border border-[#00D9FF]/30 bg-[#081921] px-3.5 py-2.5 text-xs text-[#67E8F9]">
                    <Info className="h-4 w-4 shrink-0 text-[#00D9FF]" />
                    <span>
                      Air-cooled vehicle selected: liquid{' '}
                      <code className="font-mono text-[#E8EDF3]">
                        coolant_level_low
                      </code>{' '}
                      checks are automatically filtered out.
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availableSymptoms.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym);
                    const meta = SYMPTOM_META[sym] || {
                      label: sym.replace(/_/g, ' '),
                      hint: '',
                    };
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        aria-pressed={isChecked}
                        className={`flex items-start justify-between gap-3 rounded-md border p-3.5 text-left transition-all nexus-focus ${
                          isChecked
                            ? 'border-[#00D9FF] bg-[#08242E] text-[#E8EDF3] shadow-nexus-cyan'
                            : 'border-white/[0.08] bg-[#0B0F15] text-[#C7D0DB] hover:border-white/[0.2] hover:bg-[#10151D]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold leading-snug text-[#E8EDF3]">
                              {meta.label}
                            </span>
                            {meta.safetyHint ? (
                              <TelemetryBadge variant="warning" size="sm">
                                SAFETY
                              </TelemetryBadge>
                            ) : null}
                          </div>
                          {meta.hint ? (
                            <p className="text-[11px] leading-snug text-[#8B96A5]">
                              {meta.hint}
                            </p>
                          ) : null}
                          <code className="block pt-0.5 font-mono text-[10px] text-[#5E6B7D]">
                            {sym}
                          </code>
                        </div>

                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isChecked
                              ? 'border-[#00D9FF] bg-[#00D9FF] text-[#07090C]'
                              : 'border-white/[0.16] bg-[#10151D] text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#8B96A5]">
                    Unchecked symptoms remain{' '}
                    <span className="font-mono text-[#FBBF24]">UNKNOWN</span> in
                    3-Valued Logic until answered during the interview.
                  </p>
                  <HudButton
                    variant="primary"
                    size="lg"
                    icon={Stethoscope}
                    loading={loading}
                    onClick={handleStart}
                  >
                    {loading ? 'Initializing Inference...' : 'Begin Diagnostic Interview'}
                  </HudButton>
                </div>
              </div>
            </NexusPanel>
          </div>
        </div>
      ) : (
        /* STEP 2 (ADAPTIVE INTERVIEW) & STEP 3 (RESULTS / SAFETY HALT) */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Primary Workspace (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {!completed && currentQuestion ? (
              /* STEP 2: ACTIVE ADAPTIVE INTERVIEW */
              <NexusPanel
                variant="cyan"
                padding="md"
                code={`INQUIRY_${String(questionIndex).padStart(2, '0')}`}
                title="Adaptive Backward-Chaining Question"
                subtitle={`Target fact key: ${currentQuestion.fact_key}`}
                headerAction={
                  <TelemetryBadge variant="cyan" dot pulse={!loading}>
                    3VL INTERVIEW ACTIVE
                  </TelemetryBadge>
                }
              >
                <div className="space-y-6">
                  {/* Scanning / Inference Evaluation Indicator */}
                  {loading ? (
                    <div
                      role="status"
                      className="rounded-md border border-[#00D9FF]/35 bg-[#081C24] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-[#67E8F9]">
                        <span className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 animate-pulse text-[#00D9FF]" />
                          EVALUATING 3VL WORKING MEMORY &amp; CONFLICT SET...
                        </span>
                        <span>FORWARD + BACKWARD PASS</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        {shouldReduceMotion ? (
                          <div className="h-full w-2/3 bg-[#00D9FF]" />
                        ) : (
                          <motion.div
                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#00D9FF] to-[#C7FF4A]"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TelemetryBadge variant="neutral">
                        FACT: {currentQuestion.fact_key}
                      </TelemetryBadge>
                      {currentQuestion.unit ? (
                        <TelemetryBadge variant="lime">
                          UNIT: {currentQuestion.unit}
                        </TelemetryBadge>
                      ) : null}
                      {currentQuestion.safe_range ? (
                        <TelemetryBadge variant="cyan">
                          SPEC: {currentQuestion.safe_range}
                        </TelemetryBadge>
                      ) : null}
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-snug text-[#E8EDF3] sm:text-xl">
                      {currentQuestion.question_text}
                    </h2>
                  </div>

                  {/* Numeric vs 3-Valued Boolean Controls */}
                  {isNumericQuestion(currentQuestion) ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            value={numericInput}
                            onChange={(e) => setNumericInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                numericInput !== '' &&
                                !Number.isNaN(Number(numericInput))
                              ) {
                                handleAnswer(Number(numericInput));
                              }
                            }}
                            placeholder={`Enter numeric measurement${
                              currentQuestion.unit
                                ? ` (${currentQuestion.unit})`
                                : ''
                            }...`}
                            aria-label={currentQuestion.question_text}
                            className="nexus-input pr-20 font-mono text-sm text-[#C7FF4A]"
                          />
                          {currentQuestion.unit ? (
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/[0.12] bg-[#151C26] px-2 py-0.5 font-mono text-[11px] font-medium text-[#00D9FF]">
                              {currentQuestion.unit}
                            </span>
                          ) : null}
                        </div>
                        <HudButton
                          variant="primary"
                          size="lg"
                          loading={loading}
                          disabled={
                            numericInput === '' ||
                            Number.isNaN(Number(numericInput))
                          }
                          onClick={() => handleAnswer(Number(numericInput))}
                        >
                          Submit Measurement
                        </HudButton>
                      </div>
                      {currentQuestion.safe_range ? (
                        <p className="font-mono text-[11px] text-[#8B96A5]">
                          Reference Specification:{' '}
                          <span className="text-[#C7FF4A]">
                            {currentQuestion.safe_range}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAnswer(true)}
                        className="flex items-center justify-center gap-2.5 rounded-md border border-[#C7FF4A]/45 bg-[#162409] px-5 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-[#C7FF4A] transition-all hover:border-[#C7FF4A] hover:bg-[#1E310D] disabled:opacity-50 nexus-focus"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Yes (True)</span>
                      </button>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAnswer(false)}
                        className="flex items-center justify-center gap-2.5 rounded-md border border-[#FF3B5C]/45 bg-[#290D16] px-5 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-[#FF8FA3] transition-all hover:border-[#FF3B5C] hover:bg-[#38121E] disabled:opacity-50 nexus-focus"
                      >
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>No (False)</span>
                      </button>
                    </div>
                  )}

                  {/* Explicit 3VL UNKNOWN Control */}
                  <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-[#8B96A5]">
                      Unsure or cannot verify safely right now? Preserve
                      Three-Valued Logic rather than guessing.
                    </span>
                    <HudButton
                      variant="outline"
                      size="sm"
                      icon={HelpCircle}
                      disabled={loading}
                      onClick={() => handleAnswer('UNKNOWN')}
                      className="border-[#F59E0B]/45 text-[#FBBF24] hover:border-[#F59E0B] hover:bg-[#261B08]"
                    >
                      Unknown (3VL)
                    </HudButton>
                  </div>
                </div>
              </NexusPanel>
            ) : (
              /* STEP 3: SAFETY HALT & STRUCTURED DIAGNOSTIC RESULTS */
              <div className="space-y-6">
                {/* Results Summary Header */}
                <NexusPanel
                  variant={safetyAlert?.triggered ? 'critical' : 'default'}
                  padding="md"
                  code={report?.report_code || `SES_${sessionId}`}
                  title={
                    safetyAlert?.triggered
                      ? 'Critical Safety Halt — Diagnostic Summary'
                      : 'Diagnostic Inference Complete'
                  }
                  subtitle={
                    report
                      ? `Persisted audit dossier #${report.id} · Category: ${selectedCategoryObj.label}`
                      : `Session #${sessionId} symbolic evaluation · Category: ${selectedCategoryObj.label}`
                  }
                  headerAction={
                    <div className="flex flex-wrap items-center gap-2">
                      {report?.id ? (
                        <HudButton
                          href={api.downloadReportPdfUrl(report.id)}
                          download
                          variant="lime"
                          size="sm"
                          icon={Download}
                        >
                          Download PDF Report
                        </HudButton>
                      ) : null}
                      <HudButton
                        variant="secondary"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => resetSession(true)}
                      >
                        Retry / New Diagnosis
                      </HudButton>
                    </div>
                  }
                >
                  <div className="space-y-5">
                    {/* Subtle Evidence Score Methodology Note */}
                    {displayedConclusions.length > 0 ? (
                      <div className="flex items-start gap-2.5 rounded-md border border-white/[0.08] bg-[#0B0F15] px-3.5 py-2.5 text-xs text-[#8B96A5]">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00D9FF]" />
                        <span>
                          <strong className="text-[#E8EDF3]">
                            Rule Premise Match %
                          </strong>{' '}
                          measures deterministic rule premise fulfillment (
                          <code className="font-mono text-[#00D9FF]">
                            satisfied conditions / total conditions
                          </code>
                          ), not statistical AI probability.
                        </span>
                      </div>
                    ) : null}

                    {/* Concluded Issues List */}
                    {displayedConclusions.length > 0 ? (
                      <div className="space-y-4">
                        {displayedConclusions.map((conc, idx) => {
                          const matchingStep = traceSteps.find(
                            (s) => s.rule_id === conc.rule_id
                          );
                          const matchedConditions =
                            matchingStep?.satisfied_conditions || [];
                          const scoreVal =
                            typeof conc.evidence_match_score === 'number'
                              ? conc.evidence_match_score
                              : 100.0;

                          return (
                            <div
                              key={`${conc.rule_id}-${idx}`}
                              className={`rounded-md border p-5 space-y-4 ${
                                conc.safety_critical
                                  ? 'border-[#FF3B5C]/45 bg-[#150A0E]'
                                  : 'border-white/[0.1] bg-[#0B0F15]'
                              }`}
                            >
                              {/* Title + Badges Row */}
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <TelemetryBadge
                                      variant={
                                        SEVERITY_BADGE_VARIANT[conc.severity] ||
                                        'neutral'
                                      }
                                    >
                                      SEVERITY: {conc.severity || 'unknown'}
                                    </TelemetryBadge>
                                    {conc.safety_critical ? (
                                      <TelemetryBadge
                                        variant="critical"
                                        dot
                                        icon={ShieldAlert}
                                      >
                                        SAFETY WARNING
                                      </TelemetryBadge>
                                    ) : null}
                                    <span className="font-mono text-[11px] text-[#00D9FF]">
                                      {conc.rule_id}
                                    </span>
                                    <span className="font-mono text-[11px] text-[#5E6B7D]">
                                      {conc.fault_id}
                                    </span>
                                  </div>
                                  <h3 className="font-display text-lg font-semibold text-[#E8EDF3]">
                                    {conc.title}
                                  </h3>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <EvidenceScoreBadge
                                    score={scoreVal}
                                    label="RULE PREMISE MATCH"
                                  />
                                  <span className="font-mono text-[10px] text-[#8B96A5]">
                                    Premises satisfied (non-probabilistic)
                                  </span>
                                </div>
                              </div>

                              {/* Explanation */}
                              <p className="text-sm leading-relaxed text-[#C7D0DB]">
                                {conc.explanation}
                              </p>

                              {/* Symptoms / Premises Matched */}
                              {matchedConditions.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                                    Symptoms &amp; Premises Matched (
                                    {matchedConditions.length})
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {matchedConditions.map((cond, cIdx) => (
                                      <span
                                        key={`${cond.fact}-${cIdx}`}
                                        className="inline-flex items-center gap-1.5 rounded border border-[#00D9FF]/30 bg-[#08242E]/70 px-2.5 py-1 font-mono text-[11px] text-[#E8EDF3]"
                                      >
                                        <span className="text-[#67E8F9]">
                                          {cond.fact}
                                        </span>
                                        <span className="text-[#8B96A5]">
                                          {cond.operator}
                                        </span>
                                        <span className="text-[#C7FF4A]">
                                          {formatFactValue(cond.actual)}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* Recommended Action */}
                              <div className="rounded-md border border-[#00D9FF]/30 bg-[#081A22] p-4 space-y-1">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00D9FF]">
                                  <Wrench className="h-3.5 w-3.5" />
                                  <span>Recommended Action</span>
                                </div>
                                <p className="text-xs leading-relaxed text-[#E8EDF3] sm:text-sm">
                                  {conc.recommended_action}
                                </p>
                              </div>

                              {/* Preventive Maintenance Tip */}
                              {conc.preventive_maintenance ? (
                                <div className="rounded-md border border-[#C7FF4A]/25 bg-[#121D09]/70 px-4 py-3 text-xs leading-relaxed text-[#D9F99D]">
                                  <strong className="font-mono uppercase tracking-wider text-[#C7FF4A]">
                                    Preventive Maintenance:{' '}
                                  </strong>
                                  {conc.preventive_maintenance}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : safetyAlert?.triggered ? (
                      <div className="rounded-md border border-[#FF3B5C]/40 bg-[#14090D] p-5 space-y-3">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#FF8FA3]">
                          <ShieldAlert className="h-4 w-4 text-[#FF3B5C]" />
                          <span>Immediate Safety Interlock Triggered</span>
                        </div>
                        <p className="text-sm leading-relaxed text-[#E8EDF3]">
                          {safetyAlert.message}
                        </p>
                        <p className="text-xs text-[#8B96A5]">
                          Triggered on working memory hazard flag{' '}
                          <code className="font-mono text-[#FF8FA3]">
                            {safetyAlert.fact}
                          </code>
                          . Additional multi-condition rules did not need to
                          complete before halting vehicle operation.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-6 text-center space-y-2">
                        <HelpCircle className="mx-auto h-6 w-6 text-[#F59E0B]" />
                        <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                          No Authored Fault Rules Satisfied
                        </div>
                        <p className="mx-auto max-w-lg text-xs leading-relaxed text-[#8B96A5]">
                          None of the applicable rules in{' '}
                          <span className="text-[#E8EDF3]">
                            {selectedCategoryObj.label}
                          </span>{' '}
                          had all required premises confirmed as True. If key
                          checks were marked{' '}
                          <span className="font-mono text-[#FBBF24]">
                            UNKNOWN
                          </span>
                          , verify those physical measurements with a certified
                          mechanic.
                        </p>
                      </div>
                    )}
                  </div>
                </NexusPanel>

                {/* Forward-Chaining Decision Path Playback */}
                {traceSteps.length > 0 ? (
                  <TraceViewer
                    steps={traceSteps}
                    playbackSpeedMs={playbackSpeedMs}
                  />
                ) : null}

                {/* Interactive Rule / Premise Explanation Breakdown */}
                {displayedExplanation ? (
                  <NexusPanel
                    code="EXPLAIN_ENGINE"
                    title="Inference Chain & Rule Premise Breakdown"
                    subtitle={`Triggered ${displayedExplanation.total_rules_triggered ?? 0} rule(s) across ${displayedExplanation.total_passes ?? 0} pass(es) in ${displayedExplanation.runtime_ms ?? 0}ms`}
                    padding="md"
                    headerAction={
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'chain', label: 'Inference Chain' },
                          { id: 'how', label: 'How Explanations' },
                          { id: 'conflicts', label: 'Conflict Log' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveExplainTab(tab.id)}
                            className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                              activeExplainTab === tab.id
                                ? 'border-[#00D9FF] bg-[#08242E] text-[#67E8F9]'
                                : 'border-white/[0.08] bg-[#0B0F15] text-[#8B96A5] hover:text-[#E8EDF3]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      {activeExplainTab === 'chain' && (
                        <div className="space-y-2.5">
                          {(displayedExplanation.inference_chain || []).length >
                          0 ? (
                            displayedExplanation.inference_chain.map(
                              (item, idx) => (
                                <div
                                  key={`${item.rule_id}-${idx}`}
                                  className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3.5 space-y-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <TelemetryBadge variant="cyan">
                                        PASS {String(item.pass_number).padStart(2, '0')}
                                      </TelemetryBadge>
                                      <span className="font-mono text-xs font-semibold text-[#00D9FF]">
                                        {item.rule_id}
                                      </span>
                                      <span className="text-xs font-semibold text-[#E8EDF3]">
                                        {item.rule_name}
                                      </span>
                                    </div>
                                    {item.conclusion ? (
                                      <TelemetryBadge variant="lime">
                                        CONCLUDES: {item.conclusion}
                                      </TelemetryBadge>
                                    ) : null}
                                  </div>
                                  <div className="rounded bg-[#07090C] px-3 py-2 font-mono text-[11px] text-[#C7D0DB]">
                                    <span className="text-[#8B96A5]">IF </span>
                                    {item.premise}
                                  </div>
                                  {item.derived_facts?.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                                      <span className="text-[#8B96A5]">
                                        DERIVED:
                                      </span>
                                      {item.derived_facts.map((df) => (
                                        <TelemetryBadge
                                          key={df}
                                          variant="lime"
                                          size="sm"
                                        >
                                          {df}
                                        </TelemetryBadge>
                                      ))}
                                    </div>
                                  ) : null}
                                  <p className="text-xs text-[#8B96A5]">
                                    {item.rationale}
                                  </p>
                                </div>
                              )
                            )
                          ) : (
                            <p className="py-4 text-center font-mono text-xs text-[#8B96A5]">
                              No multi-pass rule derivations recorded for this session.
                            </p>
                          )}
                        </div>
                      )}

                      {activeExplainTab === 'how' && (
                        <div className="space-y-2.5">
                          {(displayedExplanation.how_explanations || [])
                            .length > 0 ? (
                            displayedExplanation.how_explanations.map(
                              (how, idx) => (
                                <div
                                  key={`${how.rule_id}-${idx}`}
                                  className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-4 space-y-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                                      {how.title}
                                    </span>
                                    <TelemetryBadge variant="cyan">
                                      {how.rule_id}
                                    </TelemetryBadge>
                                  </div>
                                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#C7D0DB]">
                                    {how.explanation}
                                  </pre>
                                </div>
                              )
                            )
                          ) : (
                            <p className="py-4 text-center font-mono text-xs text-[#8B96A5]">
                              No conclusion "How" explanations generated.
                            </p>
                          )}
                        </div>
                      )}

                      {activeExplainTab === 'conflicts' && (
                        <div className="space-y-2.5">
                          {(displayedExplanation.conflict_resolutions || [])
                            .length > 0 ? (
                            displayedExplanation.conflict_resolutions.map(
                              (log, idx) => (
                                <div
                                  key={`conflict-${idx}`}
                                  className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3.5 space-y-2 font-mono text-xs"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[#E8EDF3] font-semibold">
                                      Pass {String(log.pass_number).padStart(2, '0')} · Winner:{' '}
                                      <span className="text-[#00D9FF]">
                                        {log.chosen_rule_id}
                                      </span>
                                    </span>
                                    <TelemetryBadge variant="neutral">
                                      {log.competing_rules?.length || 1} Candidate(s)
                                    </TelemetryBadge>
                                  </div>
                                  <p className="text-[11px] text-[#8B96A5]">
                                    {log.rationale}
                                  </p>
                                </div>
                              )
                            )
                          ) : (
                            <p className="py-4 text-center font-mono text-xs text-[#8B96A5]">
                              No conflict resolution logs recorded.
                            </p>
                          )}
                        </div>
                      )}

                      {displayedExplanation.disclaimer ? (
                        <div className="flex items-start gap-2.5 rounded-md border border-[#F59E0B]/30 bg-[#1B1508] p-3.5 text-xs leading-relaxed text-[#FDE68A]">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
                          <span>{displayedExplanation.disclaimer}</span>
                        </div>
                      ) : null}
                    </div>
                  </NexusPanel>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Sidebar: Live 3VL Working Memory Inspector (4 cols) */}
          <div className="lg:col-span-4">
            <NexusPanel
              code="3VL_WM"
              title="Working Memory Inspector"
              subtitle="Live 3-Valued Logic fact provenance & truth state"
              padding="md"
              className="lg:sticky lg:top-20"
              headerAction={
                <TelemetryBadge variant="cyan" icon={Layers}>
                  {wmCounts.total} FACTS
                </TelemetryBadge>
              }
            >
              <div className="space-y-3">
                {/* Summary Counters & Filter Tabs */}
                <div className="grid grid-cols-3 gap-2 font-mono text-[10.5px]">
                  <div className="rounded border border-white/[0.07] bg-[#0B0F15] px-2.5 py-2 text-center">
                    <span className="block text-[#8B96A5]">TOTAL</span>
                    <span className="text-sm font-semibold text-[#E8EDF3]">
                      {wmCounts.total}
                    </span>
                  </div>
                  <div className="rounded border border-white/[0.07] bg-[#0B0F15] px-2.5 py-2 text-center">
                    <span className="block text-[#8B96A5]">DERIVED</span>
                    <span className="text-sm font-semibold text-[#00D9FF]">
                      {wmCounts.derived}
                    </span>
                  </div>
                  <div className="rounded border border-white/[0.07] bg-[#0B0F15] px-2.5 py-2 text-center">
                    <span className="block text-[#8B96A5]">UNKNOWN</span>
                    <span className="text-sm font-semibold text-[#FBBF24]">
                      {wmCounts.unknown}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'observed', label: 'Observed' },
                    { id: 'derived', label: 'Derived' },
                    { id: 'unknown', label: 'Unknown' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWmFilter(tab.id)}
                      className={`rounded border px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
                        wmFilter === tab.id
                          ? 'border-[#00D9FF] bg-[#08242E] text-[#67E8F9]'
                          : 'border-white/[0.08] bg-[#0B0F15] text-[#8B96A5] hover:text-[#E8EDF3]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Working Memory Entries */}
                <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
                  {wmEntries.length === 0 ? (
                    <div className="rounded-md border border-white/[0.06] bg-[#0B0F15] py-8 text-center font-mono text-xs text-[#8B96A5]">
                      No facts matching current filter
                    </div>
                  ) : (
                    wmEntries.map(([key, f]) => {
                      const val =
                        typeof f === 'object' && f !== null ? f.value : f;
                      const prov =
                        typeof f === 'object' && f !== null
                          ? f.provenance || 'initial_fact'
                          : 'initial_fact';
                      const sourceRuleId =
                        typeof f === 'object' && f !== null
                          ? f.source_rule_id
                          : null;
                      const passNumber =
                        typeof f === 'object' && f !== null
                          ? f.pass_number
                          : null;

                      const isUnknownVal =
                        val === 'UNKNOWN' || val === null || val === undefined;
                      const provVariant =
                        PROVENANCE_BADGE_VARIANT[prov] || 'neutral';

                      return (
                        <div
                          key={key}
                          className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-medium text-[#E8EDF3] break-all">
                              {key}
                            </span>
                            <TelemetryBadge
                              variant={getValueVariant(val)}
                              size="sm"
                              className="shrink-0"
                            >
                              {formatFactValue(val)}
                            </TelemetryBadge>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <TelemetryBadge variant={provVariant} size="sm">
                                {prov.replace('_', ' ')}
                              </TelemetryBadge>
                              {isUnknownVal ? (
                                <TelemetryBadge variant="amber" size="sm">
                                  3VL UNKNOWN
                                </TelemetryBadge>
                              ) : null}
                            </div>
                            {sourceRuleId ? (
                              <span className="font-mono text-[10px] text-[#8B96A5]">
                                {sourceRuleId}
                                {typeof passNumber === 'number'
                                  ? ` · P${passNumber}`
                                  : ''}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </NexusPanel>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
