import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  Save,
  Server,
  Settings as SettingsIcon,
  Sliders,
} from 'lucide-react';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const PLAYBACK_PRESETS = [250, 500, 1000, 1500, 2500];

const ENGINE_SPECS = [
  {
    label: 'Symbolic Core Package',
    value: 'autoexpert_engine 1.0.0',
    detail: 'Python 3.11.9 · Pydantic 2.14.4 · JSON Schema Draft-07 (jsonschema 4.26.0)',
    badge: 'PURE SYMBOLIC · ZERO LLM',
    variant: 'lime',
  },
  {
    label: 'Validated Knowledge Base',
    value: '55 JSON Rules · 15 Safety-Critical',
    detail:
      '20 motorcycle, 20 car, 15 maintenance rules (49 fault conclusions + 6 chaining rules across 8 categories)',
    badge: 'SCHEMA VALIDATED',
    variant: 'cyan',
  },
  {
    label: 'Inference & Conflict Engine',
    value: '3-Valued Logic + 5-Tier Conflict Resolution',
    detail:
      'Working memory (TRUE / FALSE / UNKNOWN) · Refraction -> Safety -> Specificity -> Priority -> Rule ID · Cycle-safe Backward Chaining',
    badge: 'DETERMINISTIC',
    variant: 'neutral',
  },
  {
    label: 'API Transport & PDF Export',
    value: 'FastAPI 0.165.0 + Uvicorn 0.54.0',
    detail: 'ReportLab 5.1.0 certified PDF dossier generation & OpenAPI (/docs) specification',
    badge: 'REST + PDF',
    variant: 'cyan',
  },
  {
    label: 'Database & Persistence Layer',
    value: 'SQLite + SQLAlchemy 2.1.9 (7 Tables)',
    detail:
      'vehicles, diagnostic_sessions, session_facts, diagnostic_reports, maintenance_records, maintenance_reminders, user_preferences',
    badge: 'LOCAL AUDIT STORE',
    variant: 'neutral',
  },
];

