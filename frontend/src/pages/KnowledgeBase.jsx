import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Cpu,
  Filter,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Diagnostic Domains' },
  { value: 'engine', label: 'Engine & Performance' },
  { value: 'electrical', label: 'Electrical & Starting' },
  { value: 'transmission', label: 'Transmission & Clutch' },
  { value: 'brakes', label: 'Braking System' },
  { value: 'cooling_lubrication', label: 'Cooling & Lubrication' },
  { value: 'suspension_tyres', label: 'Suspension & Tyres' },
  { value: 'fuel_system', label: 'Fuel System' },
  { value: 'maintenance', label: 'Preventive Maintenance' },
];

const CATEGORY_LABELS = {
  engine: 'Engine & Performance',
  electrical: 'Electrical & Starting',
  transmission: 'Transmission & Clutch',
  brakes: 'Braking System',
  cooling_lubrication: 'Cooling & Lubrication',
  suspension_tyres: 'Suspension & Tyres',
  fuel_system: 'Fuel System',
  maintenance: 'Preventive Maintenance',
};

const SEVERITY_BADGE_MAP = {
  critical: 'critical',
  high: 'warning',
  medium: 'cyan',
  low: 'lime',
};

function formatApplicabilityList(items = [], fallback = 'any') {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.map((item) => item.replace(/_/g, ' ')).join(', ');
}

