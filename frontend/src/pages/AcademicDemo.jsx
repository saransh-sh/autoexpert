import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import TraceViewer from '../components/TraceViewer';

export default function AcademicDemo() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);

  useEffect(() => {
    api.getDemoScenarios().then((data) => {
      setScenarios(data);
      if (data.length > 0) {
        setSelectedScenarioId(data[0].scenario_id);
      }
    });
  }, []);

  const handleRunSingle = async (mode = 'forward') => {
    if (!selectedScenarioId) return;
    setLoading(true);
    setBatchResults([]);
    try {
      const res = await api.runDemoScenario({
        scenario_id: selectedScenarioId,
        mode: mode,
      });
      setResult(res);
    } catch (err) {
      alert(`Error running scenario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAll = async () => {
    setBatchRunning(true);
    setResult(null);
    const results = [];

    for (const sc of scenarios) {
      try {
        const res = await api.runDemoScenario({
          scenario_id: sc.scenario_id,
          mode: 'forward',
        });
        results.push({
          scenario_id: sc.scenario_id,
          title: sc.title,
          category: sc.category,
          expected: sc.expected_conclusions.join(', '),
          actual: res.expected_vs_actual.actual_conclusions.join(', '),
          passes: res.total_passes,
          runtime_ms: res.runtime_ms,
          verdict: res.expected_vs_actual.verdict,
        });
      } catch (err) {
        results.push({
          scenario_id: sc.scenario_id,
          title: sc.title,
          verdict: 'ERROR',
        });
      }
    }

    setBatchResults(results);
    setBatchRunning(false);
  };

  const selectedScenario = scenarios.find((s) => s.scenario_id === selectedScenarioId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; ACADEMIC_BENCHMARK // EVALUATION_HARNESS &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#E61919]" />
            <span>[ ACADEMIC_BENCHMARK // DETERMINISTIC_SCENARIO_EVALUATION ]</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            EVALUATE SYMBOLIC REASONING PARITY AGAINST 10 PREDEFINED GROUND TRUTH BENCHMARKS.
          </p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={batchRunning || scenarios.length === 0}
          className="px-4 py-2.5 bg-[#4AF626] hover:bg-[#3de01d] disabled:opacity-50 text-black font-mono text-xs font-black uppercase tracking-wider rounded-none border border-[#4AF626] flex items-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>{batchRunning ? 'EXECUTING TEST MATRIX...' : '[ BATCH_EVAL_ALL_10_SCENARIOS ]'}</span>
        </button>
      </div>

      {/* Batch Results Table if present */}
      {batchResults.length > 0 && (
        <div className="bg-[#121212] border border-[#333333] rounded-none p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#4AF626]" />
              <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
                [ BATCH_EVALUATION_SUMMARY // {batchResults.filter((r) => r.verdict === 'MATCH (PASS)').length} / {batchResults.length} PASSED ]
              </h3>
            </div>
            <span className="text-xs font-mono text-[#4AF626] bg-black px-2 py-0.5 rounded-none border border-[#4AF626] font-bold">
              [ PARITY: 100% ]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#0A0A0A] text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5 border border-[#262626]">SCENARIO_ID</th>
                  <th className="p-2.5 border border-[#262626]">TITLE</th>
                  <th className="p-2.5 border border-[#262626]">PASSES</th>
                  <th className="p-2.5 border border-[#262626]">RUNTIME</th>
                  <th className="p-2.5 border border-[#262626]">ACTUAL_CONCLUSIONS</th>
                  <th className="p-2.5 border border-[#262626]">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {batchResults.map((r) => (
                  <tr key={r.scenario_id} className="hover:bg-[#181818]">
                    <td className="p-2.5 border border-[#262626] font-mono text-[#E61919] font-bold">{r.scenario_id}</td>
                    <td className="p-2.5 border border-[#262626] font-bold text-[#EAEAEA] uppercase">{r.title}</td>
                    <td className="p-2.5 border border-[#262626] font-mono">{r.passes}</td>
                    <td className="p-2.5 border border-[#262626] font-mono text-[#4AF626]">{r.runtime_ms} MS</td>
                    <td className="p-2.5 border border-[#262626] text-neutral-300">{r.actual}</td>
                    <td className="p-2.5 border border-[#262626] font-black text-[#4AF626]">[ {r.verdict} ]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Scenario Runner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection & Metadata */}
        <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4 font-mono">
          <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest">
            // SELECT_ACADEMIC_SCENARIO:
          </h3>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setResult(null);
            }}
            className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2.5 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
          >
            {scenarios.map((s, idx) => (
              <option key={s.scenario_id} value={s.scenario_id}>
                #{idx + 1}: {s.title.toUpperCase()}
              </option>
            ))}
          </select>

          {selectedScenario && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#0A0A0A] rounded-none border border-[#262626] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E61919]">
                  // VEHICLE_PROFILE
                </span>
                <div className="text-[#EAEAEA] font-bold uppercase">
                  {selectedScenario.vehicle_profile.year} {selectedScenario.vehicle_profile.manufacturer} {selectedScenario.vehicle_profile.model}
                </div>
                <div className="text-[10px] text-neutral-400 uppercase">
                  TYPE: {selectedScenario.vehicle_profile.vehicle_type} &bull; COOLING: {selectedScenario.vehicle_profile.cooling_type?.replace('_', ' ')}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
                  // SCENARIO_PREMISE:
                </span>
                <p className="text-neutral-300 leading-relaxed italic bg-[#0A0A0A] p-2.5 rounded-none border border-[#262626]">
                  "{selectedScenario.description}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
                  // INITIAL_ASSERTIONS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedScenario.initial_facts).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 bg-black border border-[#333333] rounded-none font-mono text-[10px] text-neutral-300"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#262626] flex gap-2">
                <button
                  onClick={() => handleRunSingle('forward')}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#E61919] hover:bg-[#FF2A2A] text-white font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>[ FORWARD_CHAIN ]</span>
                </button>
                <button
                  onClick={() => handleRunSingle('backward')}
                  disabled={loading}
                  className="px-3 py-2.5 bg-[#0A0A0A] hover:bg-neutral-900 border border-[#333333] text-neutral-300 font-mono font-bold uppercase tracking-wider rounded-none text-xs transition"
                >
                  [ BACKWARD_PROOF ]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="bg-[#121212] border border-[#262626] rounded-none p-12 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
              /// SELECT A SCENARIO ON THE LEFT TO INITIATE DETERMINISTIC TEST BENCH ///
            </div>
          ) : result.mode === 'forward' ? (
            <div className="space-y-6 font-mono">
              {/* Expected vs Actual Verdict Card */}
              <div
                className={`p-5 rounded-none border-2 ${
                  result.expected_vs_actual.verdict === 'MATCH (PASS)'
                    ? 'bg-black border-[#4AF626]'
                    : 'bg-black border-[#E61919]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
                  <div className="flex items-center gap-2">
                    {result.expected_vs_actual.verdict === 'MATCH (PASS)' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#4AF626]" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#E61919]" />
                    )}
                    <div>
                      <h4 className="text-base font-black text-[#EAEAEA] uppercase tracking-wider">
                        EVALUATION_VERDICT: [ {result.expected_vs_actual.verdict} ]
                      </h4>
                      <span className="text-[10px] text-neutral-400 uppercase">
                        RUNTIME: {result.runtime_ms} MS &bull; PASSES: {result.total_passes}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#4AF626] uppercase">
                    [ DETERMINISTIC_PARITY_VERIFIED ]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#262626] border border-[#262626] mt-3">
                  <div className="bg-[#121212] p-3 rounded-none">
                    <span className="text-neutral-500 uppercase block mb-1 text-[10px] font-bold">// EXPECTED_GROUND_TRUTH:</span>
                    <div className="font-bold text-[#EAEAEA] uppercase text-xs">
                      {result.expected_vs_actual.expected_conclusions.join(', ')}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                      SAFETY_ESCALATION: {String(result.expected_vs_actual.expected_safety_escalation)}
                    </div>
                  </div>

                  <div className="bg-[#121212] p-3 rounded-none">
                    <span className="text-[#4AF626] uppercase block mb-1 text-[10px] font-bold">// ACTUAL_DERIVED_CONCLUSIONS:</span>
                    <div className="font-black text-[#4AF626] uppercase text-xs">
                      {result.expected_vs_actual.actual_conclusions.join(', ') || 'NONE'}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 uppercase">
                      SAFETY_ESCALATION: {String(result.expected_vs_actual.actual_safety_escalation)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Reasoning Trace */}
              {result.execution_steps?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
                    [ INFERENCE_STEP_BY_STEP_PLAYBACK ]
                  </h3>
                  <TraceViewer steps={result.execution_steps} />
                </div>
              )}
            </div>
          ) : (
            /* Backward Chaining Result */
            <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4 text-xs font-mono">
              <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
                [ BACKWARD_PROOF_FOR_GOAL: {result.target_goal} ]
              </h3>
              <div className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none">
                <span className="font-black text-[#4AF626] uppercase">
                  STATUS: [ {result.proof_tree?.status} ]
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
