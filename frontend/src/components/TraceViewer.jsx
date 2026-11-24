import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  GitBranch,
  ShieldAlert,
  Sparkles,
  FileText,
} from 'lucide-react';
import { NexusPanel, HudButton, TelemetryBadge } from './ui';

function formatTraceValue(val) {
  if (val === 'UNKNOWN' || val === null || val === undefined) return 'UNKNOWN';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

function getValueBadgeVariant(val) {
  if (val === 'UNKNOWN' || val === null || val === undefined) return 'amber';
  if (val === true) return 'lime';
  if (val === false) return 'crimson';
  return 'cyan';
}

function getSeverityBadgeVariant(severity) {
  switch (String(severity || '').toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'warning';
    case 'medium':
      return 'cyan';
    default:
      return 'neutral';
  }
}

export default function TraceViewer({
  steps = [],
  playbackSpeedMs = 600,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset playback state when a new trace array is provided
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [steps]);

  const effectiveSpeedMs = Math.max(150, Number(playbackSpeedMs) || 600);

  useEffect(() => {
    if (!isPlaying || !steps || steps.length <= 1) {
      if (isPlaying && steps.length <= 1) {
        setIsPlaying(false);
      }
      return undefined;
    }

    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
    }, effectiveSpeedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, effectiveSpeedMs]);

  if (!steps || steps.length === 0) {
    return (
      <NexusPanel variant="inset" padding="lg" className={className}>
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
          <GitBranch className="h-5 w-5 text-[#5E6B7D]" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-wider text-[#8B96A5]">
            No forward-chaining reasoning trace steps recorded
          </p>
        </div>
      </NexusPanel>
    );
  }

  const safeIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[safeIndex] || steps[0];
  const progressPercent = Math.round(((safeIndex + 1) / steps.length) * 100);
  const conclusion = currentStep.conclusion_reached;

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleTogglePlay = () => {
    if (!isPlaying && safeIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const stepBody = (
    <div className="space-y-4">
      {/* Step Header Telemetry Strip */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-white/[0.08] bg-[#0B0F15] p-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TelemetryBadge variant="cyan" size="sm">
              PASS {String(currentStep.pass_number ?? safeIndex + 1).padStart(2, '0')}
            </TelemetryBadge>
            <span className="font-mono text-xs font-semibold text-[#00D9FF]">
              {currentStep.rule_id}
            </span>
            {conclusion?.safety_critical ? (
              <TelemetryBadge variant="critical" size="sm" dot pulse icon={ShieldAlert}>
                SAFETY CRITICAL
              </TelemetryBadge>
            ) : null}
          </div>
          <h4 className="font-display text-base font-semibold tracking-tight text-[#E8EDF3]">
            {currentStep.rule_name}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TelemetryBadge variant="neutral" size="sm">
            5-TIER CONFLICT PASS
          </TelemetryBadge>
        </div>
      </div>

      {/* Satisfied Conditions Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#8B96A5]">
            Evaluated Rule Conditions ({currentStep.satisfied_conditions?.length || 0})
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#07090C]">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0C1118] text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
                <th className="px-3.5 py-2.5 font-medium">Fact</th>
                <th className="px-3 py-2.5 font-medium">Operator</th>
                <th className="px-3.5 py-2.5 font-medium">Expected</th>
                <th className="px-3.5 py-2.5 font-medium">Actual (3VL)</th>
                <th className="px-3.5 py-2.5 font-medium text-right">Satisfied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {(currentStep.satisfied_conditions || []).map((cond, idx) => {
                const isSatisfied = cond.satisfied !== false;
                return (
                  <tr
                    key={`${cond.fact}-${idx}`}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3.5 py-2.5 font-medium text-[#E8EDF3]">
                      {cond.fact}
                    </td>
                    <td className="px-3 py-2.5 text-[#00D9FF]">{cond.operator}</td>
                    <td className="px-3.5 py-2.5 text-[#C7D0DB]">
                      {formatTraceValue(cond.expected)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <TelemetryBadge
                        variant={getValueBadgeVariant(cond.actual)}
                        size="sm"
                      >
                        {formatTraceValue(cond.actual)}
                      </TelemetryBadge>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <TelemetryBadge
                        variant={isSatisfied ? 'lime' : 'crimson'}
                        size="sm"
                        icon={isSatisfied ? CheckCircle2 : XCircle}
                      >
                        {isSatisfied ? 'SATISFIED' : 'FAILED'}
                      </TelemetryBadge>
                    </td>
                  </tr>
                );
              })}
              {(!currentStep.satisfied_conditions ||
                currentStep.satisfied_conditions.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3.5 py-4 text-center text-[#8B96A5]"
                  >
                    No condition entries recorded for this step.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Newly Derived Intermediate Facts */}
      {currentStep.derived_facts_added?.length > 0 && (
        <div className="rounded-md border border-[#00D9FF]/30 bg-[#081A22] p-4 space-y-2.5">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-[#67E8F9]">
            <Sparkles className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
            <span>Newly Derived Facts Asserted to Working Memory</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentStep.derived_facts_added.map((df, idx) => (
              <TelemetryBadge
                key={`${df.fact}-${idx}`}
                variant="lime"
                size="md"
              >
                +{df.fact} = {formatTraceValue(df.value)}
              </TelemetryBadge>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion Highlight */}
      {conclusion ? (
        <div
          className={`rounded-md border p-4 space-y-2 ${
            conclusion.safety_critical
              ? 'border-[#FF3B5C]/45 bg-[#1C0B11] shadow-nexus-crimson'
              : 'border-[#C7FF4A]/35 bg-[#121C09] shadow-nexus-lime'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${
                conclusion.safety_critical ? 'text-[#FF8FA3]' : 'text-[#C7FF4A]'
              }`}
            >
              Diagnostic Conclusion Deduced
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {conclusion.severity ? (
                <TelemetryBadge
                  variant={getSeverityBadgeVariant(conclusion.severity)}
                  size="sm"
                >
                  SEVERITY: {conclusion.severity}
                </TelemetryBadge>
              ) : null}
              <TelemetryBadge variant="neutral" size="sm">
                {conclusion.fault_id}
              </TelemetryBadge>
            </div>
          </div>
          <div className="font-display text-base font-semibold text-[#E8EDF3]">
            {conclusion.title}
          </div>
        </div>
      ) : null}

      {/* Human-Readable Explanation */}
      <div className="rounded-md border border-white/[0.08] bg-[#0B0F15] p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[#8B96A5]">
          <FileText className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
          <span>Rule Explanation Trace</span>
        </div>
        <p className="text-sm leading-relaxed text-[#D0D8E2]">
          {currentStep.explanation}
        </p>
      </div>
    </div>
  );

  return (
    <NexusPanel
      variant="default"
      padding="md"
      code="TRACE_RECORDER"
      title="Forward-Chaining Reasoning Playback"
      subtitle={`Inspecting multi-pass symbolic rule execution at ${effectiveSpeedMs}ms/step`}
      className={className}
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <TelemetryBadge variant="cyan" dot pulse={isPlaying}>
            STEP {String(safeIndex + 1).padStart(2, '0')} /{' '}
            {String(steps.length).padStart(2, '0')}
          </TelemetryBadge>
          <div className="flex items-center gap-1.5">
            <HudButton
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={handleReset}
              aria-label="Reset trace to beginning"
              title="Reset to step 1"
            >
              Reset
            </HudButton>
            <HudButton
              variant="secondary"
              size="sm"
              icon={SkipBack}
              onClick={handleStepBack}
              disabled={safeIndex === 0}
              aria-label="Step back"
              title="Previous step"
            >
              Back
            </HudButton>
            <HudButton
              variant={isPlaying ? 'lime' : 'primary'}
              size="sm"
              icon={isPlaying ? Pause : Play}
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause playback' : 'Play trace'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </HudButton>
            <HudButton
              variant="secondary"
              size="sm"
              icon={SkipForward}
              onClick={handleStepForward}
              disabled={safeIndex >= steps.length - 1}
              aria-label="Step forward"
              title="Next step"
            >
              Next
            </HudButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Progress Bar & Step Selector Strip */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#8B96A5]">
            <span>EXECUTION PROGRESS</span>
            <span className="text-[#00D9FF] tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            {shouldReduceMotion ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-[#C7FF4A]"
                style={{ width: `${progressPercent}%` }}
              />
            ) : (
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-[#C7FF4A]"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </div>

          {steps.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {steps.map((step, idx) => {
                const isActive = idx === safeIndex;
                const isVisited = idx < safeIndex;
                return (
                  <button
                    key={`${step.rule_id}-${idx}`}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(idx);
                    }}
                    className={`rounded border px-2 py-1 font-mono text-[10.5px] transition-colors nexus-focus ${
                      isActive
                        ? 'border-[#00D9FF] bg-[#08242E] text-[#67E8F9] font-semibold'
                        : isVisited
                          ? 'border-[#C7FF4A]/30 bg-[#17240A]/60 text-[#C7FF4A] hover:border-[#C7FF4A]/60'
                          : 'border-white/[0.08] bg-[#0B0F15] text-[#8B96A5] hover:border-white/[0.2] hover:text-[#E8EDF3]'
                    }`}
                  >
                    P{String(step.pass_number ?? idx + 1).padStart(2, '0')} · {step.rule_id}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Animated / Static Step Body */}
        {shouldReduceMotion ? (
          stepBody
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep.rule_id}-${safeIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {stepBody}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </NexusPanel>
  );
}
