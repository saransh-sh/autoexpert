import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  HelpCircle,
  Play,
  Search,
  ShieldAlert,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react';
import TraceViewer from '../components/TraceViewer';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const VEHICLE_CONTEXT_OPTIONS = [
  {
    key: 'all',
    label: 'All 55 Rules [null]',
    description: 'No platform filter — evaluates all 55 rules across car, motorcycle & maintenance.',
    context: null,
  },
  {
    key: 'car_petrol_liquid',
    label: 'Car — Liquid Cooled Petrol',
    description: 'Automobile · Liquid-cooled · Petrol (filters to 35 applicable rules).',
    context: {
      vehicle_type: 'car',
      cooling_type: 'liquid_cooled',
      fuel_type: 'petrol',
    },
  },
  {
    key: 'car_electric',
    label: 'Car — Electric',
    description: 'Automobile · Liquid-cooled · Electric (filters to 14 applicable rules).',
    context: {
      vehicle_type: 'car',
      cooling_type: 'liquid_cooled',
      fuel_type: 'electric',
    },
  },
  {
    key: 'moto_petrol_liquid',
    label: 'Motorcycle — Petrol Liquid',
    description: 'Motorcycle · Liquid-cooled · Petrol (filters to 28 applicable rules).',
    context: {
      vehicle_type: 'motorcycle',
      cooling_type: 'liquid_cooled',
      fuel_type: 'petrol',
    },
  },
  {
    key: 'moto_petrol_air',
    label: 'Motorcycle — Petrol Air',
    description: 'Motorcycle · Air-cooled · Petrol (filters to 27 applicable rules, skips coolant checks).',
    context: {
      vehicle_type: 'motorcycle',
      cooling_type: 'air_cooled',
      fuel_type: 'petrol',
    },
  },
];

const FORWARD_PRESETS = [
  {
    label: 'Moto 3-Pass Stator',
    contextKey: 'moto_petrol_liquid',
    facts: {
      engine_starts: false,
      starter_clicks: true,
      headlights_dim: true,
      battery_recharged_recently: true,
      stator_ac_voltage_low: true,
    },
  },
  {
    label: 'Car Head Gasket (Critical)',
    contextKey: 'car_petrol_liquid',
    facts: {
      engine_overheating: true,
      coolant_level_low: true,
      white_exhaust_smoke: true,
      oil_milky_color: true,
    },
  },
  {
    label: 'Car EV Brake Wear',
    contextKey: 'car_electric',
    facts: {
      brake_pad_thickness_mm: 1.5,
      brake_grinding_noise: true,
    },
  },
];

const BACKWARD_PRESETS = [
  {
    label: 'Stator Failure',
    goal: 'FAULT_STATOR_REGULATOR_FAILURE',
    contextKey: 'moto_petrol_liquid',
    facts: { starter_clicks: true },
  },
  {
    label: 'Blown Head Gasket',
    goal: 'FAULT_BLOWN_HEAD_GASKET',
    contextKey: 'car_petrol_liquid',
    facts: { engine_overheating: true },
  },
  {
    label: 'Critical Brake Pads',
    goal: 'FAULT_CAR_BRAKE_PADS_CRITICAL',
    contextKey: 'car_electric',
    facts: { brake_pad_thickness_mm: 1.5 },
  },
];

const PROOF_STATUS_CONFIG = {
  PROVEN: {
    badge: 'lime',
    icon: CheckCircle2,
    border: 'border-[#C7FF4A]/35 bg-[#17240A]/40',
    text: 'text-[#C7FF4A]',
  },
  DISPROVEN: {
    badge: 'critical',
    icon: XCircle,
    border: 'border-[#FF3B5C]/40 bg-[#290D16]/45',
    text: 'text-[#FF6B84]',
  },
  INCONCLUSIVE_MISSING_FACTS: {
    badge: 'warning',
    icon: HelpCircle,
    border: 'border-[#F59E0B]/40 bg-[#261B08]/45',
    text: 'text-[#FBBF24]',
  },
};