export default function KnowledgeBase() {
  const [rules, setRules] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalKbRules, setTotalKbRules] = useState(0);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .getRuleStats()
      .then((data) => {
        if (active && data) {
          setStats(data);
        }
      })
      .catch(() => {
        // Summary stats are optional; rule list remains functional
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (vehicleType) params.vehicle_type = vehicleType;
        if (severity) params.severity = severity;

        const data = await api.getRules(params);
        if (!active) return;
        setRules(data.rules || []);
        setTotalMatches(data.total_matches ?? 0);
        setTotalKbRules(data.total_kb_rules ?? 0);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to retrieve symbolic rule registry.');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category, vehicleType, severity, reloadTick]);

  const hasActiveFilters = Boolean(search.trim() || category || vehicleType || severity);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setVehicleType('');
    setSeverity('');
  };

  const categoryEntries = Object.entries(stats?.by_category || {});

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="KB_06"
        eyebrow="SYMBOLIC RULE INSPECTOR"
        title="Knowledge Base Registry"
        description="Inspect schema-validated IF–THEN production rules governing Three-Valued Logic inference, multi-hop derived assertions, vehicle applicability, and safety interlocks."
        icon={BookOpen}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <TelemetryBadge variant="cyan" size="md" dot>
              MATCHED: {totalMatches} / {totalKbRules || stats?.total_rules || 55} RULES
            </TelemetryBadge>
            {hasActiveFilters ? (
              <HudButton variant="secondary" size="sm" icon={RotateCcw} onClick={clearFilters}>
                Reset Filters
              </HudButton>
            ) : null}
          </div>
        }
      />

      {/* Summary Telemetry Bar from /api/rules/stats */}
      {stats ? (
        <NexusPanel variant="inset" padding="sm" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TelemetryBadge variant="neutral" icon={Layers}>
                TOTAL VALIDATED: {stats.total_rules}
              </TelemetryBadge>
              <TelemetryBadge variant="critical" icon={ShieldAlert}>
                SAFETY-CRITICAL INTERLOCKS: {stats.safety_critical_rules}
              </TelemetryBadge>
              {Array.isArray(stats.files_loaded) && stats.files_loaded.length > 0 ? (
                <span className="font-mono text-[11px] text-[#8B96A5]">
                  SOURCES: {stats.files_loaded.join(' · ')}
                </span>
              ) : null}
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5E6B7D]">
              CLICK DOMAIN TO FILTER
            </span>
          </div>

          {categoryEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors nexus-focus ${
                  category === ''
                    ? 'border-[#00D9FF]/60 bg-[#08242E] text-[#00D9FF]'
                    : 'border-white/[0.08] bg-[#10151D] text-[#8B96A5] hover:border-white/[0.2] hover:text-[#E8EDF3]'
                }`}
              >
                ALL ({stats.total_rules})
              </button>
              {categoryEntries.map(([catKey, count]) => {
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(isSelected ? '' : catKey)}
                    className={`rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors nexus-focus ${
                      isSelected
                        ? 'border-[#00D9FF]/60 bg-[#08242E] text-[#00D9FF]'
                        : 'border-white/[0.08] bg-[#10151D] text-[#8B96A5] hover:border-white/[0.2] hover:text-[#E8EDF3]'
                    }`}
                  >
                    {catKey.replace(/_/g, ' ')} ({count})
                  </button>
                );
              })}
            </div>
          ) : null}
        </NexusPanel>
      ) : null}

      {/* Filter & Search Matrix */}
      <NexusPanel padding="sm">
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
          <Filter className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
          <span>Rule Query Filters</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <label htmlFor="kb-search" className="sr-only">
              Search rules by ID, name, or explanation
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6B7D]"
              aria-hidden="true"
            />
            <input
              id="kb-search"
              type="text"
              placeholder="Search rule ID, name, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="nexus-input pl-9 text-xs font-mono"
            />
          </div>

          <div>
            <label htmlFor="kb-category" className="sr-only">
              Filter by diagnostic domain
            </label>
            <select
              id="kb-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="nexus-input text-xs font-mono cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="kb-vehicle-type" className="sr-only">
              Filter by vehicle platform
            </label>
            <select
              id="kb-vehicle-type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="nexus-input text-xs font-mono cursor-pointer"
            >
              <option value="">All Vehicle Platforms</option>
              <option value="motorcycle">Motorcycle Rules</option>
              <option value="car">Car / Automobile Rules</option>
            </select>
          </div>

          <div>
            <label htmlFor="kb-severity" className="sr-only">
              Filter by severity level
            </label>
            <select
              id="kb-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="nexus-input text-xs font-mono cursor-pointer"
            >
              <option value="">All Severity Levels</option>
              <option value="low">Severity: Low</option>
              <option value="medium">Severity: Medium</option>
              <option value="high">Severity: High</option>
              <option value="critical">Severity: Critical</option>
            </select>
          </div>
        </div>
      </NexusPanel>

      {/* Error State */}
      {error ? (
        <NexusPanel variant="critical" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#FFC2CD]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <HudButton variant="secondary" size="sm" onClick={() => setReloadTick((t) => t + 1)}>
              Retry
            </HudButton>
          </div>
        </NexusPanel>
      ) : null}

      {/* Rules List */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading rules">
          {[1, 2, 3].map((idx) => (
            <NexusPanel key={idx} padding="md" className="animate-pulse space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-48 rounded bg-white/[0.06]" />
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
              </div>
              <div className="h-3 w-full rounded bg-white/[0.04]" />
              <div className="h-16 w-full rounded bg-white/[0.03]" />
            </NexusPanel>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <NexusPanel padding="lg" className="text-center space-y-3">
          <BookOpen className="mx-auto h-10 w-10 text-[#5E6B7D]" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
              No Matching Production Rules Found
            </h3>
            <p className="text-xs text-[#8B96A5]">
              Adjust your domain, vehicle platform, severity, or search filters to view rules.
            </p>
          </div>
          {hasActiveFilters ? (
            <HudButton variant="outline" size="sm" icon={RotateCcw} onClick={clearFilters}>
              Clear All Filters
            </HudButton>
          ) : null}
        </NexusPanel>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const isCritical = Boolean(rule.safety_critical);
            const severityVariant = SEVERITY_BADGE_MAP[rule.severity] || 'neutral';
            const applicability = rule.vehicle_applicability || {};

            return (
              <NexusPanel
                key={rule.rule_id}
                variant={isCritical ? 'critical' : 'default'}
                interactive
                padding="md"
                className={`space-y-4 ${isCritical ? 'border-l-4 border-l-[#FF3B5C]' : ''}`}
              >
                {/* Header & Conflict Resolution Metadata */}
                <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-[#00D9FF]/35 bg-[#08242E] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#00D9FF]">
                        {rule.rule_id}
                      </span>
                      <TelemetryBadge variant="neutral">
                        {CATEGORY_LABELS[rule.category] || rule.category.replace(/_/g, ' ')}
                      </TelemetryBadge>
                      {isCritical ? (
                        <TelemetryBadge variant="critical" dot pulse icon={ShieldAlert}>
                          SAFETY CRITICAL INTERLOCK
                        </TelemetryBadge>
                      ) : null}
                      {!rule.conclusion ? (
                        <TelemetryBadge variant="attention" icon={Cpu}>
                          INTERMEDIATE CHAINING RULE
                        </TelemetryBadge>
                      ) : null}
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#E8EDF3] sm:text-lg">
                      {rule.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <TelemetryBadge variant="neutral">
                      SPECIFICITY: {rule.conditions?.length || 0}
                    </TelemetryBadge>
                    <TelemetryBadge variant="neutral">
                      PRIORITY: {rule.priority}
                    </TelemetryBadge>
                    <TelemetryBadge variant={severityVariant} dot>
                      SEVERITY: {rule.severity}
                    </TelemetryBadge>
                  </div>
                </div>

                {/* Vehicle Applicability Matrix */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#5E6B7D]">
                    APPLICABILITY:
                  </span>
                  <span className="rounded border border-white/[0.08] bg-[#0B0F15] px-2 py-0.5 font-mono text-[11px] text-[#E8EDF3]">
                    platform: {formatApplicabilityList(applicability.vehicle_types)}
                  </span>
                  <span className="rounded border border-white/[0.08] bg-[#0B0F15] px-2 py-0.5 font-mono text-[11px] text-[#8B96A5]">
                    cooling: {formatApplicabilityList(applicability.cooling_types)}
                  </span>
                  <span className="rounded border border-white/[0.08] bg-[#0B0F15] px-2 py-0.5 font-mono text-[11px] text-[#8B96A5]">
                    fuel: {formatApplicabilityList(applicability.fuel_types)}
                  </span>
                </div>

                {/* Structured IF -> THEN Rule Pipeline */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
                  {/* IF Premises */}
                  <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 lg:col-span-6 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00D9FF]">
                        IF (3VL Premises — All Required)
                      </span>
                      <span className="font-mono text-[10px] text-[#5E6B7D]">
                        {rule.conditions?.length || 0} condition(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(rule.conditions || []).map((cond, idx) => (
                        <div
                          key={`${rule.rule_id}-cond-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded border border-white/[0.1] bg-[#10151D] px-2.5 py-1 font-mono text-xs text-[#E8EDF3]"
                        >
                          <span>{cond.fact}</span>
                          <span className="font-semibold text-[#00D9FF]">{cond.operator}</span>
                          <span className="text-[#C7FF4A]">{String(cond.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flow Connector */}
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00D9FF]/30 bg-[#08242E] text-[#00D9FF]">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  {/* THEN Derived Facts / Conclusion */}
                  <div className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 lg:col-span-5 space-y-2.5">
                    <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C7FF4A]">
                      THEN (Assertions &amp; Diagnosis)
                    </span>

                    {rule.derived_facts?.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          Derived Working Memory Facts
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rule.derived_facts.map((df, idx) => (
                            <span
                              key={`${rule.rule_id}-df-${idx}`}
                              className="rounded border border-[#C7FF4A]/35 bg-[#17240A] px-2.5 py-1 font-mono text-xs text-[#C7FF4A]"
                            >
                              +{df.fact} = {String(df.value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {rule.conclusion ? (
                      <div className="rounded border border-white/[0.09] bg-[#151C26] p-2.5 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#FBBF24]">
                            {rule.conclusion.is_final_diagnosis === false
                              ? 'Intermediate Diagnosis'
                              : 'Final Diagnostic Conclusion'}
                          </span>
                          <code className="rounded bg-[#0A0E13] px-1.5 py-0.5 font-mono text-[10px] text-[#00D9FF]">
                            {rule.conclusion.fault_id}
                          </code>
                        </div>
                        <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                          {rule.conclusion.title}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Explanation, Recommended Action & Preventive Maintenance */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-white/[0.07] bg-[#0B0F15] p-3.5 space-y-1">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                      Explanation Template
                    </span>
                    <p className="text-xs leading-relaxed text-[#E8EDF3]">
                      {rule.explanation_template}
                    </p>
                  </div>

                  <div className="rounded-md border border-white/[0.07] bg-[#0B0F15] p-3.5 space-y-2">
                    <div className="space-y-1">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
                        Recommended Action
                      </span>
                      <p className="text-xs leading-relaxed text-[#E8EDF3]">
                        {rule.recommended_action}
                      </p>
                    </div>
                    {rule.preventive_maintenance ? (
                      <div className="border-t border-white/[0.06] pt-2 space-y-1">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#C7FF4A]">
                          <Wrench className="h-3 w-3" aria-hidden="true" />
                          Preventive Maintenance
                        </span>
                        <p className="text-xs leading-relaxed text-[#8B96A5]">
                          {rule.preventive_maintenance}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </NexusPanel>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
