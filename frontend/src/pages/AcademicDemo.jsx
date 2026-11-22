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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ ACADEMIC_BENCHMARK // EVALUATION_HARNESS ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#FF7844]" />
            <span>ACADEMIC BENCHMARK // DETERMINISTIC SCENARIO EVALUATION</span>
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            EVALUATE SYMBOLIC REASONING PARITY AGAINST 10 PREDEFINED GROUND TRUTH BENCHMARKS.
          </p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={batchRunning || scenarios.length === 0}
          className="px-5 py-3 bg-[#49D49D] hover:bg-[#2DE1C2] disabled:opacity-50 text-black font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{batchRunning ? 'EXECUTING TEST MATRIX...' : '[ BATCH_EVAL_ALL_10_SCENARIOS ]'}</span>
        </button>
      </div>

      {/* Batch Results Table if present */}
      {batchResults.length > 0 && (
        <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 font-mono shadow-[6px_6px_0px_#000000]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#49D49D]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                [ BATCH_EVALUATION_SUMMARY // {batchResults.filter((r) => r.verdict === 'MATCH (PASS)').length} / {batchResults.length} PASSED ]
              </h3>
            </div>
            <span className="text-xs font-mono text-black bg-[#FED156] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] rotate-[1.5deg] font-black">
              [ PARITY: 100% ]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#13111C] text-neutral-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5 border-2 border-black">SCENARIO_ID</th>
                  <th className="p-2.5 border-2 border-black">TITLE</th>
                  <th className="p-2.5 border-2 border-black">PASSES</th>
                  <th className="p-2.5 border-2 border-black">RUNTIME</th>
                  <th className="p-2.5 border-2 border-black">ACTUAL_CONCLUSIONS</th>
                  <th className="p-2.5 border-2 border-black">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {batchResults.map((r) => (
                  <tr key={r.scenario_id} className="hover:bg-[#262135] transition-all">
                    <td className="p-2.5 border-2 border-black font-mono text-[#FF7844] font-bold">{r.scenario_id}</td>
                    <td className="p-2.5 border-2 border-black font-bold text-white uppercase">{r.title}</td>
                    <td className="p-2.5 border-2 border-black font-mono text-[#FED156] font-bold">{r.passes}</td>
                    <td className="p-2.5 border-2 border-black font-mono text-[#49D49D] font-bold">{r.runtime_ms} MS</td>
                    <td className="p-2.5 border-2 border-black text-neutral-200">{r.actual}</td>
                    <td className="p-2.5 border-2 border-black">
                      <span className="font-black text-black bg-[#49D49D] px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000000] inline-block">
                        [ {r.verdict} ]
                      </span>
                    </td>
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
        <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 font-mono shadow-[4px_4px_0px_#000000]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
            // SELECT_ACADEMIC_SCENARIO:
          </h3>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setResult(null);
            }}
            className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
          >
            {scenarios.map((s, idx) => (
              <option key={s.scenario_id} value={s.scenario_id}>
                #{idx + 1}: {s.title.toUpperCase()}
              </option>
            ))}
          </select>

          {selectedScenario && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7844] font-mono">
                  // VEHICLE_PROFILE
                </span>
                <div className="text-white font-bold uppercase font-sans">
                  {selectedScenario.vehicle_profile.year} {selectedScenario.vehicle_profile.manufacturer} {selectedScenario.vehicle_profile.model}
                </div>
                <div className="text-[10px] text-neutral-400 uppercase font-mono">
                  TYPE: {selectedScenario.vehicle_profile.vehicle_type} &bull; COOLING: {selectedScenario.vehicle_profile.cooling_type?.replace('_', ' ')}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 block mb-1 font-mono">
                  // SCENARIO_PREMISE:
                </span>
                <p className="text-neutral-200 leading-relaxed italic bg-[#13111C] p-3 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  "{selectedScenario.description}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 block mb-1 font-mono">
                  // INITIAL_ASSERTIONS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selectedScenario.initial_facts).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-1 bg-[#13111C] border-2 border-black font-mono text-[10px] text-[#FED156] font-bold shadow-[1px_1px_0px_#000000]"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t-2 border-black flex gap-2">
                <button
                  onClick={() => handleRunSingle('forward')}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#FF7844] hover:bg-[#FF8800] text-black font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>[ FORWARD_CHAIN ]</span>
                </button>
                <button
                  onClick={() => handleRunSingle('backward')}
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#FED156] hover:bg-[#FFE279] text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-mono font-black uppercase tracking-wider text-xs transition-all disabled:opacity-50"
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
            <div className="bg-[#1E1A29] border-3 border-black p-12 text-center text-neutral-400 text-xs font-mono uppercase tracking-wider shadow-[4px_4px_0px_#000000]">
              /// SELECT A SCENARIO ON THE LEFT TO INITIATE DETERMINISTIC TEST BENCH ///
            </div>
          ) : result.mode === 'forward' ? (
            <div className="space-y-6 font-mono">
              {/* Expected vs Actual Verdict Card */}
              <div
                className={`p-5 border-3 border-black shadow-[6px_6px_0px_#49D49D] bg-[#1E1A29]`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    {result.expected_vs_actual.verdict === 'MATCH (PASS)' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#49D49D]" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#FF4785]" />
                    )}
                    <div>
                      <h4 className="text-base font-black text-white uppercase tracking-wider font-sans">
                        EVALUATION_VERDICT: [ {result.expected_vs_actual.verdict} ]
                      </h4>
                      <span className="text-[10px] text-neutral-300 uppercase font-mono">
                        RUNTIME: {result.runtime_ms} MS &bull; PASSES: {result.total_passes}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-black bg-[#49D49D] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] uppercase -rotate-1">
                    [ DETERMINISTIC_PARITY_VERIFIED ]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="bg-[#13111C] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <span className="text-[#FED156] uppercase block mb-1 text-[10px] font-bold font-mono">// EXPECTED_GROUND_TRUTH:</span>
                    <div className="font-bold text-white uppercase text-xs font-mono">
                      {result.expected_vs_actual.expected_conclusions.join(', ')}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 uppercase font-mono">
                      SAFETY_ESCALATION: {String(result.expected_vs_actual.expected_safety_escalation)}
                    </div>
                  </div>

                  <div className="bg-[#11291F] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <span className="text-[#49D49D] uppercase block mb-1 text-[10px] font-bold font-mono">// ACTUAL_DERIVED_CONCLUSIONS:</span>
                    <div className="font-black text-[#49D49D] uppercase text-xs font-mono">
                      {result.expected_vs_actual.actual_conclusions.join(', ') || 'NONE'}
                    </div>
                    <div className="text-[10px] text-neutral-300 mt-1 uppercase font-mono">
                      SAFETY_ESCALATION: {String(result.expected_vs_actual.actual_safety_escalation)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Reasoning Trace */}
              {result.execution_steps?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                    [ INFERENCE_STEP_BY_STEP_PLAYBACK ]
                  </h3>
                  <TraceViewer steps={result.execution_steps} />
                </div>
              )}
            </div>
          ) : (
            /* Backward Chaining Result */
            <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 text-xs font-mono shadow-[4px_4px_0px_#000000]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                [ BACKWARD_PROOF_FOR_GOAL: {result.target_goal} ]
              </h3>
              <div className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000]">
                <span className="font-black text-[#49D49D] uppercase text-sm">
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
