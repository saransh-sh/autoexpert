import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Gauge,
  GitCompare,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import EvidenceScoreBadge from '../components/EvidenceScoreBadge';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';
import { api } from '../services/api';

const KM_TO_MI = 0.621371;

const SEVERITY_VARIANT = {
  critical: 'critical',
  high: 'warning',
  medium: 'cyan',
  low: 'lime',
};

function convertKm(kmValue, unit) {
  if (kmValue === null || kmValue === undefined || Number.isNaN(Number(kmValue))) {
    return null;
  }
  const numeric = Number(kmValue);
  return unit === 'mi' ? Math.round(numeric * KM_TO_MI) : Math.round(numeric);
}

function formatDistance(kmValue, unit) {
  const val = convertKm(kmValue, unit);
  if (val === null) return 'N/A';
  return `${val.toLocaleString()} ${unit}`;
}

function formatSignedDelta(deltaKm, unit) {
  const val = convertKm(deltaKm ?? 0, unit);
  if (val === null || val === 0) return `0 ${unit}`;
  const sign = val > 0 ? '+' : '-';
  return `${sign}${Math.abs(val).toLocaleString()} ${unit}`;
}

function formatSeverityLabel(sev) {
  return (sev || 'low').toUpperCase();
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState('');

  const [distanceUnit, setDistanceUnit] = useState('km');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTraceDetails, setShowTraceDetails] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getSettings()
      .then((prefs) => {
        if (active && prefs?.distance_unit) {
          setDistanceUnit(prefs.distance_unit);
        }
      })
      .catch(() => {
        // Default to km if settings endpoint is unavailable
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const loadData = async () => {
      try {
        const [vList, repList] = await Promise.all([
          api.getVehicles(),
          api.getReports(selectedVehicleId ? { vehicle_id: selectedVehicleId } : {}),
        ]);

        if (!active) return;

        const safeVehicles = Array.isArray(vList) ? vList : [];
        const safeReports = Array.isArray(repList) ? repList : [];

        setVehicles(safeVehicles);
        setReports(safeReports);

        // Bug #8 guard: never retain a stale report outside the active filtered report list
        setSelectedReport((prev) => {
          if (safeReports.length === 0) return null;
          if (prev) {
            const match = safeReports.find((item) => item.id === prev.id);
            if (match) return match;
          }
          return safeReports[0];
        });

        setCompareA((prev) =>
          safeReports.some((r) => String(r.id) === String(prev)) ? prev : ''
        );
        setCompareB((prev) =>
          safeReports.some((r) => String(r.id) === String(prev)) ? prev : ''
        );
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load diagnostic audit reports.');
        setReports([]);
        setSelectedReport(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [selectedVehicleId]);

  const vehiclesById = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [vehicles]);

  const handleVehicleFilterChange = (newVehicleId) => {
    // Fix Bug #8: clear stale selectedReport & active diff immediately when vehicle filter changes
    setSelectedReport(null);
    setCompareA('');
    setCompareB('');
    setCompareResult(null);
    setCompareError('');
    setSelectedVehicleId(newVehicleId);
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    setComparing(true);
    setCompareError('');
    try {
      const res = await api.compareReports(compareA, compareB);
      setCompareResult(res);
    } catch (err) {
      setCompareError(err.message || 'Unable to compare selected diagnostic reports.');
    } finally {
      setComparing(false);
    }
  };

  const getVehicleLabel = (vehicleId) => {
    if (!vehicleId) return 'Generic Session (No Assigned Vehicle)';
    const v = vehiclesById[vehicleId];
    if (!v) return `Vehicle #${vehicleId}`;
    return `${v.year} ${v.manufacturer} ${v.model}${v.registration_no ? ` · ${v.registration_no}` : ''}`;
  };

  const explanationData = selectedReport?.explanation || {};
  const inferenceChain = Array.isArray(explanationData.inference_chain)
    ? explanationData.inference_chain
    : [];
  const howExplanations = Array.isArray(explanationData.how_explanations)
    ? explanationData.how_explanations
    : [];
  const conflictResolutions = Array.isArray(explanationData.conflict_resolutions)
    ? explanationData.conflict_resolutions
    : [];
  const wmFacts = Array.isArray(explanationData.initial_and_derived_facts)
    ? explanationData.initial_and_derived_facts
    : [];
  const hasExplanationTrace =
    inferenceChain.length > 0 ||
    howExplanations.length > 0 ||
    wmFacts.length > 0 ||
    Boolean(explanationData.total_rules_triggered);

  const severityParts = compareResult?.comparison?.severity_change
    ? compareResult.comparison.severity_change.split('->').map((s) => s.trim())
    : [];

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="AUD_04"
        eyebrow="IMMUTABLE AUDIT TRAIL"
        title="Diagnostic Reports & Progression Diff"
        description="Inspect persisted inference dossiers, reasoning traces, preventive service guidance, and multi-report delta progression with ReportLab PDF export."
        icon={FileText}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <TelemetryBadge variant="neutral">
              UNIT: {distanceUnit.toUpperCase()}
            </TelemetryBadge>
            <div className="min-w-[230px]">
              <label htmlFor="reports-vehicle-filter" className="sr-only">
                Filter diagnostic reports by vehicle
              </label>
              <select
                id="reports-vehicle-filter"
                value={selectedVehicleId}
                onChange={(e) => handleVehicleFilterChange(e.target.value)}
                className="nexus-input py-2 text-xs font-mono cursor-pointer"
              >
                <option value="">All Fleet Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.manufacturer} {v.model} ({v.registration_no || 'No Reg'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {error ? (
        <NexusPanel variant="critical" padding="md">
          <div className="flex items-center gap-2.5 text-sm text-[#FFC2CD]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
            <span>{error}</span>
          </div>
        </NexusPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Saved Reports List */}
        <div className="lg:col-span-4">
          <NexusPanel
            code="ARCHIVE"
            title="Saved Diagnostic Reports"
            headerAction={
              <TelemetryBadge variant="cyan">{reports.length} SAVED</TelemetryBadge>
            }
            padding="sm"
          >
            {loading ? (
              <div className="space-y-2.5 py-2" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-md border border-white/[0.06] bg-[#0B0F15] animate-pulse"
                  />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="mx-auto h-8 w-8 text-[#5E6B7D]" aria-hidden="true" />
                <p className="font-mono text-xs uppercase tracking-wider text-[#8B96A5]">
                  No reports found for this filter
                </p>
              </div>
            ) : (
              <div className="max-h-[640px] space-y-2.5 overflow-y-auto pr-1">
                {reports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  const sevVariant = report.safety_warning_triggered
                    ? 'critical'
                    : SEVERITY_VARIANT[report.highest_severity] || 'neutral';

                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => {
                        setSelectedReport(report);
                        setCompareResult(null);
                      }}
                      className={`w-full text-left rounded-md border p-3.5 transition-all nexus-focus ${
                        isSelected
                          ? 'border-[#00D9FF]/60 bg-[#08242E]/70 shadow-nexus-cyan'
                          : 'border-white/[0.08] bg-[#0B0F15] hover:border-white/[0.18] hover:bg-[#151C26]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block font-mono text-xs font-semibold text-[#E8EDF3]">
                            {report.report_code}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#8B96A5]">
                            {getVehicleLabel(report.vehicle_id)}
                          </span>
                        </div>
                        <TelemetryBadge
                          variant={sevVariant}
                          dot
                          pulse={Boolean(report.safety_warning_triggered)}
                        >
                          {report.safety_warning_triggered
                            ? 'CRITICAL'
                            : formatSeverityLabel(report.highest_severity)}
                        </TelemetryBadge>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 font-mono text-[11px] text-[#8B96A5]">
                        <span className="uppercase">
                          {report.category?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#00D9FF]">
                          {report.conclusions?.length || 0} fault(s)
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[#5E6B7D]">
                        <span>{report.created_at?.slice(0, 10) || '—'}</span>
                        <span>
                          {report.odometer_at_diagnosis != null
                            ? formatDistance(report.odometer_at_diagnosis, distanceUnit)
                            : 'No Odo'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </NexusPanel>
        </div>

        {/* Right Workspace: Progression Diff + Selected Report Detail */}
        <div className="space-y-6 lg:col-span-8">
          {/* Side-by-Side Comparison Engine */}
          <NexusPanel
            code="DELTA_ENGINE"
            title="Report A vs Report B Progression Diff"
            subtitle="Compare fault emergence, resolution, odometer delta, and severity transitions across two reports."
            padding="md"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="compare-report-a" className="sr-only">
                  Baseline Report A
                </label>
                <select
                  id="compare-report-a"
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="nexus-input text-xs font-mono cursor-pointer"
                >
                  <option value="">Baseline Report A</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.report_code} ({r.created_at?.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="compare-report-b" className="sr-only">
                  Target Report B
                </label>
                <select
                  id="compare-report-b"
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="nexus-input text-xs font-mono cursor-pointer"
                >
                  <option value="">Target Report B</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.report_code} ({r.created_at?.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              <HudButton
                variant="primary"
                icon={GitCompare}
                loading={comparing}
                disabled={!compareA || !compareB}
                onClick={handleCompare}
                className="w-full"
              >
                Compare Reports
              </HudButton>
            </div>

            {compareError ? (
              <div className="mt-3 rounded border border-[#FF3B5C]/40 bg-[#290D16] px-3 py-2 text-xs text-[#FFC2CD]">
                {compareError}
              </div>
            ) : null}

            {compareResult ? (
              <div className="mt-4 space-y-4 rounded-md border border-white/[0.08] bg-[#0A0E13] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="rounded bg-[#151C26] px-2 py-0.5 text-[#E8EDF3]">
                      A: {compareResult.report_a?.report_code}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#5E6B7D]" aria-hidden="true" />
                    <span className="rounded bg-[#151C26] px-2 py-0.5 text-[#E8EDF3]">
                      B: {compareResult.report_b?.report_code}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <TelemetryBadge variant="cyan" icon={Gauge}>
                      ODOMETER DELTA:{' '}
                      {formatSignedDelta(
                        compareResult.comparison?.odometer_delta_km,
                        distanceUnit
                      )}
                    </TelemetryBadge>

                    {severityParts.length === 2 ? (
                      <div className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] bg-[#10151D] px-2.5 py-1 font-mono text-[11px]">
                        <span className="text-[#8B96A5]">SEVERITY:</span>
                        <TelemetryBadge
                          variant={SEVERITY_VARIANT[severityParts[0]] || 'neutral'}
                          size="sm"
                        >
                          {severityParts[0]}
                        </TelemetryBadge>
                        <ArrowRight className="h-3 w-3 text-[#5E6B7D]" aria-hidden="true" />
                        <TelemetryBadge
                          variant={SEVERITY_VARIANT[severityParts[1]] || 'neutral'}
                          size="sm"
                        >
                          {severityParts[1]}
                        </TelemetryBadge>
                      </div>
                    ) : compareResult.comparison?.severity_change ? (
                      <TelemetryBadge variant="neutral">
                        SEVERITY: {compareResult.comparison.severity_change}
                      </TelemetryBadge>
                    ) : null}
                  </div>
                </div>

                {/* Side-by-side Snapshot Summary */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded border border-white/[0.07] bg-[#10151D] p-3 space-y-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                      Baseline Report A · {compareResult.report_a?.report_code}
                    </div>
                    <div className="text-[#E8EDF3] font-medium">
                      {getVehicleLabel(compareResult.report_a?.vehicle_id)}
                    </div>
                    <div className="font-mono text-[11px] text-[#8B96A5]">
                      {compareResult.report_a?.created_at?.slice(0, 19).replace('T', ' ')} ·{' '}
                      {formatDistance(compareResult.report_a?.odometer_at_diagnosis, distanceUnit)} ·{' '}
                      {compareResult.report_a?.conclusions?.length || 0} fault(s)
                    </div>
                  </div>
                  <div className="rounded border border-white/[0.07] bg-[#10151D] p-3 space-y-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
                      Target Report B · {compareResult.report_b?.report_code}
                    </div>
                    <div className="text-[#E8EDF3] font-medium">
                      {getVehicleLabel(compareResult.report_b?.vehicle_id)}
                    </div>
                    <div className="font-mono text-[11px] text-[#8B96A5]">
                      {compareResult.report_b?.created_at?.slice(0, 19).replace('T', ' ')} ·{' '}
                      {formatDistance(compareResult.report_b?.odometer_at_diagnosis, distanceUnit)} ·{' '}
                      {compareResult.report_b?.conclusions?.length || 0} fault(s)
                    </div>
                  </div>
                </div>

                {/* Fault Diff Buckets */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded border border-white/[0.08] bg-[#10151D] p-3 space-y-1.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                      Persistent / Common Faults
                    </span>
                    <div className="font-mono text-xs text-[#E8EDF3] break-words">
                      {compareResult.comparison?.common_faults?.length > 0
                        ? compareResult.comparison.common_faults.join(', ')
                        : 'None'}
                    </div>
                  </div>

                  <div className="rounded border border-[#C7FF4A]/25 bg-[#17240A]/50 p-3 space-y-1.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[#C7FF4A]">
                      Resolved / Absent in B
                    </span>
                    <div className="font-mono text-xs text-[#C7FF4A] break-words">
                      {compareResult.comparison?.resolved_or_absent_in_b?.length > 0
                        ? compareResult.comparison.resolved_or_absent_in_b.join(', ')
                        : 'None'}
                    </div>
                  </div>

                  <div className="rounded border border-[#FF3B5C]/30 bg-[#290D16]/60 p-3 space-y-1.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[#FF6B84]">
                      New Faults in B
                    </span>
                    <div className="font-mono text-xs text-[#FF8FA3] break-words">
                      {compareResult.comparison?.new_faults_in_b?.length > 0
                        ? compareResult.comparison.new_faults_in_b.join(', ')
                        : 'None'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </NexusPanel>

          {/* Selected Report Full Dossier */}
          {!loading && !selectedReport ? (
            <NexusPanel padding="lg" className="text-center space-y-2">
              <FileText className="mx-auto h-9 w-9 text-[#5E6B7D]" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
                No Diagnostic Report Selected
              </h3>
              <p className="text-xs text-[#8B96A5]">
                {reports.length === 0
                  ? 'No reports match the current vehicle selection. Run a diagnostic session to generate an audit record.'
                  : 'Select a saved diagnostic dossier from the archive list to inspect conclusions and reasoning trace.'}
              </p>
            </NexusPanel>
          ) : null}

          {selectedReport ? (
            <NexusPanel
              variant={selectedReport.safety_warning_triggered ? 'critical' : 'elevated'}
              padding="md"
              className="space-y-6"
            >
              {/* Report Header */}
              <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#00D9FF]/35 bg-[#08242E] px-2.5 py-0.5 font-mono text-sm font-semibold text-[#00D9FF]">
                      {selectedReport.report_code}
                    </span>
                    <TelemetryBadge variant="neutral">
                      {selectedReport.category?.replace(/_/g, ' ')}
                    </TelemetryBadge>
                    <TelemetryBadge
                      variant={
                        selectedReport.safety_warning_triggered
                          ? 'critical'
                          : SEVERITY_VARIANT[selectedReport.highest_severity] || 'neutral'
                      }
                      dot
                      pulse={Boolean(selectedReport.safety_warning_triggered)}
                    >
                      {selectedReport.safety_warning_triggered
                        ? 'SAFETY ESCALATION'
                        : `MAX SEVERITY: ${formatSeverityLabel(selectedReport.highest_severity)}`}
                    </TelemetryBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8B96A5]">
                    <span className="font-medium text-[#E8EDF3]">
                      {getVehicleLabel(selectedReport.vehicle_id)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-[#5E6B7D]" aria-hidden="true" />
                      {selectedReport.created_at?.slice(0, 19).replace('T', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <Gauge className="h-3.5 w-3.5 text-[#5E6B7D]" aria-hidden="true" />
                      {selectedReport.odometer_at_diagnosis != null
                        ? formatDistance(selectedReport.odometer_at_diagnosis, distanceUnit)
                        : 'Odometer not recorded'}
                    </span>
                  </div>
                </div>

                <HudButton
                  href={api.downloadReportPdfUrl(selectedReport.id)}
                  download
                  variant="primary"
                  size="sm"
                  icon={Download}
                  className="shrink-0"
                >
                  Download PDF Dossier
                </HudButton>
              </div>

              {/* Safety Alert Banner */}
              {selectedReport.safety_warning_triggered ? (
                <div
                  role="alert"
                  className="rounded-md border border-[#FF3B5C]/45 border-l-4 border-l-[#FF3B5C] bg-[#190B10] p-4 flex items-start gap-3"
                >
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
                  <div className="space-y-1">
                    <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                      Critical Hazard Interrupt Triggered During Evaluation
                    </div>
                    <p className="text-xs leading-relaxed text-[#FFC2CD]">
                      Safety interlock conditions were satisfied in this diagnostic session. Verify
                      all critical findings with a certified mechanic before operating the vehicle.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Diagnostic Conclusions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#8B96A5]">
                    Diagnostic Conclusions ({selectedReport.conclusions?.length || 0})
                  </h3>
                </div>

                {!selectedReport.conclusions || selectedReport.conclusions.length === 0 ? (
                  <div className="rounded-md border border-white/[0.07] bg-[#0A0E13] p-5 text-xs text-[#8B96A5]">
                    No fault rules were concluded from the asserted observations in this session.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedReport.conclusions.map((c, idx) => (
                      <div
                        key={`${c.fault_id || c.rule_id}-${idx}`}
                        className="rounded-md border border-white/[0.08] bg-[#0A0E13] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {c.rule_id ? (
                                <span className="rounded border border-white/[0.1] bg-[#151C26] px-2 py-0.5 font-mono text-[11px] text-[#00D9FF]">
                                  {c.rule_id}
                                </span>
                              ) : null}
                              {c.fault_id ? (
                                <span className="font-mono text-[11px] text-[#8B96A5]">
                                  {c.fault_id}
                                </span>
                              ) : null}
                              {c.pass_number ? (
                                <span className="font-mono text-[11px] text-[#5E6B7D]">
                                  Pass {c.pass_number}
                                </span>
                              ) : null}
                              {c.safety_critical ? (
                                <TelemetryBadge variant="critical" size="sm">
                                  SAFETY CRITICAL
                                </TelemetryBadge>
                              ) : null}
                            </div>
                            <h4 className="font-display text-base font-semibold text-[#E8EDF3]">
                              {c.title}
                            </h4>
                          </div>
                          <EvidenceScoreBadge score={c.evidence_match_score} />
                        </div>

                        <p className="text-xs leading-relaxed text-[#E8EDF3]/90">
                          {c.explanation}
                        </p>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded border border-[#00D9FF]/25 bg-[#08242E]/40 p-3 space-y-1">
                            <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
                              Recommended Action
                            </span>
                            <p className="text-xs leading-relaxed text-[#E8EDF3]">
                              {c.recommended_action}
                            </p>
                          </div>

                          {c.preventive_maintenance ? (
                            <div className="rounded border border-[#C7FF4A]/25 bg-[#17240A]/40 p-3 space-y-1">
                              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#C7FF4A]">
                                <Wrench className="h-3 w-3" aria-hidden="true" />
                                Preventive Maintenance
                              </span>
                              <p className="text-xs leading-relaxed text-[#E8EDF3]">
                                {c.preventive_maintenance}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Symbolic Reasoning Trace (explanation.inference_chain / how_explanations) */}
              {hasExplanationTrace ? (
                <div className="border-t border-white/[0.08] pt-5 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowTraceDetails((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-[#0B0F15] px-4 py-3 text-left transition-colors hover:border-white/[0.16] nexus-focus"
                    aria-expanded={showTraceDetails}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      {showTraceDetails ? (
                        <ChevronDown className="h-4 w-4 text-[#00D9FF]" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#8B96A5]" aria-hidden="true" />
                      )}
                      <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                        Symbolic Reasoning &amp; Explanation Trace
                      </span>
                      <TelemetryBadge variant="cyan">
                        {explanationData.total_rules_triggered ?? inferenceChain.length} RULES FIRED
                      </TelemetryBadge>
                      {explanationData.total_passes != null ? (
                        <TelemetryBadge variant="neutral">
                          {explanationData.total_passes} PASSES
                        </TelemetryBadge>
                      ) : null}
                      {explanationData.runtime_ms != null ? (
                        <TelemetryBadge variant="lime">
                          {explanationData.runtime_ms} MS
                        </TelemetryBadge>
                      ) : null}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                      {showTraceDetails ? 'Collapse' : 'Expand'}
                    </span>
                  </button>

                  {showTraceDetails ? (
                    <div className="space-y-4">
                      {/* Multi-hop Inference Chain */}
                      {inferenceChain.length > 0 ? (
                        <div className="space-y-2.5">
                          <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                            Inference Chain ({inferenceChain.length} Step(s))
                          </h4>
                          <div className="space-y-2.5">
                            {inferenceChain.map((step, idx) => (
                              <div
                                key={`${step.rule_id}-${idx}`}
                                className="rounded-md border border-white/[0.07] bg-[#0A0E13] p-3.5 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-[#08242E] border border-[#00D9FF]/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#00D9FF]">
                                      PASS {String(step.pass_number).padStart(2, '0')}
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-[#E8EDF3]">
                                      {step.rule_id}
                                    </span>
                                    <span className="text-xs text-[#8B96A5]">
                                      — {step.rule_name}
                                    </span>
                                  </div>
                                  {step.conclusion ? (
                                    <TelemetryBadge variant="amber">
                                      CONCLUDED: {step.conclusion}
                                    </TelemetryBadge>
                                  ) : null}
                                </div>

                                {step.premise ? (
                                  <div className="rounded border border-white/[0.05] bg-[#10151D] px-3 py-2 font-mono text-[11px] text-[#E8EDF3]">
                                    <span className="text-[#5E6B7D]">IF </span>
                                    {step.premise}
                                  </div>
                                ) : null}

                                {Array.isArray(step.derived_facts) && step.derived_facts.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[10px] uppercase text-[#8B96A5]">
                                      Derived:
                                    </span>
                                    {step.derived_facts.map((df) => (
                                      <span
                                        key={df}
                                        className="rounded border border-[#C7FF4A]/30 bg-[#17240A] px-2 py-0.5 font-mono text-[11px] text-[#C7FF4A]"
                                      >
                                        +{df}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}

                                {step.rationale ? (
                                  <p className="text-xs text-[#8B96A5] leading-relaxed">
                                    {step.rationale}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* How Explanations */}
                      {howExplanations.length > 0 ? (
                        <div className="space-y-2.5">
                          <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                            How-Explanation Audit ({howExplanations.length})
                          </h4>
                          <div className="space-y-2.5">
                            {howExplanations.map((item, idx) => (
                              <div
                                key={`${item.rule_id}-${idx}`}
                                className="rounded-md border border-white/[0.07] bg-[#0A0E13] p-3.5 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-[#00D9FF]">
                                      {item.rule_id}
                                    </span>
                                    <span className="text-xs font-semibold text-[#E8EDF3]">
                                      {item.title}
                                    </span>
                                  </div>
                                  <TelemetryBadge
                                    variant={SEVERITY_VARIANT[item.severity] || 'neutral'}
                                  >
                                    {item.severity}
                                  </TelemetryBadge>
                                </div>
                                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[#8B96A5]">
                                  {item.explanation}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Working Memory Snapshot & Conflict Resolutions */}
                      {wmFacts.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]">
                            Working Memory Provenance ({wmFacts.length} Facts ·{' '}
                            {conflictResolutions.length} Conflict Arbitrations)
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {wmFacts.map((fact, idx) => (
                              <span
                                key={`${fact.key}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] bg-[#0B0F15] px-2.5 py-1 font-mono text-[11px]"
                              >
                                <span className="text-[#E8EDF3]">{fact.key}</span>
                                <span className="text-[#5E6B7D]">=</span>
                                <span className="text-[#00D9FF]">{String(fact.value)}</span>
                                <span className="text-[#5E6B7D]">({fact.provenance})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {explanationData.disclaimer ? (
                        <div className="rounded border border-white/[0.06] bg-[#07090C] p-3 text-[11px] leading-relaxed text-[#8B96A5]">
                          {explanationData.disclaimer}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </NexusPanel>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
