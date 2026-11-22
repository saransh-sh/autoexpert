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
      <div className="bg-[#1E1A29] border-2 border-black p-8 text-center text-neutral-400 font-mono font-bold text-xs shadow-[3px_3px_0px_#000000] uppercase">
        /// NO REASONING TRACE STEPS AVAILABLE ///
      </div>
    );
  }

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="bg-[#1E1A29] border-3 border-black p-5 shadow-[4px_4px_0px_#000000] font-mono">
      {/* Playback Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-black mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-[#FF7844] uppercase tracking-widest font-sans">
            [ REASONING_PLAYBACK // FLIGHT_RECORDER ]
          </span>
          <span className="border-2 border-black bg-[#FED156] text-black font-mono font-black text-xs px-3 py-1 shadow-[2px_2px_0px_#000000] -rotate-1">
            STEP [ {currentStepIndex + 1} / {steps.length} ]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            title="Reset to beginning"
            className="p-2.5 bg-[#161320] hover:bg-[#262135] text-white border-2 border-black shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
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
            className="p-2.5 bg-[#161320] hover:bg-[#262135] text-white disabled:opacity-30 border-2 border-black shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:hover:translate-x-0 disabled:shadow-none transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
            className="px-5 py-2.5 bg-[#FF7844] hover:bg-[#FF8800] text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
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
            className="p-2.5 bg-[#161320] hover:bg-[#262135] text-white disabled:opacity-30 border-2 border-black shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:hover:translate-x-0 disabled:shadow-none transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Step Telemetry Card */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13111C] p-4 border-2 border-black shadow-[3px_3px_0px_#000000]">
          <div>
            <div className="text-xs text-[#FF7844] font-black uppercase tracking-wider">
              PASS: 0{currentStep.pass_number} // RULE_ID: {currentStep.rule_id}
            </div>
            <div className="text-sm font-black text-white uppercase tracking-wide mt-1 font-sans">
              {currentStep.rule_name}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-[#FED156] text-black border-2 border-black font-black shadow-[2px_2px_0px_#000000]">
              [ RESOLUTION: 5-TIER_CONFLICT_PASS ]
            </span>
          </div>
        </div>

        {/* Satisfied Premise Conditions */}
        <div>
          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 font-mono">
            // SATISFIED PREMISE CONDITIONS:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentStep.satisfied_conditions?.map((cond, idx) => (
              <div
                key={idx}
                className="bg-[#13111C] p-3 text-xs flex items-center justify-between border-2 border-black shadow-[2px_2px_0px_#000000]"
              >
                <span className="text-neutral-200 font-mono">{cond.fact}</span>
                <span className="font-bold text-[#49D49D] font-mono">
                  {cond.operator} {String(cond.expected)} (ACTUAL: {String(cond.actual)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derived Intermediate Facts */}
        {currentStep.derived_facts_added?.length > 0 && (
          <div className="p-4 bg-[#11291F] border-2 border-black shadow-[3px_3px_0px_#000000]">
            <div className="text-[10px] font-black text-[#49D49D] uppercase tracking-widest mb-2">
              // INTERMEDIATE FACTS ASSERTED TO WORKING MEMORY:
            </div>
            <div className="flex flex-wrap gap-2">
              {currentStep.derived_facts_added.map((df, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#49D49D] text-black border-2 border-black text-xs font-mono font-black shadow-[2px_2px_0px_#000000]"
                >
                  [ +{df.fact} = {String(df.value)} ]
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conclusion Reached */}
        {currentStep.conclusion_reached && (
          <div className="p-4 bg-[#2C131D] border-3 border-black shadow-[4px_4px_0px_#000000] rotate-[0.5deg]">
            <div className="text-[10px] font-black text-[#FF4785] uppercase tracking-widest">
              // DIAGNOSTIC CONCLUSION DEDUCED:
            </div>
            <div className="text-sm font-black text-white uppercase tracking-wide mt-1 font-sans">
              {currentStep.conclusion_reached.title}
            </div>
            <div className="text-xs text-neutral-300 font-mono mt-1">
              <span className="px-2.5 py-0.5 bg-[#FF4785] text-white border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000000] inline-block">
                FAULT_ID: [ {currentStep.conclusion_reached.fault_id} ]
              </span>
            </div>
          </div>
        )}

        {/* Diagnostic Explanation Quote */}
        <div className="text-xs text-neutral-200 bg-[#13111C] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
          <span className="text-[#FED156] block text-[9px] uppercase tracking-widest mb-1 font-bold">
            // EXPLANATION TRACE:
          </span>
          "{currentStep.explanation}"
        </div>
      </div>
    </div>
  );
}
