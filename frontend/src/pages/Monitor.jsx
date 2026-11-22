import React, { useState } from 'react';
import { Play, Search, Activity, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import TraceViewer from '../components/TraceViewer';

export default function Monitor() {
  const [activeTab, setActiveTab] = useState('forward');

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

  const handleRunForward = async () => {
    setForwardLoading(true);
    try {
      const parsedFacts = JSON.parse(forwardFactsText);
      const res = await api.runForwardChain({ facts: parsedFacts });
      setForwardResult(res);
    } catch (err) {
      alert(`Invalid JSON or inference error: ${err.message}`);
    } finally {
      setForwardLoading(false);
    }
  };

  const handleRunBackward = async () => {
    setBackwardLoading(true);
    try {
      const parsedFacts = JSON.parse(backwardFactsText);
      const res = await api.runBackwardChain({
        target_goal: targetGoal,
        facts: parsedFacts,
      });
      setBackwardTree(res);
    } catch (err) {
      alert(`Invalid JSON or proof error: ${err.message}`);
    } finally {
      setBackwardLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ ENGINE_CONSOLE // DUAL_MODE_INFERENCE ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            INFERENCE ENGINE MONITOR // 3VL CHRONO TELEMETRY
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            REAL-TIME WORKING MEMORY INSPECTION, FORWARD MULTI-PASS REASONING &amp; GOAL-DRIVEN PROOFS.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-3 border-black shadow-[4px_4px_0px_#000000] bg-[#161320] text-xs font-mono">
          <button
            onClick={() => setActiveTab('forward')}
            className={`px-5 py-3 uppercase font-black tracking-wider border-r-2 border-black transition-all ${
              activeTab === 'forward'
                ? 'bg-[#FF7844] text-black'
                : 'bg-[#161320] text-neutral-300 hover:text-black hover:bg-[#FED156]'
            }`}
          >
            [ FORWARD_CHAINING_ENGINE ]
          </button>
          <button
            onClick={() => setActiveTab('backward')}
            className={`px-5 py-3 uppercase font-black tracking-wider transition-all ${
              activeTab === 'backward'
                ? 'bg-[#FF7844] text-black'
                : 'bg-[#161320] text-neutral-300 hover:text-black hover:bg-[#FED156]'
            }`}
          >
            [ BACKWARD_CHAINING_PROVER ]
          </button>
        </div>
      </div>

      {/* Tab 1: Forward Chaining Engine */}
      {activeTab === 'forward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Config Card */}
            <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 shadow-[4px_4px_0px_#000000]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                // INITIAL_FACT_ASSERTIONS (JSON):
              </h3>
              <textarea
                rows={12}
                value={forwardFactsText}
                onChange={(e) => setForwardFactsText(e.target.value)}
                className="w-full bg-[#13111C] border-2 border-black p-3.5 font-mono text-xs font-bold text-[#49D49D] shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
              />
              <button
                onClick={handleRunForward}
                disabled={forwardLoading}
                className="w-full py-3.5 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{forwardLoading ? 'EXECUTING INFERENCE...' : '[ EXECUTE_FORWARD_CHAINING ]'}</span>
              </button>
            </div>

            {/* Inference Summary Card */}
            <div className="lg:col-span-2 bg-[#1E1A29] border-3 border-black p-5 space-y-4 shadow-[4px_4px_0px_#000000]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                // INFERENCE_ENGINE_OUTPUT &amp; TELEMETRY_METRICS:
              </h3>

              {!forwardResult ? (
                <div className="text-center py-16 text-xs text-neutral-400 uppercase tracking-wider font-mono">
                  /// EXECUTE FORWARD CHAINING TO GENERATE EXECUTION TRACE ///
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// RUNTIME</span>
                      <span className="text-base font-black text-[#49D49D] font-mono">
                        {forwardResult.runtime_ms} MS
                      </span>
                    </div>
                    <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// TOTAL_PASSES</span>
                      <span className="text-base font-black text-[#FED156] font-mono">
                        {forwardResult.total_passes}
                      </span>
                    </div>
                    <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// RULES_TRIGGERED</span>
                      <span className="text-base font-black text-[#FF7844] font-mono">
                        {forwardResult.triggered_rules.length}
                      </span>
                    </div>
                    <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// FIXED_POINT</span>
                      <span className="text-base font-black text-[#49D49D] font-mono">
                        {forwardResult.fixed_point_reached ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                  </div>

                  {/* Triggered Rule Sequence */}
                  <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs">
                    <span className="text-neutral-400 block mb-1 uppercase font-bold text-[10px] font-mono">
                      // RULE_ACTIVATION_SEQUENCE:
                    </span>
                    <div className="font-mono text-white font-bold">
                      {forwardResult.triggered_rules.length > 0
                        ? forwardResult.triggered_rules.join(' >>> ')
                        : 'NONE'}
                    </div>
                  </div>

                  {/* Concluded Faults */}
                  {forwardResult.conclusions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block font-mono">
                        // CONCLUDED_FAULTS:
                      </span>
                      {forwardResult.conclusions.map((c, i) => (
                        <div
                          key={i}
                          className="p-4 bg-[#2C131D] border-2 border-black shadow-[3px_3px_0px_#000000] text-xs"
                        >
                          <div className="font-black text-white uppercase font-sans text-sm">{c.title}</div>
                          <div className="text-[11px] text-neutral-300 mt-1 font-mono">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conflict Resolution Log */}
                  {forwardResult.conflict_log?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block font-mono">
                        // 5-TIER_CONFLICT_RESOLUTION_LOG:
                      </span>
                      {forwardResult.conflict_log.map((log, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs space-y-1 font-mono"
                        >
                          <div className="flex justify-between font-bold text-white">
                            <span>
                              PASS 0{log.pass_number}: WINNER = <span className="text-[#FF7844]">{log.chosen_rule_id}</span>
                            </span>
                            <span className="text-[#FED156] text-[10px]">
                              {log.competing_rules.length} COMPETING RULE(S)
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-300 italic">
                            RATIONALE: {log.rationale}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trace Viewer Component */}
          {forwardResult && forwardResult.execution_steps?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                [ STEP_BY_STEP_REASONING_PLAYBACK ]
              </h3>
              <TraceViewer steps={forwardResult.execution_steps} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Backward Chaining Prover */}
      {activeTab === 'backward' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Goal Input */}
          <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 shadow-[4px_4px_0px_#000000]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
              // TARGET_HYPOTHESIS_GOAL:
            </h3>
            <input
              type="text"
              placeholder="E.G. FAULT_STATOR_REGULATOR_FAILURE"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full bg-[#13111C] border-2 border-black p-3 text-xs text-white font-mono font-bold uppercase shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
            />

            <h3 className="text-xs font-black text-white uppercase tracking-widest pt-2 font-mono">
              // KNOWN_FACTS_REGISTRY (JSON):
            </h3>
            <textarea
              rows={8}
              value={backwardFactsText}
              onChange={(e) => setBackwardFactsText(e.target.value)}
              className="w-full bg-[#13111C] border-2 border-black p-3.5 font-mono text-xs font-bold text-[#00E5FF] shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
            />

            <button
              onClick={handleRunBackward}
              disabled={backwardLoading || !targetGoal}
              className="w-full py-3.5 bg-[#49D49D] hover:bg-[#2DE1C2] text-black text-xs font-mono font-black uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{backwardLoading ? 'PROVING HYPOTHESIS...' : '[ PROVE_TARGET_GOAL ]'}</span>
            </button>
          </div>

          {/* Backward Proof Tree Output */}
          <div className="lg:col-span-2 bg-[#1E1A29] border-3 border-black p-5 space-y-4 shadow-[4px_4px_0px_#000000]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
              // RECURSIVE_PROOF_TREE &amp; TARGETED_QUESTIONS:
            </h3>

            {!backwardTree ? (
              <div className="text-center py-16 text-xs text-neutral-400 uppercase tracking-wider font-mono">
                /// CONFIGURE TARGET HYPOTHESIS AND FACTS TO INITIATE PROVER ///
              </div>
            ) : (
              <div className="space-y-4">
                {/* Proof Status Badge */}
                <div className="p-5 bg-[#13111C] border-3 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-mono">
                      // HYPOTHESIS_VERDICT: [ {backwardTree.target_goal} ]
                    </span>
                    <span
                      className={`text-lg font-black tracking-wider inline-block mt-1 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] ${
                        backwardTree.status === 'PROVEN'
                          ? 'bg-[#49D49D] text-black -rotate-1'
                          : backwardTree.status === 'DISPROVEN'
                          ? 'bg-[#FF4785] text-white rotate-1'
                          : 'bg-[#FED156] text-black'
                      }`}
                    >
                      [ {backwardTree.status} ]
                    </span>
                  </div>
                  {backwardTree.cycles_prevented?.length > 0 && (
                    <span className="px-2.5 py-1 bg-[#2A2412] border-2 border-black text-[#FED156] text-xs font-black uppercase shadow-[2px_2px_0px_#000000]">
                      CYCLE_PREVENTED ({backwardTree.cycles_prevented.length})
                    </span>
                  )}
                </div>

                {/* Missing Facts List */}
                {backwardTree.missing_facts?.length > 0 && (
                  <div className="p-4 bg-[#2A2412] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2">
                    <span className="text-[10px] font-black text-[#FED156] uppercase tracking-widest block font-mono">
                      // MISSING_OBSERVABLE_FACTS_REQUIRED:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {backwardTree.missing_facts.map((mf, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-[#13111C] border-2 border-black text-[#FED156] font-mono text-xs font-bold shadow-[2px_2px_0px_#000000]"
                        >
                          [ ?MISSING: {mf} ]
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {backwardTree.suggested_questions?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block font-mono">
                      // GENERATED_TARGETED_FOLLOW_UP_QUESTIONS:
                    </span>
                    <div className="space-y-2">
                      {backwardTree.suggested_questions.map((q, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs font-mono"
                        >
                          <span className="font-mono text-[10px] text-[#FF7844] font-black block mb-0.5">
                            [ TARGET_KEY: {q.fact_key} ]
                          </span>
                          <span className="text-white font-medium">{q.question_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
