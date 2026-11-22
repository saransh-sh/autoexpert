import React, { useState } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import TraceViewer from '../components/TraceViewer';

export default function Monitor() {
  const [activeTab, setActiveTab] = useState('forward'); // 'forward' | 'backward' | 'memory'

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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Expert System Inference Monitor</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inspection of 3VL Working Memory, Forward Multi-Hop Chaining, and Goal-Driven Backward Proof Trees.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-card p-1 rounded-xl border border-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab('forward')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'forward' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Forward Chaining Engine
          </button>
          <button
            onClick={() => setActiveTab('backward')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'backward' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Backward Chaining Prover
          </button>
        </div>
      </div>

      {/* Tab 1: Forward Chaining Engine */}
      {activeTab === 'forward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Config Card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Initial Fact Assertions (JSON)
              </h3>
              <textarea
                rows={12}
                value={forwardFactsText}
                onChange={(e) => setForwardFactsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleRunForward}
                disabled={forwardLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4" />
                <span>{forwardLoading ? 'Executing Inference...' : 'Execute Forward Chaining'}</span>
              </button>
            </div>

            {/* Inference Summary Card */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Inference Engine Output & Metrics
              </h3>

              {!forwardResult ? (
                <div className="text-center py-16 text-xs text-slate-500">
                  Execute forward chaining on the left to view the multi-pass execution trace.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[10px] block uppercase">Runtime</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {forwardResult.runtime_ms} ms
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[10px] block uppercase">Total Passes</span>
                      <span className="text-base font-bold text-primary font-mono">
                        {forwardResult.total_passes}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[10px] block uppercase">Rules Triggered</span>
                      <span className="text-base font-bold text-white font-mono">
                        {forwardResult.triggered_rules.length}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 text-[10px] block uppercase">Fixed Point</span>
                      <span className="text-base font-bold text-emerald-400">
                        {forwardResult.fixed_point_reached ? 'Reached' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Triggered Rule Sequence */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1 font-bold">Rule Activation Sequence:</span>
                    <div className="font-mono text-primary font-bold">
                      {forwardResult.triggered_rules.length > 0
                        ? forwardResult.triggered_rules.join(' -> ')
                        : 'None'}
                    </div>
                  </div>

                  {/* Concluded Faults */}
                  {forwardResult.conclusions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Concluded Faults:
                      </span>
                      {forwardResult.conclusions.map((c, i) => (
                        <div key={i} className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs">
                          <div className="font-bold text-white">{c.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conflict Resolution Log */}
                  {forwardResult.conflict_log?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        5-Tier Conflict Resolution Decisions:
                      </span>
                      {forwardResult.conflict_log.map((log, i) => (
                        <div key={i} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>Pass {log.pass_number}: Winner = {log.chosen_rule_id}</span>
                            <span className="text-slate-400">
                              {log.competing_rules.length} competing rule(s)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 italic">
                            Rationale: {log.rationale}
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
              <h3 className="text-sm font-bold text-white">Step-by-Step Reasoning Playback</h3>
              <TraceViewer steps={forwardResult.execution_steps} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Backward Chaining Prover */}
      {activeTab === 'backward' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Goal Input */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Target Hypothesis / Goal
            </h3>
            <input
              type="text"
              placeholder="e.g. FAULT_WEAK_BATTERY"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
            />

            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pt-2">
              Current Known Facts (JSON)
            </h3>
            <textarea
              rows={8}
              value={backwardFactsText}
              onChange={(e) => setBackwardFactsText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs text-cyan-400 focus:outline-none focus:border-primary"
            />

            <button
              onClick={handleRunBackward}
              disabled={backwardLoading || !targetGoal}
              className="w-full py-2.5 bg-accent hover:bg-cyan-600 text-slate-950 text-xs font-bold rounded-lg shadow flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>{backwardLoading ? 'Proving Hypothesis...' : 'Prove Target Goal'}</span>
            </button>
          </div>

          {/* Backward Proof Tree Output */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recursive Proof Tree & Follow-up Questions
            </h3>

            {!backwardTree ? (
              <div className="text-center py-16 text-xs text-slate-500">
                Enter a target goal and initial facts on the left to verify if the hypothesis can be proven.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Proof Status Badge */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      Hypothesis Verdict for '{backwardTree.target_goal}':
                    </span>
                    <span
                      className={`text-lg font-black ${
                        backwardTree.status === 'PROVEN'
                          ? 'text-emerald-400'
                          : backwardTree.status === 'DISPROVEN'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {backwardTree.status}
                    </span>
                  </div>
                  {backwardTree.cycles_prevented?.length > 0 && (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-xs font-semibold">
                      Cycle Prevention Triggered ({backwardTree.cycles_prevented.length})
                    </span>
                  )}
                </div>

                {/* Missing Facts List */}
                {backwardTree.missing_facts?.length > 0 && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                      Missing Observable Facts Required to Prove Goal:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {backwardTree.missing_facts.map((mf, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded font-mono text-xs"
                        >
                          ?{mf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {backwardTree.suggested_questions?.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Generated Targeted Follow-up Questions:
                    </span>
                    <div className="space-y-2">
                      {backwardTree.suggested_questions.map((q, i) => (
                        <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
                          <span className="font-mono text-[10px] text-primary block mb-0.5">
                            [{q.fact_key}]
                          </span>
                          <span className="text-slate-200 font-medium">{q.question_text}</span>
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
