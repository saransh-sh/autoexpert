import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import FloatingPathsBackground from '../components/FloatingPathsBackground';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const FALLBACK_KB_STATS = {
  total_rules: 55,
  safety_critical_rules: 15,
  by_category: {
    electrical: 5,
    engine: 5,
    transmission: 7,
    brakes: 4,
    suspension_tyres: 7,
    cooling_lubrication: 8,
    fuel_system: 4,
    maintenance: 15,
  },
  files_loaded: ['motorcycle_rules.json', 'car_rules.json', 'maintenance_rules.json'],
};

const CONFLICT_TIERS = [
  {
    tier: '01',
    name: 'Refraction',
    detail: 'Excludes rules that have already fired in the active forward-chaining run to guarantee convergence.',
  },
  {
    tier: '02',
    name: 'Safety Criticality',
    detail: 'Rules flagged safety_critical == true preempt all routine diagnostic and maintenance rules.',
  },
  {
    tier: '03',
    name: 'Condition Specificity',
    detail: 'Rules with more required preconditions (len(conditions)) take precedence over general heuristics.',
  },
  {
    tier: '04',
    name: 'Explicit Priority',
    detail: 'Domain-authored numeric priority scores (0–100) arbitrate between equally specific candidates.',
  },
  {
    tier: '05',
    name: 'Lexicographical Rule ID',
    detail: 'Alphabetical rule_id sorting ensures 100% deterministic tiebreaking across every platform.',
  },
];

const PROVENANCE_TYPES = [
  { key: 'initial_fact', label: 'Initial Context', desc: 'Vehicle configuration & pre-loaded session state' },
  { key: 'symptom', label: 'Reported Symptom', desc: 'Primary complaint selected at interview start' },
  { key: 'observation', label: 'Physical Observation', desc: 'Visual, auditory, or tactile checks during Q&A' },
  { key: 'measurement', label: 'Numeric Measurement', desc: 'Quantified readings (voltage, pad mm, distance)' },
  { key: 'derived', label: 'Derived Assertion', desc: 'Intermediate fact deduced by rule firing in Pass N' },
];

const STACK_GROUPS = [
  {
    layer: 'Symbolic Inference Core',
    packageName: 'autoexpert_engine',
    items: [
      'Python 3.11+ pure-symbolic engine (shared by FastAPI & Google Colab)',
      'Pydantic v2 schemas & Draft-07 jsonschema validation (rule_schema.json)',
      'Verified by 28 Pytest unit & integration tests across 8 test modules',
      'Zero LLM API calls, zero black-box ML weights, zero external paid inference',
    ],
  },
  {
    layer: 'Backend & Persistence',
    packageName: 'backend/app',
    items: [
      'FastAPI REST API with OpenAPI interactive docs (/docs)',
      'SQLAlchemy 2.0 ORM backed by 7 SQLite tables (autoexpert.db)',
      'ReportLab binary PDF generation for diagnostic audit reports',
      'Vehicle-context filtering (car vs motorcycle, liquid vs air-cooled)',
    ],
  },
  {
    layer: 'Frontend Cockpit',
    packageName: 'frontend/src',
    items: [
      'React 18 + Vite 5 SPA with Tailwind CSS NEXUS design system',
      'Framer Motion architectural transitions & FloatingPaths vector geometry',
      'Three.js / React Three Fiber interactive vehicle telemetry canvas',
      'Recharts diagnostic telemetry & Lucide precision vector iconography',
    ],
  },
];

