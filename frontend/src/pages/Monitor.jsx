import React, { useState } from 'react';
import { Play, Search } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; ENGINE_CONSOLE // DUAL_MODE_INFERENCE &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ INFERENCE_ENGINE_MONITOR // 3VL_CHRONO_TELEMETRY ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            REAL-TIME WORKING MEMORY INSPECTION, FORWARD MULTI-PASS REASONING &amp; GOAL-DRIVEN PROOFS.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#0A0A0A] border border-[#262626] p-0 rounded-none text-xs font-mono">
          <button
            onClick={() => setActiveTab('forward')}
            className={`px-4 py-2.5 rounded-none uppercase font-bold tracking-wider border-r border-[#262626] transition ${
              activeTab === 'forward'
                ? 'bg-[#EAEAEA] text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            [ FORWARD_CHAINING_ENGINE ]
          </button>
          <button
            onClick={() => setActiveTab('backward')}
            className={`px-4 py-2.5 rounded-none uppercase font-bold tracking-wider transition ${
              activeTab === 'backward'
                ? 'bg-[#EAEAEA] text-black'
                : 'text-neutral-400 hover:text-white'
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
            <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4">
              <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">
                // INITIAL_FACT_ASSERTIONS (JSON):
              </h3>
              <textarea
                rows={12}
                value={forwardFactsText}
                onChange={(e) => setForwardFactsText(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-3 font-mono text-xs text-[#4AF626] focus:outline-none focus:border-[#4AF626]"
              />
              <button
                onClick={handleRunForward}
                disabled={forwardLoading}
                className="w-full py-3 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4" />
                <span>{forwardLoading ? 'EXECUTING INFERENCE...' : '[ EXECUTE_FORWARD_CHAINING ]'}</span>
              </button>
            </div>

            {/* Inference Summary Card */}
            <div className="lg:col-span-2 bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4">
              <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">
                // INFERENCE_ENGINE_OUTPUT &amp; TELEMETRY_METRICS:
              </h3>

              {!forwardResult ? (
                <div className="text-center py-16 text-xs text-neutral-500 uppercase tracking-wider">
                  /// EXECUTE FORWARD CHAINING TO GENERATE EXECUTION TRACE ///
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#262626] border border-[#262626]">
                    <div className="p-3 bg-[#0A0A0A] rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// RUNTIME</span>
                      <span className="text-base font-bold text-[#4AF626] font-mono">
                        {forwardResult.runtime_ms} MS
                      </span>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// TOTAL_PASSES</span>
                      <span className="text-base font-bold text-[#EAEAEA] font-mono">
                        {forwardResult.total_passes}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// RULES_TRIGGERED</span>
                      <span className="text-base font-bold text-[#EAEAEA] font-mono">
                        {forwardResult.triggered_rules.length}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// FIXED_POINT</span>
                      <span className="text-base font-bold text-[#4AF626] font-mono">
                        {forwardResult.fixed_point_reached ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                  </div>

                  {/* Triggered Rule Sequence */}
                  <div className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none text-xs">
                    <span className="text-neutral-500 block mb-1 uppercase font-bold text-[10px]">
                      // RULE_ACTIVATION_SEQUENCE:
                    </span>
                    <div className="font-mono text-[#EAEAEA] font-bold">
                      {forwardResult.triggered_rules.length > 0
                        ? forwardResult.triggered_rules.join(' >>> ')
                        : 'NONE'}
                    </div>
                  </div>

                  {/* Concluded Faults */}
                  {forwardResult.conclusions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">
                        // CONCLUDED_FAULTS:
                      </span>
                      {forwardResult.conclusions.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 bg-[#0A0A0A] border-l-4 border-l-[#E61919] border border-[#262626] rounded-none text-xs"
                        >
                          <div className="font-black text-[#EAEAEA] uppercase">{c.title}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conflict Resolution Log */}
                  {forwardResult.conflict_log?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">
                        // 5-TIER_CONFLICT_RESOLUTION_LOG:
                      </span>
                      {forwardResult.conflict_log.map((log, i) => (
                        <div
                          key={i}
                          className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none text-xs space-y-1"
                        >
                          <div className="flex justify-between font-bold text-neutral-300">
                            <span>
                              PASS 0{log.pass_number}: WINNER = {log.chosen_rule_id}
                            </span>
                            <span className="text-neutral-500 text-[10px]">
                              {log.competing_rules.length} COMPETING RULE(S)
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 italic">
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
              <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
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
          <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4">
            <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">
              // TARGET_HYPOTHESIS_GOAL:
            </h3>
            <input
              type="text"
              placeholder="E.G. FAULT_STATOR_REGULATOR_FAILURE"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2.5 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
            />

            <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest pt-2">
              // KNOWN_FACTS_REGISTRY (JSON):
            </h3>
            <textarea
              rows={8}
              value={backwardFactsText}
              onChange={(e) => setBackwardFactsText(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-400"
            />

            <button
              onClick={handleRunBackward}
              disabled={backwardLoading || !targetGoal}
              className="w-full py-3 bg-[#EAEAEA] hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#EAEAEA] flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>{backwardLoading ? 'PROVING HYPOTHESIS...' : '[ PROVE_TARGET_GOAL ]'}</span>
            </button>
          </div>

          {/* Backward Proof Tree Output */}
          <div className="lg:col-span-2 bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4">
            <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">
              // RECURSIVE_PROOF_TREE &amp; TARGETED_QUESTIONS:
            </h3>

            {!backwardTree ? (
              <div className="text-center py-16 text-xs text-neutral-500 uppercase tracking-wider">
                /// CONFIGURE TARGET HYPOTHESIS AND FACTS TO INITIATE PROVER ///
              </div>
            ) : (
              <div className="space-y-4">
                {/* Proof Status Badge */}
                <div className="p-4 bg-[#0A0A0A] border border-[#262626] rounded-none flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                      // HYPOTHESIS_VERDICT: [ {backwardTree.target_goal} ]
                    </span>
                    <span
                      className={`text-lg font-black tracking-wider ${
                        backwardTree.status === 'PROVEN'
                          ? 'text-[#4AF626]'
                          : backwardTree.status === 'DISPROVEN'
                          ? 'text-[#E61919]'
                          : 'text-amber-400'
                      }`}
                    >
                      [ {backwardTree.status} ]
                    </span>
                  </div>
                  {backwardTree.cycles_prevented?.length > 0 && (
                    <span className="px-2.5 py-1 bg-black border border-amber-600 text-amber-400 rounded-none text-xs font-bold uppercase">
                      CYCLE_PREVENTED ({backwardTree.cycles_prevented.length})
                    </span>
                  )}
                </div>

                {/* Missing Facts List */}
                {backwardTree.missing_facts?.length > 0 && (
                  <div className="p-4 bg-[#0A0A0A] border-l-2 border-l-amber-500 border border-[#262626] rounded-none space-y-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                      // MISSING_OBSERVABLE_FACTS_REQUIRED:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {backwardTree.missing_facts.map((mf, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-black border border-amber-600 text-amber-300 rounded-none font-mono text-xs"
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
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">
                      // GENERATED_TARGETED_FOLLOW_UP_QUESTIONS:
                    </span>
                    <div className="space-y-2">
                      {backwardTree.suggested_questions.map((q, i) => (
                        <div
                          key={i}
                          className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none text-xs"
                        >
                          <span className="font-mono text-[10px] text-[#E61919] font-bold block mb-0.5">
                            [ TARGET_KEY: {q.fact_key} ]
                          </span>
                          <span className="text-[#EAEAEA] font-medium">{q.question_text}</span>
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