function ProofNodeTree({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 4);

  if (!node || depth > 24) return null;

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const config = PROOF_STATUS_CONFIG[node.status] || PROOF_STATUS_CONFIG.INCONCLUSIVE_MISSING_FACTS;
  const StatusIcon = config.icon;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-white/[0.1] pl-3.5 pt-2' : ''}>
      <div className={`rounded-md border p-3 space-y-2 ${config.border}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-0.5 rounded p-0.5 text-[#8B96A5] hover:bg-white/[0.08] hover:text-[#E8EDF3] nexus-focus"
                aria-label={expanded ? 'Collapse proof subtree' : 'Expand proof subtree'}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            ) : (
              <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${config.text}`} aria-hidden="true" />
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {node.rule_id ? (
                  <span className="rounded border border-[#00D9FF]/35 bg-[#08242E] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#00D9FF]">
                    {node.rule_id}
                  </span>
                ) : null}
                <span className="font-mono text-xs font-semibold text-[#E8EDF3] break-all">
                  {node.rule_name || node.goal}
                </span>
              </div>
              {node.rule_name && node.goal ? (
                <div className="font-mono text-[10px] text-[#8B96A5] mt-0.5">
                  {node.goal}
                </div>
              ) : null}
            </div>
          </div>

          <TelemetryBadge variant={config.badge} size="sm">
            {node.status}
          </TelemetryBadge>
        </div>

        {node.details ? (
          <p className="text-xs leading-relaxed text-[#E8EDF3]/85">{node.details}</p>
        ) : null}

        {!hasChildren && Array.isArray(node.missing_facts) && node.missing_facts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#FBBF24]">
              Missing:
            </span>
            {node.missing_facts.map((mf) => (
              <span
                key={mf}
                className="rounded border border-[#F59E0B]/35 bg-[#0A0E13] px-2 py-0.5 font-mono text-[11px] text-[#FBBF24]"
              >
                {mf}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <div className="space-y-1">
          {node.children.map((child, idx) => (
            <ProofNodeTree
              key={`${child.rule_id || child.goal}-${depth + 1}-${idx}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Monitor() {
  const [activeTab, setActiveTab] = useState('forward');
  const [vehicleContextKey, setVehicleContextKey] = useState('all');
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);

  // Forward Chaining State
  const [forwardFactsText, setForwardFactsText] = useState(
    JSON.stringify(
      {
        engine_starts: false,
        starter_clicks: true,
        headlights_dim: true,
        battery_recharged_recently: true,
        stator_ac_voltage_low: true,
      },
      null,
      2
    )
  );
  const [forwardResult, setForwardResult] = useState(null);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardError, setForwardError] = useState('');

  // Backward Chaining State
  const [targetGoal, setTargetGoal] = useState('FAULT_STATOR_REGULATOR_FAILURE');
  const [backwardFactsText, setBackwardFactsText] = useState(
    JSON.stringify(
      {
        starter_clicks: true,
      },
      null,
      2
    )
  );
  const [backwardTree, setBackwardTree] = useState(null);
  const [backwardLoading, setBackwardLoading] = useState(false);
  const [backwardError, setBackwardError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getSettings()
      .then((prefs) => {
        if (active && typeof prefs?.default_demo_playback_ms === 'number') {
          setPlaybackSpeedMs(prefs.default_demo_playback_ms);
        }
      })
      .catch(() => {
        // Retain backend default 500ms if settings fetch fails
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedContextOption =
    VEHICLE_CONTEXT_OPTIONS.find((opt) => opt.key === vehicleContextKey) ||
    VEHICLE_CONTEXT_OPTIONS[0];

  const handleRunForward = async () => {
    setForwardLoading(true);
    setForwardError('');
    try {
      const parsedFacts = JSON.parse(forwardFactsText || '{}');
      const res = await api.runForwardChain({
        facts: parsedFacts,
        vehicle_context: selectedContextOption.context,
      });
      setForwardResult(res);
    } catch (err) {
      setForwardError(err.message || 'Invalid JSON syntax or forward inference failure.');
    } finally {
      setForwardLoading(false);
    }
  };

  const handleRunBackward = async () => {
    setBackwardLoading(true);
    setBackwardError('');
    try {
      const parsedFacts = JSON.parse(backwardFactsText || '{}');
      const res = await api.runBackwardChain({
        target_goal: targetGoal.trim(),
        facts: parsedFacts,
        vehicle_context: selectedContextOption.context,
      });
      setBackwardTree(res);
    } catch (err) {
      setBackwardError(err.message || 'Invalid JSON syntax or backward proof error.');
    } finally {
      setBackwardLoading(false);
    }
  };

  const applyQuickFactAssertion = (factKey, value) => {
    try {
      const parsed = JSON.parse(backwardFactsText || '{}');
      parsed[factKey] = value;
      setBackwardFactsText(JSON.stringify(parsed, null, 2));
      setBackwardError('');
    } catch {
      setBackwardError('Fix JSON syntax in Known Facts before inserting an observation.');
    }
  };

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="MON_07"
        eyebrow="DUAL-MODE INFERENCE LAB"
        title="Symbolic Inference Engine Monitor"
        description="Execute live 3-Valued Logic multi-pass forward chaining and recursive cycle-safe backward proof trees with configurable vehicle platform context."
        icon={Activity}
        actions={
          <div
            role="tablist"
            aria-label="Inference Engine Mode"
            className="inline-flex rounded-md border border-white/[0.1] bg-[#0B0F15] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'forward'}
              onClick={() => setActiveTab('forward')}
              className={`rounded px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider transition-colors nexus-focus ${
                activeTab === 'forward'
                  ? 'bg-[#00D9FF] text-[#07090C]'
                  : 'text-[#8B96A5] hover:text-[#E8EDF3]'
              }`}
            >
              Forward Chaining
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'backward'}
              onClick={() => setActiveTab('backward')}
              className={`rounded px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider transition-colors nexus-focus ${
                activeTab === 'backward'
                  ? 'bg-[#C7FF4A] text-[#07090C]'
                  : 'text-[#8B96A5] hover:text-[#E8EDF3]'
              }`}
            >
              Backward Chaining
            </button>
          </div>
        }
      />

      {/* Bug #7 Fix: Explicit Vehicle Context Selector bar applied to both engines */}
      <NexusPanel variant="inset" padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#00D9FF]" aria-hidden="true" />
              <label
                htmlFor="monitor-vehicle-context"
                className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E8EDF3]"
              >
                Vehicle Context Scope
              </label>
              <TelemetryBadge variant={selectedContextOption.context ? 'cyan' : 'lime'}>
                {selectedContextOption.context
                  ? `${selectedContextOption.context.vehicle_type} · ${selectedContextOption.context.cooling_type} · ${selectedContextOption.context.fuel_type}`
                  : 'NULL (ALL 55 RULES)'}
              </TelemetryBadge>
            </div>
            <p className="text-xs text-[#8B96A5]">{selectedContextOption.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="monitor-vehicle-context"
              value={vehicleContextKey}
              onChange={(e) => setVehicleContextKey(e.target.value)}
              className="nexus-input min-w-[260px] py-2 text-xs font-mono cursor-pointer"
            >
              {VEHICLE_CONTEXT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <TelemetryBadge variant="neutral">
              TRACE SPEED: {playbackSpeedMs} MS
            </TelemetryBadge>
          </div>
        </div>
      </NexusPanel>

      {/* TAB 1: FORWARD CHAINING ENGINE */}
      {activeTab === 'forward' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Panel */}
            <div className="lg:col-span-4">
              <NexusPanel
                code="WM_INPUT"
                title="Initial Fact Assertions"
                subtitle="Provide JSON working memory facts evaluated under Three-Valued Logic."
                padding="md"
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                    Quick Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {FORWARD_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setVehicleContextKey(preset.contextKey);
                          setForwardFactsText(JSON.stringify(preset.facts, null, 2));
                          setForwardError('');
                        }}
                        className="rounded border border-white/[0.1] bg-[#0B0F15] px-2 py-1 font-mono text-[11px] text-[#8B96A5] transition-colors hover:border-[#00D9FF]/45 hover:text-[#E8EDF3] nexus-focus"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="forward-facts-json" className="sr-only">
                    Forward Chaining Working Memory Facts JSON
                  </label>
                  <textarea
                    id="forward-facts-json"
                    rows={11}
                    value={forwardFactsText}
                    onChange={(e) => setForwardFactsText(e.target.value)}
                    spellCheck={false}
                    className="nexus-input font-mono text-xs text-[#C7FF4A] leading-relaxed"
                  />
                </div>

                {forwardError ? (
                  <div
                    role="alert"
                    className="rounded border border-[#FF3B5C]/40 bg-[#290D16] p-2.5 text-xs text-[#FFC2CD] flex items-start gap-2"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
                    <span>{forwardError}</span>
                  </div>
                ) : null}

                <HudButton
                  variant="primary"
                  icon={Play}
                  loading={forwardLoading}
                  onClick={handleRunForward}
                  className="w-full"
                >
                  Execute Forward Chaining
                </HudButton>
              </NexusPanel>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-8">
              <NexusPanel
                code="FC_TELEMETRY"
                title="Forward Inference Output & Conflict Log"
                padding="md"
                className="space-y-5"
              >
                {!forwardResult ? (
                  <div className="py-16 text-center space-y-2">
                    <Terminal className="mx-auto h-9 w-9 text-[#5E6B7D]" aria-hidden="true" />
                    <p className="font-mono text-xs uppercase tracking-wider text-[#8B96A5]">
                      Run forward chaining to inspect multi-pass rule execution, derived facts, and conflict arbitration
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Runtime
                        </span>
                        <span className="mt-1 block font-display text-2xl font-bold text-[#C7FF4A] tabular-nums">
                          {forwardResult.runtime_ms} <span className="text-xs font-normal">ms</span>
                        </span>
                      </div>

                      <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Total Passes
                        </span>
                        <span className="mt-1 block font-display text-2xl font-bold text-[#00D9FF] tabular-nums">
                          {forwardResult.total_passes}
                        </span>
                      </div>

                      <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Rules Triggered
                        </span>
                        <span className="mt-1 block font-display text-2xl font-bold text-[#E8EDF3] tabular-nums">
                          {forwardResult.triggered_rules?.length || 0}
                        </span>
                      </div>

                      <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Fixed Point
                        </span>
                        <span
                          className={`mt-1 block font-display text-xl font-bold ${
                            forwardResult.fixed_point_reached
                              ? 'text-[#C7FF4A]'
                              : 'text-[#F59E0B]'
                          }`}
                        >
                          {forwardResult.fixed_point_reached ? 'REACHED' : 'MAX_PASSES'}
                        </span>
                      </div>
                    </div>

                    {/* Rule Activation Sequence */}
                    <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 space-y-2">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                        Rule Activation Sequence
                      </span>
                      {forwardResult.triggered_rules?.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {forwardResult.triggered_rules.map((ruleId, idx) => (
                            <React.Fragment key={`${ruleId}-${idx}`}>
                              <span className="rounded border border-[#00D9FF]/35 bg-[#08242E] px-2.5 py-1 font-mono text-xs font-semibold text-[#00D9FF]">
                                {ruleId}
                              </span>
                              {idx < forwardResult.triggered_rules.length - 1 ? (
                                <span className="font-mono text-xs text-[#5E6B7D]">→</span>
                              ) : null}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-[#8B96A5]">
                          No rules satisfied under current Working Memory and Vehicle Context.
                        </p>
                      )}
                    </div>

                    {/* Derived Intermediate Facts */}
                    {forwardResult.derived_facts?.length > 0 ? (
                      <div className="rounded-md border border-[#C7FF4A]/25 bg-[#17240A]/35 p-3.5 space-y-2">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#C7FF4A]">
                          Derived Working Memory Facts ({forwardResult.derived_facts.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {forwardResult.derived_facts.map((df, idx) => (
                            <div
                              key={`${df.fact}-${idx}`}
                              className="rounded border border-[#C7FF4A]/30 bg-[#0A0E13] px-2.5 py-1 font-mono text-xs"
                            >
                              <span className="text-[#C7FF4A]">
                                +{df.fact} = {String(df.value)}
                              </span>
                              <span className="ml-2 text-[10px] text-[#8B96A5]">
                                [{df.source_rule_id} · P{df.pass_number}]
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Concluded Faults */}
                    {forwardResult.conclusions?.length > 0 ? (
                      <div className="space-y-2.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Concluded Faults ({forwardResult.conclusions.length})
                        </span>
                        <div className="space-y-2.5">
                          {forwardResult.conclusions.map((c, idx) => (
                            <div
                              key={`${c.fault_id}-${idx}`}
                              className={`rounded-md border p-4 space-y-2 ${
                                c.safety_critical
                                  ? 'border-[#FF3B5C]/45 bg-[#190B10]'
                                  : 'border-white/[0.08] bg-[#0A0E13]'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-[#00D9FF]">
                                    {c.rule_id}
                                  </span>
                                  <span className="font-mono text-[11px] text-[#8B96A5]">
                                    {c.fault_id}
                                  </span>
                                  {c.safety_critical ? (
                                    <TelemetryBadge variant="critical" icon={ShieldAlert}>
                                      SAFETY CRITICAL
                                    </TelemetryBadge>
                                  ) : null}
                                </div>
                                <TelemetryBadge
                                  variant={
                                    c.severity === 'critical'
                                      ? 'critical'
                                      : c.severity === 'high'
                                        ? 'warning'
                                        : 'cyan'
                                  }
                                >
                                  {c.severity} · Pass {c.pass_number}
                                </TelemetryBadge>
                              </div>
                              <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                                {c.title}
                              </div>
                              <p className="text-xs leading-relaxed text-[#8B96A5]">
                                {c.explanation}
                              </p>
                              {c.recommended_action ? (
                                <div className="rounded border border-white/[0.06] bg-[#10151D] p-2.5 text-xs text-[#E8EDF3]">
                                  <span className="font-mono text-[10px] uppercase text-[#00D9FF] mr-1.5">
                                    Action:
                                  </span>
                                  {c.recommended_action}
                                </div>
                              ) : null}
                              {c.preventive_maintenance ? (
                                <div className="flex items-start gap-1.5 text-[11px] text-[#8B96A5]">
                                  <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C7FF4A]" aria-hidden="true" />
                                  <span>{c.preventive_maintenance}</span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* 5-Tier Conflict Resolution Log */}
                    {forwardResult.conflict_log?.length > 0 ? (
                      <div className="space-y-2.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          5-Tier Conflict Resolution Log
                        </span>
                        <div className="space-y-2">
                          {forwardResult.conflict_log.map((log, idx) => (
                            <div
                              key={`${log.pass_number}-${log.chosen_rule_id}-${idx}`}
                              className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="rounded bg-[#151C26] px-2 py-0.5 text-[#8B96A5]">
                                    PASS {String(log.pass_number).padStart(2, '0')}
                                  </span>
                                  <span className="text-[#E8EDF3]">
                                    Winner:{' '}
                                    <strong className="text-[#00D9FF]">
                                      {log.chosen_rule_id}
                                    </strong>
                                  </span>
                                </div>
                                <TelemetryBadge variant="amber">
                                  {log.competing_rules?.length || 0} COMPETING
                                </TelemetryBadge>
                              </div>

                              <p className="text-xs text-[#8B96A5]">{log.rationale}</p>

                              {log.competing_rules?.length > 1 ? (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {log.competing_rules.map((cr) => (
                                    <span
                                      key={cr.rule_id}
                                      className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                                        cr.rule_id === log.chosen_rule_id
                                          ? 'border-[#00D9FF]/50 bg-[#08242E] text-[#00D9FF]'
                                          : 'border-white/[0.07] bg-[#10151D] text-[#8B96A5]'
                                      }`}
                                    >
                                      {cr.rule_id} (spec:{cr.specificity}, prio:{cr.priority}
                                      {cr.safety_critical ? ', SAFETY' : ''})
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </NexusPanel>
            </div>
          </div>

          {/* Step-by-Step TraceViewer reading default_demo_playback_ms */}
          {forwardResult?.execution_steps?.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[#E8EDF3]">
                  Step-by-Step Reasoning Trace Playback
                </h3>
                <span className="font-mono text-[11px] text-[#8B96A5]">
                  Calibrated interval: {playbackSpeedMs} ms/step
                </span>
              </div>
              <TraceViewer
                steps={forwardResult.execution_steps}
                playbackSpeedMs={playbackSpeedMs}
              />
            </div>
          ) : null}
        </div>
      ) : (
        /* TAB 2: BACKWARD CHAINING PROVER */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <NexusPanel
              code="BC_QUERY"
              title="Goal Hypothesis & Facts"
              subtitle="Specify a target fault_id or intermediate derived fact to prove recursively."
              padding="md"
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                  Goal Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BACKWARD_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTargetGoal(preset.goal);
                        setVehicleContextKey(preset.contextKey);
                        setBackwardFactsText(JSON.stringify(preset.facts, null, 2));
                        setBackwardError('');
                      }}
                      className="rounded border border-white/[0.1] bg-[#0B0F15] px-2 py-1 font-mono text-[11px] text-[#8B96A5] transition-colors hover:border-[#C7FF4A]/45 hover:text-[#E8EDF3] nexus-focus"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="backward-target-goal"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                >
                  Target Hypothesis Goal
                </label>
                <input
                  id="backward-target-goal"
                  type="text"
                  placeholder="e.g. FAULT_STATOR_REGULATOR_FAILURE"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="nexus-input font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="backward-facts-json"
                  className="block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                >
                  Known Facts (JSON)
                </label>
                <textarea
                  id="backward-facts-json"
                  rows={8}
                  value={backwardFactsText}
                  onChange={(e) => setBackwardFactsText(e.target.value)}
                  spellCheck={false}
                  className="nexus-input font-mono text-xs text-[#00D9FF] leading-relaxed"
                />
              </div>

              {backwardError ? (
                <div
                  role="alert"
                  className="rounded border border-[#FF3B5C]/40 bg-[#290D16] p-2.5 text-xs text-[#FFC2CD] flex items-start gap-2"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
                  <span>{backwardError}</span>
                </div>
              ) : null}

              <HudButton
                variant="lime"
                icon={Search}
                loading={backwardLoading}
                disabled={!targetGoal.trim()}
                onClick={handleRunBackward}
                className="w-full"
              >
                Prove Target Goal
              </HudButton>
            </NexusPanel>
          </div>

          {/* Backward Proof Tree Output */}
          <div className="lg:col-span-8">
            <NexusPanel
              code="PROOF_TREE"
              title="Recursive Proof Tree & Targeted Questions"
              padding="md"
              className="space-y-5"
            >
              {!backwardTree ? (
                <div className="py-16 text-center space-y-2">
                  <Search className="mx-auto h-9 w-9 text-[#5E6B7D]" aria-hidden="true" />
                  <p className="font-mono text-xs uppercase tracking-wider text-[#8B96A5]">
                    Configure a target hypothesis and known facts to trace recursive subgoal evaluation
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Verdict Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.1] bg-[#0A0E13] p-4">
                    <div className="space-y-1">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                        Hypothesis Verdict · {backwardTree.target_goal}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <TelemetryBadge
                          variant={
                            PROOF_STATUS_CONFIG[backwardTree.status]?.badge || 'warning'
                          }
                          size="md"
                          dot
                        >
                          {backwardTree.status}
                        </TelemetryBadge>
                      </div>
                    </div>

                    {backwardTree.cycles_prevented?.length > 0 ? (
                      <TelemetryBadge variant="amber" size="md">
                        CYCLES PREVENTED: {backwardTree.cycles_prevented.length}
                      </TelemetryBadge>
                    ) : (
                      <TelemetryBadge variant="neutral">
                        0 CYCLES DETECTED
                      </TelemetryBadge>
                    )}
                  </div>

                  {backwardTree.cycles_prevented?.length > 0 ? (
                    <div className="rounded-md border border-[#F59E0B]/30 bg-[#261B08]/50 p-3 space-y-1">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#FBBF24]">
                        Cycle Prevention Log
                      </span>
                      <ul className="space-y-1 font-mono text-xs text-[#E8EDF3]">
                        {backwardTree.cycles_prevented.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Recursive Root Nodes Proof Tree */}
                  {backwardTree.root_nodes?.length > 0 ? (
                    <div className="space-y-2.5">
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                        Recursive Proof Evaluation Tree
                      </span>
                      <div className="space-y-3">
                        {backwardTree.root_nodes.map((node, idx) => (
                          <ProofNodeTree
                            key={`${node.goal}-${idx}`}
                            node={node}
                            depth={0}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Missing Facts */}
                  {backwardTree.missing_facts?.length > 0 ? (
                    <div className="rounded-md border border-[#F59E0B]/30 bg-[#261B08]/40 p-4 space-y-2">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#FBBF24]">
                        Missing Observable Facts Required ({backwardTree.missing_facts.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {backwardTree.missing_facts.map((mf) => (
                          <span
                            key={mf}
                            className="rounded border border-[#F59E0B]/35 bg-[#0A0E13] px-2.5 py-1 font-mono text-xs text-[#FBBF24]"
                          >
                            ? {mf}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Targeted Follow-Up Questions */}
                  {backwardTree.suggested_questions?.length > 0 ? (
                    <div className="space-y-2.5">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                        Suggested Follow-Up Questions ({backwardTree.suggested_questions.length})
                      </span>
                      <div className="space-y-2.5">
                        {backwardTree.suggested_questions.map((q) => (
                          <div
                            key={q.fact_key}
                            className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-[#00D9FF]">
                                  {q.fact_key}
                                </span>
                                <TelemetryBadge variant="neutral">
                                  {q.input_type || 'boolean'}
                                  {q.unit ? ` (${q.unit})` : ''}
                                </TelemetryBadge>
                              </div>

                              {q.input_type === 'boolean' || !q.input_type ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => applyQuickFactAssertion(q.fact_key, true)}
                                    className="rounded border border-[#C7FF4A]/35 bg-[#17240A] px-2 py-0.5 font-mono text-[10px] text-[#C7FF4A] hover:bg-[#C7FF4A]/20 nexus-focus"
                                  >
                                    Assert True
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => applyQuickFactAssertion(q.fact_key, false)}
                                    className="rounded border border-[#FF3B5C]/35 bg-[#290D16] px-2 py-0.5 font-mono text-[10px] text-[#FF6B84] hover:bg-[#FF3B5C]/20 nexus-focus"
                                  >
                                    Assert False
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => applyQuickFactAssertion(q.fact_key, 'UNKNOWN')}
                                    className="rounded border border-[#F59E0B]/35 bg-[#261B08] px-2 py-0.5 font-mono text-[10px] text-[#FBBF24] hover:bg-[#F59E0B]/20 nexus-focus"
                                  >
                                    UNKNOWN
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <p className="text-xs text-[#E8EDF3]">{q.question_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </NexusPanel>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