export default function About() {
  const [kbStats, setKbStats] = useState(FALLBACK_KB_STATS);

  useEffect(() => {
    let active = true;
    api
      .getRuleStats()
      .then((data) => {
        if (active && data && typeof data.total_rules === 'number') {
          setKbStats(data);
        }
      })
      .catch(() => {
        // Keep verified baseline metrics when API server is offline
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryCount = Object.keys(kbStats.by_category || {}).length || 8;

  return (
    <PageTransition className="space-y-8">
      {/* Architectural Hero Header with FloatingPathsBackground */}
      <FloatingPathsBackground
        variant="cyan"
        intensity="low"
        className="rounded-lg border border-white/[0.08] bg-[#0B0F15] p-6 sm:p-10"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <TelemetryBadge variant="cyan" dot>
                ARCH_09 // PURE SYMBOLIC CORE
              </TelemetryBadge>
              <TelemetryBadge variant="lime">NO LLM · DETERMINISTIC</TelemetryBadge>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#E8EDF3] sm:text-4xl">
              System Architecture &amp; Inference Engine
            </h1>
            <p className="text-sm leading-relaxed text-[#8B96A5] sm:text-base">
              AutoExpert evaluates structured IF–THEN mechanical rules over Three-Valued Logic
              working memory. The same Python <code className="text-[#00D9FF]">autoexpert_engine</code>{' '}
              package powers both this FastAPI web cockpit and the academic Google Colab evaluation
              notebook.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <HudButton to="/diagnose" variant="primary" icon={Stethoscope}>
              Launch Diagnosis
            </HudButton>
            <HudButton to="/monitor" variant="secondary" icon={Activity}>
              Engine Monitor
            </HudButton>
          </div>
        </div>
      </FloatingPathsBackground>

      {/* Verified Knowledge Base Metrics */}
      <section aria-label="Knowledge base metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NexusPanel padding="md" className="space-y-1.5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
            Validated Rules
          </div>
          <div className="font-display text-3xl font-bold text-[#E8EDF3] tabular-nums">
            {kbStats.total_rules}
          </div>
          <p className="text-xs text-[#8B96A5]">
            20 Car · 20 Moto · 15 Maint (49 faults + 6 chaining)
          </p>
        </NexusPanel>

        <NexusPanel padding="md" className="space-y-1.5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
            Safety Interlocks
          </div>
          <div className="font-display text-3xl font-bold text-[#FF3B5C] tabular-nums">
            {kbStats.safety_critical_rules}
          </div>
          <p className="text-xs text-[#8B96A5]">Priority emergency halt rules</p>
        </NexusPanel>

        <NexusPanel padding="md" className="space-y-1.5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
            Rule Categories
          </div>
          <div className="font-display text-3xl font-bold text-[#00D9FF] tabular-nums">
            {categoryCount}
          </div>
          <p className="text-xs text-[#8B96A5]">Cars &amp; motorcycles covered</p>
        </NexusPanel>

        <NexusPanel padding="md" className="space-y-1.5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
            Demo Benchmarks
          </div>
          <div className="font-display text-3xl font-bold text-[#C7FF4A] tabular-nums">
            10
          </div>
          <p className="text-xs text-[#8B96A5]">Ground-truth test scenarios</p>
        </NexusPanel>
      </section>

      {/* Dual Inference Modes + Studio Powertrain Cutaway */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <NexusPanel
            code="FC_ENGINE"
            title="Multi-Pass Forward Chaining"
            subtitle="Data-driven fixed-point iteration in forward_chaining.py"
            padding="md"
          >
            <p className="text-sm leading-relaxed text-[#8B96A5]">
              Starts from initial vehicle context and reported symptoms, filters rules matching
              vehicle type, cooling architecture, and fuel type, then iterates up to a fixed point
              (max 50 passes). Early passes assert 8 multi-hop derived intermediate facts (such as{' '}
              <code className="text-[#E8EDF3]">coolant_loss_detected</code> or{' '}
              <code className="text-[#E8EDF3]">power_supply_insufficient</code>) that unlock deeper
              fault conclusions in subsequent passes.
            </p>
          </NexusPanel>

          <NexusPanel
            code="BC_ENGINE"
            title="Recursive Backward Chaining"
            subtitle="Goal-driven verification & question selection in backward_chaining.py"
            padding="md"
          >
            <p className="text-sm leading-relaxed text-[#8B96A5]">
              Given a target <code className="text-[#E8EDF3]">fault_id</code> or fact key, locates
              candidate rules that establish the goal and recursively evaluates subgoals. Tracks{' '}
              <code className="text-[#E8EDF3]">visited_goals</code> along the active call stack to
              prevent cyclic recursion, returns <code className="text-[#00D9FF]">PROVEN</code>,{' '}
              <code className="text-[#FF3B5C]">DISPROVEN</code>, or{' '}
              <code className="text-[#F59E0B]">INCONCLUSIVE_MISSING_FACTS</code>, and surfaces
              prioritized interview questions while suppressing irrelevant prompts (e.g., coolant
              checks on air-cooled motorcycles).
            </p>
          </NexusPanel>
        </div>

        <NexusPanel padding="none" className="overflow-hidden lg:col-span-5 flex flex-col">
          <div className="relative flex-1 min-h-[260px] bg-[#07090C]">
            <img
              src="/assets/powertrain-cutaway.jpg"
              alt="Automotive powertrain cutaway telemetry blueprint"
              className="h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 space-y-1.5">
              <TelemetryBadge variant="cyan">VEHICLE-AWARE APPLICABILITY</TelemetryBadge>
              <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
                Cars &amp; Motorcycles · Liquid &amp; Air-Cooled
              </h3>
              <p className="text-xs leading-relaxed text-[#8B96A5]">
                Every rule declares explicit <code className="text-[#E8EDF3]">vehicle_types</code>,{' '}
                <code className="text-[#E8EDF3]">cooling_types</code>, and{' '}
                <code className="text-[#E8EDF3]">fuel_types</code> preconditions.
              </p>
            </div>
          </div>
        </NexusPanel>
      </section>

      {/* 3VL Working Memory & 5-Tier Conflict Resolution */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <NexusPanel
          code="3VL_WM"
          title="Three-Valued Logic & Fact Provenance"
          subtitle="Never treats unanswered or UNKNOWN observations as FALSE"
          className="lg:col-span-6"
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[#8B96A5]">
              Conditions evaluate across <span className="font-mono text-[#C7FF4A]">TRUE</span>,{' '}
              <span className="font-mono text-[#FF3B5C]">FALSE</span>, and{' '}
              <span className="font-mono text-[#F59E0B]">UNKNOWN</span>. Every working memory entry
              retains its provenance, source rule ID, pass number, and chronological mutation record.
            </p>
            <div className="space-y-2">
              {PROVENANCE_TYPES.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-3 rounded border border-white/[0.06] bg-[#0B0F15] px-3.5 py-2.5"
                >
                  <div>
                    <div className="text-xs font-medium text-[#E8EDF3]">{item.label}</div>
                    <div className="text-xs text-[#8B96A5]">{item.desc}</div>
                  </div>
                  <code className="shrink-0 rounded bg-[#151C26] px-2 py-0.5 font-mono text-[11px] text-[#00D9FF]">
                    {item.key}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </NexusPanel>

        <NexusPanel
          code="CONFLICT_5"
          title="5-Tier Conflict Resolution"
          subtitle="Deterministic arbitration when multiple rules qualify in a pass"
          className="lg:col-span-6"
        >
          <ol className="space-y-2.5">
            {CONFLICT_TIERS.map((tier) => (
              <li
                key={tier.tier}
                className="flex items-start gap-3 rounded border border-white/[0.06] bg-[#0B0F15] px-3.5 py-2.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#00D9FF]/35 bg-[#08242E] font-mono text-[11px] font-semibold text-[#00D9FF]">
                  {tier.tier}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#E8EDF3]">{tier.name}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#8B96A5]">{tier.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </NexusPanel>
      </section>

      {/* Technology Stack */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STACK_GROUPS.map((group) => (
          <NexusPanel
            key={group.layer}
            title={group.layer}
            code={group.packageName}
            padding="md"
          >
            <ul className="space-y-2 text-xs leading-relaxed text-[#8B96A5]">
              {group.items.map((entry) => (
                <li key={entry} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D9FF]"
                    aria-hidden="true"
                  />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </NexusPanel>
        ))}
      </section>

      {/* Score Semantics & Safety Disclaimer */}
      <NexusPanel variant="inset" padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 max-w-4xl">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]"
              aria-hidden="true"
            />
            <div className="space-y-1 text-xs leading-relaxed text-[#8B96A5]">
              <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                Scoring Transparency &amp; Educational Safety Boundary
              </div>
              <p>
                Numeric <code className="text-[#E8EDF3]">evidence_match_score</code> values equal{' '}
                <code className="text-[#00D9FF]">
                  round((satisfied_conditions / total_conditions) * 100, 1)
                </code>
                . They quantify premise coverage against authored rules and are not statistically
                validated failure probabilities. AutoExpert is an educational preliminary diagnostic
                system; always confirm findings with a certified mechanic before performing repairs
                or operating a vehicle with safety warnings.
              </p>
            </div>
          </div>
          <HudButton
            to="/knowledge-base"
            variant="outline"
            size="sm"
            iconRight={ArrowRight}
            className="shrink-0 self-start"
          >
            Inspect Rules
          </HudButton>
        </div>
      </NexusPanel>
    </PageTransition>
  );
}
