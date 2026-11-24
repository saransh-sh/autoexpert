import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  GitBranch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import TraceViewer from '../components/TraceViewer';
import {
  NexusPanel,
  HudButton,
  TelemetryBadge,
  SectionHeader,
  PageTransition,
} from '../components/ui';

function getProofStatusBadgeVariant(status) {
  switch (status) {
    case 'PROVEN':
      return 'lime';
    case 'DISPROVEN':
      return 'crimson';
    case 'INCONCLUSIVE_MISSING_FACTS':
    default:
      return 'amber';
  }
}

function getProofStatusIcon(status) {
  switch (status) {
    case 'PROVEN':
      return CheckCircle2;
    case 'DISPROVEN':
      return XCircle;
    default:
      return HelpCircle;
  }
}

function ProofTreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  if (!node) return null;

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const StatusIcon = getProofStatusIcon(node.status);
  const statusVariant = getProofStatusBadgeVariant(node.status);

  return (
    <div className={depth > 0 ? 'relative pl-5 border-l border-white/[0.12]' : ''}>
      {depth > 0 ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-4 h-px w-4 bg-white/[0.14]"
        />
      ) : null}

      <div
        className={`rounded-md border p-3.5 space-y-2 transition-colors ${
          node.status === 'PROVEN'
            ? 'border-[#C7FF4A]/30 bg-[#0F170A]'
            : node.status === 'DISPROVEN'
              ? 'border-[#FF3B5C]/35 bg-[#180B10]'
              : 'border-[#F59E0B]/30 bg-[#171208]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={expanded ? 'Collapse branch' : 'Expand branch'}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.12] bg-[#0B0F15] text-[#8B96A5] hover:text-[#E8EDF3]"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white/25 ml-1.5 mr-1" />
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {node.rule_id ? (
                  <TelemetryBadge variant="cyan" size="sm">
                    RULE: {node.rule_id}
                  </TelemetryBadge>
                ) : (
                  <TelemetryBadge variant="neutral" size="sm">
                    {depth === 0 ? 'TARGET GOAL' : 'SUBGOAL / FACT'}
                  </TelemetryBadge>
                )}
                <span className="font-mono text-xs font-semibold text-[#E8EDF3] break-all">
                  {node.rule_name || node.goal}
                </span>
              </div>

              {node.rule_name ? (
                <div className="font-mono text-[11px] text-[#8B96A5]">
                  Goal: {node.goal}
                </div>
              ) : null}
            </div>
          </div>

          <TelemetryBadge
            variant={statusVariant}
            size="sm"
            icon={StatusIcon}
            className="shrink-0"
          >
            {node.status}
          </TelemetryBadge>
        </div>

        {node.details ? (
          <p className="pl-7 font-mono text-[11px] leading-relaxed text-[#C7D0DB]">
            {node.details}
          </p>
        ) : null}

        {Array.isArray(node.missing_facts) &&
        node.missing_facts.length > 0 &&
        !hasChildren ? (
          <div className="pl-7 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase text-[#FBBF24]">
              Missing:
            </span>
            {node.missing_facts.map((mf) => (
              <TelemetryBadge key={mf} variant="amber" size="sm">
                {mf}
              </TelemetryBadge>
            ))}
          </div>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        <div className="mt-2.5 space-y-2.5">
          {node.children.map((child, idx) => (
            <ProofTreeNode
              key={`${child.goal}-${child.rule_id || idx}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AcademicDemo() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [targetGoalInput, setTargetGoalInput] = useState('');
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);

  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getDemoScenarios(), api.getSettings()]).then(
      ([scRes, setRes]) => {
        if (!active) return;
        if (scRes.status === 'fulfilled' && Array.isArray(scRes.value)) {
          setScenarios(scRes.value);
          if (scRes.value.length > 0) {
            setSelectedScenarioId(scRes.value[0].scenario_id);
            setTargetGoalInput(
              scRes.value[0].expected_conclusions?.[0] || 'FAULT_WEAK_BATTERY'
            );
          }
        }
        if (setRes.status === 'fulfilled' && setRes.value) {
          if (typeof setRes.value.default_demo_playback_ms === 'number') {
            setPlaybackSpeedMs(setRes.value.default_demo_playback_ms);
          }
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const selectedScenario = scenarios.find(
    (s) => s.scenario_id === selectedScenarioId
  );

  const handleSelectScenario = (id) => {
    setSelectedScenarioId(id);
    setResult(null);
    setErrorMsg('');
    const found = scenarios.find((s) => s.scenario_id === id);
    setTargetGoalInput(
      found?.expected_conclusions?.[0] || 'FAULT_WEAK_BATTERY'
    );
  };

  const handleRunSingle = async (mode = 'forward', overrideId = null) => {
    const scenarioIdToRun = overrideId || selectedScenarioId;
    if (!scenarioIdToRun) return;
    setLoading(true);
    setErrorMsg('');
    if (!overrideId) {
      setBatchResults([]);
    }

    try {
      const payload = {
        scenario_id: scenarioIdToRun,
        mode,
      };
      if (mode === 'backward' && targetGoalInput.trim()) {
        payload.target_goal = targetGoalInput.trim();
      }
      const res = await api.runDemoScenario(payload);
      setResult(res);
    } catch (err) {
      setErrorMsg(`Error running scenario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAll = async () => {
    setBatchRunning(true);
    setResult(null);
    setErrorMsg('');
    const results = [];

    for (const sc of scenarios) {
      try {
        const res = await api.runDemoScenario({
          scenario_id: sc.scenario_id,
          mode: 'forward',
        });
        const eva = res.expected_vs_actual || {};
        results.push({
          scenario_id: sc.scenario_id,
          title: sc.title,
          category: sc.category,
          expected_conclusions:
            eva.expected_conclusions || sc.expected_conclusions || [],
          actual_conclusions: eva.actual_conclusions || [],
          expected_safety: Boolean(
            eva.expected_safety_escalation ?? sc.expected_safety_escalation
          ),
          actual_safety: Boolean(eva.actual_safety_escalation),
          conclusions_matched: Boolean(eva.conclusions_matched),
          safety_matched: Boolean(eva.safety_matched),
          passes: res.total_passes ?? 0,
          runtime_ms: res.runtime_ms ?? 0,
          verdict: eva.verdict || 'MISMATCH (FAIL)',
          error: null,
        });
      } catch (err) {
        results.push({
          scenario_id: sc.scenario_id,
          title: sc.title,
          category: sc.category,
          expected_conclusions: sc.expected_conclusions || [],
          actual_conclusions: [],
          expected_safety: Boolean(sc.expected_safety_escalation),
          actual_safety: false,
          conclusions_matched: false,
          safety_matched: false,
          passes: 0,
          runtime_ms: 0,
          verdict: 'ERROR',
          error: err.message,
        });
      }
    }

    setBatchResults(results);
    setBatchRunning(false);
  };

  // Compute genuine batch parity metrics (never hardcoded!)
  const passedCount = batchResults.filter(
    (r) => r.verdict === 'MATCH (PASS)'
  ).length;
  const parityPercent =
    batchResults.length > 0
      ? Math.round((passedCount / batchResults.length) * 1000) / 10
      : 0;
  const batchBadgeVariant =
    batchResults.length > 0 && passedCount === batchResults.length
      ? 'lime'
      : passedCount > 0
        ? 'amber'
        : 'crimson';

  return (
    <PageTransition className="space-y-6">
      <SectionHeader
        code="EVAL_08"
        eyebrow="Academic Benchmark Harness"
        title="Deterministic Scenario Evaluation"
        description="Verify symbolic forward-chaining parity and recursive backward-chaining proof trees across 10 canonical ground-truth benchmarks."
        icon={GraduationCap}
        actions={
          <HudButton
            variant="lime"
            size="md"
            icon={Sparkles}
            loading={batchRunning}
            disabled={scenarios.length === 0}
            onClick={handleRunAll}
          >
            {batchRunning
              ? 'Evaluating 10 Scenarios...'
              : `Batch Eval All ${scenarios.length || 10} Scenarios`}
          </HudButton>
        }
      />

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

      {/* Batch Evaluation Summary Table */}
      {batchResults.length > 0 && (
        <NexusPanel
          variant={passedCount === batchResults.length ? 'lime' : 'warning'}
          padding="md"
          code="BATCH_MATRIX"
          title={`Batch Evaluation Summary — ${passedCount} / ${batchResults.length} Passed`}
          subtitle="Real-time comparison of derived fault conclusions and safety escalation against ground truth"
          headerAction={
            <TelemetryBadge variant={batchBadgeVariant} size="md" dot>
              PARITY: {parityPercent}% ({passedCount}/{batchResults.length})
            </TelemetryBadge>
          }
        >
          <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#07090C]">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0C1118] text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                  <th className="px-3.5 py-2.5 font-medium">Scenario</th>
                  <th className="px-3.5 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Passes</th>
                  <th className="px-3.5 py-2.5 font-medium">Runtime</th>
                  <th className="px-3.5 py-2.5 font-medium">
                    Expected vs Actual Conclusions
                  </th>
                  <th className="px-3.5 py-2.5 font-medium">Safety</th>
                  <th className="px-3.5 py-2.5 font-medium text-right">
                    Verdict
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {batchResults.map((r) => {
                  const isPass = r.verdict === 'MATCH (PASS)';
                  return (
                    <tr
                      key={r.scenario_id}
                      onClick={() => {
                        handleSelectScenario(r.scenario_id);
                        handleRunSingle('forward', r.scenario_id);
                      }}
                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-3.5 py-3 font-semibold text-[#00D9FF] whitespace-nowrap">
                        {r.scenario_id}
                      </td>
                      <td className="px-3.5 py-3 font-sans text-xs font-medium text-[#E8EDF3]">
                        {r.title}
                      </td>
                      <td className="px-3.5 py-3 text-[#C7D0DB] tabular-nums">
                        {r.passes}
                      </td>
                      <td className="px-3.5 py-3 text-[#C7FF4A] tabular-nums whitespace-nowrap">
                        {r.runtime_ms} ms
                      </td>
                      <td className="px-3.5 py-3 space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-[#8B96A5]">EXP:</span>
                          {r.expected_conclusions.map((ec) => (
                            <span
                              key={ec}
                              className="rounded bg-[#151C26] px-1.5 py-0.5 text-[10px] text-[#E8EDF3]"
                            >
                              {ec}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-[#8B96A5]">ACT:</span>
                          {r.actual_conclusions.length > 0 ? (
                            r.actual_conclusions.map((ac) => (
                              <span
                                key={ac}
                                className={`rounded px-1.5 py-0.5 text-[10px] ${
                                  r.conclusions_matched
                                    ? 'bg-[#17240A] text-[#C7FF4A]'
                                    : 'bg-[#290D16] text-[#FF8FA3]'
                                }`}
                              >
                                {ac}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#FF8FA3]">
                              {r.error ? `ERROR: ${r.error}` : 'NONE'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <TelemetryBadge
                          variant={r.safety_matched ? 'lime' : 'crimson'}
                          size="sm"
                        >
                          {String(r.expected_safety)} / {String(r.actual_safety)}
                        </TelemetryBadge>
                      </td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <TelemetryBadge
                          variant={isPass ? 'lime' : 'crimson'}
                          size="sm"
                          icon={isPass ? CheckCircle2 : XCircle}
                        >
                          {r.verdict}
                        </TelemetryBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </NexusPanel>
      )}

      {/* Single Scenario Runner & Evaluation Bench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Scenario Selector & Context Panel (4 cols) */}
        <div className="lg:col-span-4">
          <NexusPanel
            code="BENCH_CTRL"
            title="Benchmark Scenario"
            subtitle="Select scenario and execution mode"
            padding="md"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="scenario-select"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                >
                  Predefined Scenario
                </label>
                <select
                  id="scenario-select"
                  value={selectedScenarioId}
                  onChange={(e) => handleSelectScenario(e.target.value)}
                  className="nexus-input font-mono text-xs"
                >
                  {scenarios.map((s, idx) => (
                    <option key={s.scenario_id} value={s.scenario_id}>
                      #{String(idx + 1).padStart(2, '0')} · {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedScenario ? (
                <>
                  {/* Vehicle Profile */}
                  <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#00D9FF]">
                        Vehicle Profile
                      </span>
                      <TelemetryBadge variant="neutral" size="sm">
                        {selectedScenario.category}
                      </TelemetryBadge>
                    </div>
                    <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                      {selectedScenario.vehicle_profile?.year}{' '}
                      {selectedScenario.vehicle_profile?.manufacturer}{' '}
                      {selectedScenario.vehicle_profile?.model}
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px] text-[#8B96A5]">
                      <span>
                        {selectedScenario.vehicle_profile?.vehicle_type}
                      </span>
                      <span>·</span>
                      <span>
                        {selectedScenario.vehicle_profile?.cooling_type?.replace(
                          '_',
                          ' '
                        )}
                      </span>
                      <span>·</span>
                      <span>{selectedScenario.vehicle_profile?.fuel_type}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <span className="block font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                      Scenario Premise
                    </span>
                    <p className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3.5 text-xs leading-relaxed text-[#C7D0DB]">
                      {selectedScenario.description}
                    </p>
                  </div>

                  {/* Initial Facts */}
                  <div className="space-y-1.5">
                    <span className="block font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                      Initial Fact Assertions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(
                        selectedScenario.initial_facts || {}
                      ).map(([k, v]) => (
                        <TelemetryBadge
                          key={k}
                          variant={
                            v === true ? 'lime' : v === false ? 'crimson' : 'cyan'
                          }
                          size="sm"
                        >
                          {k}: {String(v)}
                        </TelemetryBadge>
                      ))}
                    </div>
                  </div>

                  {/* Backward Target Goal */}
                  <div className="space-y-1.5 border-t border-white/[0.08] pt-3">
                    <label
                      htmlFor="backward-goal-input"
                      className="block font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Backward Proof Target Goal
                    </label>
                    <input
                      id="backward-goal-input"
                      type="text"
                      value={targetGoalInput}
                      onChange={(e) => setTargetGoalInput(e.target.value)}
                      placeholder="e.g. FAULT_WEAK_BATTERY"
                      className="nexus-input font-mono text-xs"
                    />
                  </div>

                  {/* Run Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <HudButton
                      variant="primary"
                      size="md"
                      icon={Play}
                      loading={loading}
                      onClick={() => handleRunSingle('forward')}
                    >
                      Forward Chain
                    </HudButton>
                    <HudButton
                      variant="secondary"
                      size="md"
                      icon={GitBranch}
                      loading={loading}
                      onClick={() => handleRunSingle('backward')}
                    >
                      Backward Proof
                    </HudButton>
                  </div>
                </>
              ) : null}
            </div>
          </NexusPanel>
        </div>

        {/* Execution Output (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {!result ? (
            <NexusPanel variant="inset" padding="lg">
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Cpu className="h-7 w-7 text-[#5E6B7D]" />
                <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                  Select a Scenario to Execute Symbolic Inference
                </div>
                <p className="max-w-md text-xs leading-relaxed text-[#8B96A5]">
                  Run <strong className="text-[#00D9FF]">Forward Chain</strong>{' '}
                  for multi-pass ground-truth verification and trace playback, or{' '}
                  <strong className="text-[#E8EDF3]">Backward Proof</strong> to
                  inspect recursive goal decomposition and cycle checks.
                </p>
              </div>
            </NexusPanel>
          ) : result.mode === 'forward' ? (
            /* FORWARD CHAINING EVALUATION VIEW */
            (() => {
              const eva = result.expected_vs_actual || {};
              const isVerdictPass = eva.verdict === 'MATCH (PASS)';
              const conclusionsMatched = Boolean(eva.conclusions_matched);
              const safetyMatched = Boolean(eva.safety_matched);
              const expectedConclusions = eva.expected_conclusions || [];
              const actualConclusions = eva.actual_conclusions || [];

              return (
                <div className="space-y-6">
                  <NexusPanel
                    variant={isVerdictPass ? 'lime' : 'critical'}
                    padding="md"
                    code={result.scenario?.scenario_id || selectedScenarioId}
                    title={`Evaluation Verdict: ${eva.verdict || 'UNKNOWN'}`}
                    subtitle={`Runtime: ${result.runtime_ms ?? 0}ms · Passes: ${result.total_passes ?? 0} · Fixed Point: ${
                      result.fixed_point_reached ? 'REACHED' : 'MAX PASSES'
                    }`}
                    headerAction={
                      <div className="flex flex-wrap items-center gap-2">
                        <TelemetryBadge
                          variant={isVerdictPass ? 'lime' : 'critical'}
                          size="md"
                          icon={isVerdictPass ? CheckCircle2 : XCircle}
                        >
                          {isVerdictPass ? 'PARITY VERIFIED' : 'PARITY MISMATCH'}
                        </TelemetryBadge>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      {/* Granular Match Flags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <TelemetryBadge
                          variant={conclusionsMatched ? 'lime' : 'crimson'}
                          icon={conclusionsMatched ? CheckCircle2 : XCircle}
                        >
                          CONCLUSIONS MATCHED: {String(conclusionsMatched).toUpperCase()}
                        </TelemetryBadge>
                        <TelemetryBadge
                          variant={safetyMatched ? 'lime' : 'crimson'}
                          icon={safetyMatched ? CheckCircle2 : XCircle}
                        >
                          SAFETY MATCHED: {String(safetyMatched).toUpperCase()}
                        </TelemetryBadge>
                        <TelemetryBadge variant="cyan" icon={Clock}>
                          {result.runtime_ms ?? 0} MS
                        </TelemetryBadge>
                      </div>

                      {/* Expected vs Actual Side-by-Side */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-4 space-y-3">
                          <span className="block font-mono text-[10.5px] uppercase tracking-wider text-[#FBBF24]">
                            Expected Ground Truth
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {expectedConclusions.length > 0 ? (
                              expectedConclusions.map((ec) => (
                                <TelemetryBadge key={ec} variant="neutral" size="md">
                                  {ec}
                                </TelemetryBadge>
                              ))
                            ) : (
                              <span className="font-mono text-xs text-[#8B96A5]">
                                NONE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 font-mono text-[11px]">
                            <span className="text-[#8B96A5]">
                              Expected Safety Escalation:
                            </span>
                            <TelemetryBadge
                              variant={
                                eva.expected_safety_escalation
                                  ? 'critical'
                                  : 'neutral'
                              }
                            >
                              {String(Boolean(eva.expected_safety_escalation))}
                            </TelemetryBadge>
                          </div>
                        </div>

                        <div
                          className={`rounded-md border p-4 space-y-3 ${
                            isVerdictPass
                              ? 'border-[#C7FF4A]/30 bg-[#0F170A]'
                              : 'border-[#FF3B5C]/40 bg-[#180B10]'
                          }`}
                        >
                          <span
                            className={`block font-mono text-[10.5px] uppercase tracking-wider ${
                              isVerdictPass ? 'text-[#C7FF4A]' : 'text-[#FF8FA3]'
                            }`}
                          >
                            Actual Engine Output
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {actualConclusions.length > 0 ? (
                              actualConclusions.map((ac) => (
                                <TelemetryBadge
                                  key={ac}
                                  variant={
                                    expectedConclusions.includes(ac)
                                      ? 'lime'
                                      : 'cyan'
                                  }
                                  size="md"
                                >
                                  {ac}
                                </TelemetryBadge>
                              ))
                            ) : (
                              <span className="font-mono text-xs text-[#FF8FA3]">
                                NONE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 font-mono text-[11px]">
                            <span className="text-[#8B96A5]">
                              Actual Safety Escalation:
                            </span>
                            <TelemetryBadge
                              variant={
                                eva.actual_safety_escalation
                                  ? 'critical'
                                  : 'neutral'
                              }
                            >
                              {String(Boolean(eva.actual_safety_escalation))}
                            </TelemetryBadge>
                          </div>
                        </div>
                      </div>

                      {/* Triggered Rule Sequence */}
                      {Array.isArray(result.triggered_rules) &&
                      result.triggered_rules.length > 0 ? (
                        <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] px-4 py-3 space-y-1.5">
                          <span className="block font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                            Rule Activation Sequence ({result.triggered_rules.length})
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                            {result.triggered_rules.map((rid, idx) => (
                              <React.Fragment key={`${rid}-${idx}`}>
                                {idx > 0 ? (
                                  <span className="text-[#5E6B7D]">→</span>
                                ) : null}
                                <TelemetryBadge variant="cyan" size="sm">
                                  {rid}
                                </TelemetryBadge>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </NexusPanel>

                  {/* Playback Trace Viewer */}
                  {result.execution_steps?.length > 0 ? (
                    <TraceViewer
                      steps={result.execution_steps}
                      playbackSpeedMs={playbackSpeedMs}
                    />
                  ) : null}
                </div>
              );
            })()
          ) : (
            /* BACKWARD CHAINING VISUAL PROOF TREE VIEW */
            (() => {
              const tree = result.proof_tree || {};
              const treeStatus = tree.status || 'INCONCLUSIVE_MISSING_FACTS';
              const rootNodes = Array.isArray(tree.root_nodes)
                ? tree.root_nodes
                : [];
              const missingFacts = Array.isArray(tree.missing_facts)
                ? tree.missing_facts
                : [];
              const suggestedQuestions = Array.isArray(tree.suggested_questions)
                ? tree.suggested_questions
                : [];
              const cyclesPrevented = Array.isArray(tree.cycles_prevented)
                ? tree.cycles_prevented
                : [];
              const StatusIcon = getProofStatusIcon(treeStatus);

              return (
                <div className="space-y-6">
                  {/* Backward Verdict Header */}
                  <NexusPanel
                    variant={
                      treeStatus === 'PROVEN'
                        ? 'lime'
                        : treeStatus === 'DISPROVEN'
                          ? 'critical'
                          : 'warning'
                    }
                    padding="md"
                    code="BACKWARD_PROVER"
                    title={`Goal Proof: ${result.target_goal || tree.target_goal}`}
                    subtitle="Recursive goal-driven verification with call-stack cycle prevention"
                    headerAction={
                      <TelemetryBadge
                        variant={getProofStatusBadgeVariant(treeStatus)}
                        size="md"
                        icon={StatusIcon}
                      >
                        {treeStatus}
                      </TelemetryBadge>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono text-xs">
                      <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3">
                        <span className="block text-[10px] uppercase text-[#8B96A5]">
                          Proof Status
                        </span>
                        <span className="mt-1 block font-semibold text-[#E8EDF3]">
                          {treeStatus}
                        </span>
                      </div>
                      <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3">
                        <span className="block text-[10px] uppercase text-[#8B96A5]">
                          Cycles Prevented
                        </span>
                        <span className="mt-1 block font-semibold text-[#00D9FF]">
                          {cyclesPrevented.length}
                        </span>
                      </div>
                      <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3">
                        <span className="block text-[10px] uppercase text-[#8B96A5]">
                          Missing Leaf Facts
                        </span>
                        <span className="mt-1 block font-semibold text-[#FBBF24]">
                          {missingFacts.length}
                        </span>
                      </div>
                    </div>

                    {cyclesPrevented.length > 0 ? (
                      <div className="mt-4 rounded-md border border-[#F59E0B]/35 bg-[#1B1508] p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                          <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                          <span>Cycles Prevented ({cyclesPrevented.length})</span>
                        </div>
                        <ul className="space-y-1 font-mono text-xs text-[#FDE68A]">
                          {cyclesPrevented.map((c, idx) => (
                            <li key={idx}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-md border border-white/[0.07] bg-[#0B0F15] px-3.5 py-2.5 font-mono text-[11px] text-[#8B96A5]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#C7FF4A]" />
                        <span>
                          0 cycles detected — proof traversal remained strictly
                          acyclic.
                        </span>
                      </div>
                    )}
                  </NexusPanel>

                  {/* Recursive Proof Tree Visualization */}
                  <NexusPanel
                    code="PROOF_TREE"
                    title="Recursive Decision & Proof Tree"
                    subtitle="Inspect goal -> candidate rule -> condition subgoal branches"
                    padding="md"
                  >
                    {rootNodes.length > 0 ? (
                      <div className="space-y-4">
                        {rootNodes.map((rootNode, idx) => (
                          <ProofTreeNode
                            key={`${rootNode.goal}-${idx}`}
                            node={rootNode}
                            depth={0}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="py-6 text-center font-mono text-xs text-[#8B96A5]">
                        No proof nodes returned.
                      </p>
                    )}
                  </NexusPanel>

                  {/* Missing Facts & Targeted Questions */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <NexusPanel
                      code="MISSING_FACTS"
                      title={`Missing Observable Facts (${missingFacts.length})`}
                      padding="md"
                    >
                      {missingFacts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {missingFacts.map((mf) => (
                            <TelemetryBadge key={mf} variant="amber" size="md">
                              {mf}
                            </TelemetryBadge>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-[#8B96A5]">
                          No missing facts — all required premises are known in
                          working memory.
                        </p>
                      )}
                    </NexusPanel>

                    <NexusPanel
                      code="NEXT_QUERIES"
                      title={`Suggested Follow-Up Questions (${suggestedQuestions.length})`}
                      padding="md"
                    >
                      {suggestedQuestions.length > 0 ? (
                        <div className="space-y-2.5">
                          {suggestedQuestions.map((q, idx) => (
                            <div
                              key={`${q.fact_key}-${idx}`}
                              className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-3 space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono text-[11px] font-semibold text-[#00D9FF]">
                                  {q.fact_key}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <TelemetryBadge variant="neutral" size="sm">
                                    {q.input_type || 'boolean'}
                                  </TelemetryBadge>
                                  {q.unit ? (
                                    <TelemetryBadge variant="lime" size="sm">
                                      {q.unit}
                                    </TelemetryBadge>
                                  ) : null}
                                </div>
                              </div>
                              <p className="text-xs leading-relaxed text-[#E8EDF3]">
                                {q.question_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono text-xs text-[#8B96A5]">
                          No additional follow-up questions required.
                        </p>
                      )}
                    </NexusPanel>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </PageTransition>
  );
}