export default function Settings() {
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [pressureUnit, setPressureUnit] = useState('psi');
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getSettings()
      .then((data) => {
        if (!active || !data) return;
        setDistanceUnit(data.distance_unit || 'km');
        setPressureUnit(data.pressure_unit || 'psi');
        setPlaybackSpeed(
          typeof data.default_demo_playback_ms === 'number'
            ? data.default_demo_playback_ms
            : 500
        );
        setUpdatedAt(data.updated_at || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load saved telemetry preferences.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const numericSpeed = Math.max(200, Math.min(3000, Number(playbackSpeed) || 500));
    setPlaybackSpeed(numericSpeed);
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const updated = await api.updateSettings({
        distance_unit: distanceUnit,
        pressure_unit: pressureUnit,
        default_demo_playback_ms: numericSpeed,
      });
      setUpdatedAt(updated?.updated_at || new Date().toISOString());
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to commit preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="CFG_10"
        eyebrow="TELEMETRY & ENGINE CALIBRATION"
        title="System Preferences & Runtime Specs"
        description="Configure persistent distance/pressure measurement units and TraceViewer playback chronometry stored in SQLite user_preferences."
        icon={SettingsIcon}
        actions={
          updatedAt ? (
            <TelemetryBadge variant="neutral">
              LAST SAVED: {updatedAt.slice(0, 19).replace('T', ' ')}
            </TelemetryBadge>
          ) : null
        }
      />

      {saved ? (
        <div
          role="status"
          className="rounded-md border border-[#C7FF4A]/40 bg-[#17240A] px-4 py-3 flex items-center gap-2.5 text-xs font-mono text-[#C7FF4A]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Preferences committed to SQLite: {distanceUnit.toUpperCase()} ·{' '}
            {pressureUnit.toUpperCase()} · {playbackSpeed} ms/step
          </span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[#FF3B5C]/45 bg-[#290D16] px-4 py-3 flex items-center gap-2.5 text-xs text-[#FFC2CD]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Preferences Form */}
        <div className="lg:col-span-6">
          <NexusPanel
            code="CALIBRATION"
            title="Measurement & Trace Playback"
            subtitle="Changes persist via GET / PUT /api/settings across Reports, Fleet, and Inference Lab."
            padding="md"
          >
            {loading ? (
              <div className="space-y-4 py-4 animate-pulse" aria-busy="true">
                <div className="h-14 rounded bg-white/[0.05]" />
                <div className="h-14 rounded bg-white/[0.05]" />
                <div className="h-14 rounded bg-white/[0.05]" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Distance Unit */}
                <fieldset className="space-y-2">
                  <legend className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                    Odometer Distance Unit
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'km', title: 'Kilometers (km)', sub: 'Metric standard' },
                      { value: 'mi', title: 'Miles (mi)', sub: 'Imperial conversion' },
                    ].map((opt) => {
                      const active = distanceUnit === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDistanceUnit(opt.value)}
                          aria-pressed={active}
                          className={`rounded-md border p-3.5 text-left transition-all nexus-focus ${
                            active
                              ? 'border-[#00D9FF]/65 bg-[#08242E] shadow-nexus-cyan'
                              : 'border-white/[0.08] bg-[#0B0F15] hover:border-white/[0.18]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                              {opt.title}
                            </span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                active ? 'bg-[#00D9FF]' : 'bg-white/[0.15]'
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="mt-1 block font-mono text-[11px] text-[#8B96A5]">
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Pressure Unit */}
                <fieldset className="space-y-2">
                  <legend className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                    Hydraulic &amp; Tyre Pressure Unit
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'psi', title: 'PSI (lb/in²)', sub: 'Standard workshop gauge' },
                      { value: 'bar', title: 'BAR (Metric)', sub: '1 bar ≈ 14.504 psi' },
                    ].map((opt) => {
                      const active = pressureUnit === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPressureUnit(opt.value)}
                          aria-pressed={active}
                          className={`rounded-md border p-3.5 text-left transition-all nexus-focus ${
                            active
                              ? 'border-[#00D9FF]/65 bg-[#08242E] shadow-nexus-cyan'
                              : 'border-white/[0.08] bg-[#0B0F15] hover:border-white/[0.18]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                              {opt.title}
                            </span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                active ? 'bg-[#00D9FF]' : 'bg-white/[0.15]'
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="mt-1 block font-mono text-[11px] text-[#8B96A5]">
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Playback Speed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="settings-playback-ms"
                      className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      <Sliders className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
                      TraceViewer Playback Interval (200–3000 ms)
                    </label>
                    <TelemetryBadge variant="lime">{playbackSpeed} MS / STEP</TelemetryBadge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                    <input
                      type="range"
                      min={200}
                      max={3000}
                      step={50}
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      aria-label="TraceViewer Playback Interval Slider"
                      className="sm:col-span-2 accent-[#00D9FF] cursor-pointer"
                    />
                    <input
                      id="settings-playback-ms"
                      type="number"
                      min={200}
                      max={3000}
                      step={50}
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="nexus-input py-2 font-mono text-xs text-center"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PLAYBACK_PRESETS.map((ms) => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => setPlaybackSpeed(ms)}
                        className={`rounded border px-2 py-0.5 font-mono text-[11px] transition-colors nexus-focus ${
                          playbackSpeed === ms
                            ? 'border-[#00D9FF]/55 bg-[#08242E] text-[#00D9FF]'
                            : 'border-white/[0.08] bg-[#0B0F15] text-[#8B96A5] hover:text-[#E8EDF3]'
                        }`}
                      >
                        {ms} ms
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/[0.07] pt-4">
                  <HudButton
                    type="submit"
                    variant="lime"
                    icon={Save}
                    loading={saving}
                  >
                    Save Preferences
                  </HudButton>
                </div>
              </form>
            )}
          </NexusPanel>
        </div>

        {/* Ground-Truth Hardware & Engine Specifications */}
        <div className="lg:col-span-6">
          <NexusPanel
            code="SYS_SPECS"
            title="Hardware & Engine Specifications"
            subtitle="Verified runtime architecture of the AutoExpert deterministic expert system."
            padding="md"
            className="space-y-4"
          >
            <div className="rounded-md border border-[#00D9FF]/25 bg-[#08242E]/45 p-3.5 text-xs leading-relaxed text-[#E8EDF3]">
              AutoExpert is a pure symbolic, deterministic expert system packaged as{' '}
              <code className="text-[#00D9FF]">autoexpert_engine 1.0.0</code>. Zero external LLM
              APIs, zero probabilistic weights, and zero heuristic bypasses.
            </div>

            <div className="space-y-2.5">
              {ENGINE_SPECS.map((spec, idx) => {
                const Icon =
                  idx === 0
                    ? Cpu
                    : idx === 1
                      ? FileText
                      : idx === 3
                        ? Server
                        : idx === 4
                          ? Database
                          : SettingsIcon;

                return (
                  <div
                    key={spec.label}
                    className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                        <Icon className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
                        {spec.label}
                      </span>
                      <TelemetryBadge variant={spec.variant} size="sm">
                        {spec.badge}
                      </TelemetryBadge>
                    </div>
                    <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                      {spec.value}
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed text-[#8B96A5]">
                      {spec.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </NexusPanel>
        </div>
      </div>
    </PageTransition>
  );
}
