import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock } from 'lucide-react';

export default function TraceViewer({ steps = [], playbackSpeedMs = 600 }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeedMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, playbackSpeedMs]);

  if (!steps || steps.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-slate-400">
        No execution trace steps to display.
      </div>
    );
  }

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      {/* Playback Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reasoning Playback
          </span>
          <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            title="Reset to beginning"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={currentStepIndex === 0}
            title="Step Back"
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-400 hover:text-white transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
            }}
            disabled={currentStepIndex >= steps.length - 1}
            title="Step Forward"
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-400 hover:text-white transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Step Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div>
            <div className="text-xs text-primary font-bold">PASS {currentStep.pass_number}</div>
            <div className="text-base font-bold text-slate-100">{currentStep.rule_name}</div>
            <div className="text-xs font-mono text-slate-400">Rule ID: {currentStep.rule_id}</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              Fired by Refraction & Tier Resolution
            </span>
          </div>
        </div>

        {/* Satisfied Conditions */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Satisfied Premise Conditions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentStep.satisfied_conditions?.map((cond, idx) => (
              <div
                key={idx}
                className="bg-slate-900/40 border border-slate-800 p-2.5 rounded text-xs flex items-center justify-between"
              >
                <span className="font-mono text-slate-300">{cond.fact}</span>
                <span className="font-semibold text-emerald-400">
                  {cond.operator} {String(cond.expected)} (Verified: {String(cond.actual)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derived Facts Asserted */}
        {currentStep.derived_facts_added?.length > 0 && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Intermediate Facts Asserted to Working Memory
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {currentStep.derived_facts_added.map((df, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-xs font-mono font-semibold"
                >
                  +{df.fact} = {String(df.value)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conclusion Reached */}
        {currentStep.conclusion_reached && (
          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Diagnostic Conclusion Reached
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1">
              {currentStep.conclusion_reached.title}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Fault ID: {currentStep.conclusion_reached.fault_id}
            </div>
          </div>
        )}

        {/* Diagnostic Explanation */}
        <div className="text-xs text-slate-300 italic bg-slate-900/30 p-3 rounded border border-slate-800/60">
          "{currentStep.explanation}"
        </div>
      </div>
    </div>
  );
}
