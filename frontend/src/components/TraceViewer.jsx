import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

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
      <div className="bg-[#121212] border border-[#262626] rounded-none p-8 text-center text-neutral-500 font-mono text-xs uppercase">
        /// NO REASONING TRACE STEPS AVAILABLE ///
      </div>
    );
  }

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="bg-[#121212] border border-[#262626] rounded-none p-5 shadow-none font-mono">
      {/* Playback Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#262626] mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
            [ REASONING_PLAYBACK // FLIGHT_RECORDER ]
          </span>
          <span className="bg-black border border-[#333333] text-[#EAEAEA] text-xs font-bold px-2 py-0.5 rounded-none">
            STEP [ {currentStepIndex + 1} / {steps.length} ]
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            title="Reset to beginning"
            className="p-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] border border-[#333333] rounded-none text-neutral-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={currentStepIndex === 0}
            title="Step Back"
            className="p-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] disabled:opacity-30 border border-[#333333] rounded-none text-neutral-300 hover:text-white transition"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition border border-[#E61919]"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
            }}
            disabled={currentStepIndex >= steps.length - 1}
            title="Step Forward"
            className="p-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] disabled:opacity-30 border border-[#333333] rounded-none text-neutral-300 hover:text-white transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Step Telemetry Card */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0A0A] p-4 rounded-none border border-[#262626]">
          <div>
            <div className="text-xs text-[#E61919] font-black uppercase tracking-wider">
              PASS: 0{currentStep.pass_number} // RULE_ID: {currentStep.rule_id}
            </div>
            <div className="text-sm font-black text-[#EAEAEA] uppercase tracking-wide mt-1">
              {currentStep.rule_name}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-black text-neutral-400 border border-[#333333] rounded-none">
              [ RESOLUTION: 5-TIER_CONFLICT_PASS ]
            </span>
          </div>
        </div>

        {/* Satisfied Premise Conditions */}
        <div>
          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
            // SATISFIED PREMISE CONDITIONS:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#262626] border border-[#262626]">
            {currentStep.satisfied_conditions?.map((cond, idx) => (
              <div
                key={idx}
                className="bg-[#0A0A0A] p-3 rounded-none text-xs flex items-center justify-between"
              >
                <span className="text-neutral-300 font-mono">{cond.fact}</span>
                <span className="font-bold text-[#4AF626] font-mono">
                  {cond.operator} {String(cond.expected)} (ACTUAL: {String(cond.actual)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derived Intermediate Facts */}
        {currentStep.derived_facts_added?.length > 0 && (
          <div className="p-3.5 bg-[#0A0A0A] border-l-2 border-l-[#4AF626] border border-[#262626] rounded-none">
            <div className="text-[10px] font-black text-[#4AF626] uppercase tracking-widest mb-2">
              // INTERMEDIATE FACTS ASSERTED TO WORKING MEMORY:
            </div>
            <div className="flex flex-wrap gap-2">
              {currentStep.derived_facts_added.map((df, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-black border border-[#333333] text-[#4AF626] rounded-none text-xs font-mono font-bold"
                >
                  [ +{df.fact} = {String(df.value)} ]
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conclusion Reached */}
        {currentStep.conclusion_reached && (
          <div className="p-4 bg-[#0A0A0A] border-l-4 border-l-[#E61919] border border-[#262626] rounded-none">
            <div className="text-[10px] font-black text-[#E61919] uppercase tracking-widest">
              // DIAGNOSTIC CONCLUSION DEDUCED:
            </div>
            <div className="text-sm font-black text-[#EAEAEA] uppercase tracking-wide mt-1">
              {currentStep.conclusion_reached.title}
            </div>
            <div className="text-xs text-neutral-400 font-mono mt-1">
              FAULT_ID: [ {currentStep.conclusion_reached.fault_id} ]
            </div>
          </div>
        )}

        {/* Diagnostic Explanation Quote */}
        <div className="text-xs text-neutral-400 bg-[#0A0A0A] p-3 rounded-none border border-[#262626]">
          <span className="text-neutral-600 block text-[9px] uppercase tracking-widest mb-1">
            // EXPLANATION TRACE:
          </span>
          "{currentStep.explanation}"
        </div>
      </div>
    </div>
  );
}
