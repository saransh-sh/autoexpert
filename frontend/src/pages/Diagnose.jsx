import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Download,
  RotateCcw,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import SafetyBanner from '../components/SafetyBanner';
import EvidenceScoreBadge from '../components/EvidenceScoreBadge';

const CATEGORIES = [
  { id: 'engine', label: 'Engine & Performance' },
  { id: 'electrical', label: 'Electrical & Starting' },
  { id: 'transmission', label: 'Transmission & Clutch' },
  { id: 'brakes', label: 'Braking System' },
  { id: 'cooling_lubrication', label: 'Cooling & Lubrication' },
  { id: 'suspension_tyres', label: 'Suspension & Tyres' },
  { id: 'fuel_system', label: 'Fuel Delivery System' },
];

const COMMON_SYMPTOMS = {
  engine: ['engine_cranks', 'engine_starts', 'reduced_engine_power', 'excessive_engine_vibration', 'black_smoke_exhaust'],
  electrical: ['engine_starts', 'starter_clicks', 'headlights_dim', 'battery_warning_light_on'],
  transmission: ['rpm_rises_without_speed', 'clutch_slipping', 'trans_shifts_harsh_or_delayed', 'clicking_noise_on_sharp_turns'],
  brakes: ['brake_grinding_noise', 'brake_pedal_spongy', 'brake_pulls_to_one_side'],
  cooling_lubrication: ['engine_overheating', 'coolant_level_low', 'oil_pressure_warning_light', 'visible_oil_leak'],
  suspension_tyres: ['steering_vibration_at_speed', 'tyre_wear_uneven', 'vehicle_pulls_left_or_right', 'tyre_cord_visible'],
  fuel_system: ['engine_stalls_at_idle', 'fuel_smell_present', 'fuel_pressure_low', 'visible_fuel_leak'],
};

export default function Diagnose() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('electrical');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [inSession, setInSession] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [safetyAlert, setSafetyAlert] = useState(null);
  const [workingMemory, setWorkingMemory] = useState({});
  const [numericInput, setNumericInput] = useState('');
  const [completed, setCompleted] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getVehicles().then((data) => {
      setVehicles(data);
      if (data.length > 0) {
        setSelectedVehicleId(data[0].id);
      }
    });
  }, []);

  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await api.startDiagnostic({
        vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : null,
        category: selectedCategory,
        initial_symptoms: selectedSymptoms,
      });

      setSessionId(res.session_id);
      setCurrentQuestion(res.next_question);
      setSafetyAlert(res.safety_alert);
      setWorkingMemory(res.working_memory);
      setInSession(true);

      if (!res.next_question || res.safety_alert) {
        const sessionDetail = await api.getSession(res.session_id);
        if (sessionDetail.report) {
          setReport(sessionDetail.report);
          setCompleted(true);
        }
      }
    } catch (err) {
      alert(`Failed to start session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value) => {
    if (!currentQuestion) return;
    setLoading(true);

    try {
      const provenance =
        value === 'UNKNOWN' ? 'observation' : typeof value === 'number' ? 'measurement' : 'observation';

      const res = await api.answerDiagnostic({
        session_id: sessionId,
        fact_key: currentQuestion.fact_key,
        value: value,
        provenance: provenance,
      });

      setWorkingMemory(res.working_memory);
      setSafetyAlert(res.safety_alert);
      setCurrentQuestion(res.next_question);
      setNumericInput('');

      if (res.completed || res.safety_alert) {
        setCompleted(true);
        if (res.report_id) {
          const rep = await api.getReport(res.report_id);
          setReport(rep);
        }
      }
    } catch (err) {
      alert(`Error submitting answer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setInSession(false);
    setSessionId(null);
    setCurrentQuestion(null);
    setSafetyAlert(null);
    setWorkingMemory({});
    setCompleted(false);
    setReport(null);
    setSelectedSymptoms([]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ INTERVIEW_CONSOLE // BACKWARD_CHAINING_ENGINE ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            INTERACTIVE DIAGNOSTIC INTERVIEW
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            ADAPTIVE REASONING INTERVIEW DRIVEN BY BACKWARD CHAINING &amp; REAL-TIME SAFETY HALTS.
          </p>
        </div>
        {inSession && (
          <button
            onClick={resetSession}
            className="px-4 py-2 bg-[#FED156] hover:bg-[#FFE279] text-xs font-mono font-black uppercase tracking-wider text-black border-2 border-black shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ RESET_SESSION ]</span>
          </button>
        )}
      </div>

      {/* Safety Alert Banner */}
      <SafetyBanner alert={safetyAlert} />

      {!inSession ? (
        /* Setup Form */
        <div className="bg-[#1E1A29] border-3 border-black p-6 shadow-[5px_5px_0px_#000000] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Select */}
            <div>
              <label className="text-xs font-black text-neutral-200 uppercase tracking-wider block mb-1.5 font-mono">
                // TARGET_VEHICLE_UNIT:
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#13111C] border-2 border-black text-xs text-white font-mono uppercase font-bold p-3 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
              >
                {vehicles.length === 0 && <option value="">NO REGISTERED VEHICLES (GENERIC MODE)</option>}
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.manufacturer} {v.model} ({v.vehicle_type} - {v.cooling_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div>
              <label className="text-xs font-black text-neutral-200 uppercase tracking-wider block mb-1.5 font-mono">
                // PRIMARY_DIAGNOSTIC_DOMAIN:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSymptoms([]);
                }}
                className="w-full bg-[#13111C] border-2 border-black text-xs text-white font-mono uppercase font-bold p-3 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Symptoms Matrix */}
          <div>
            <label className="text-xs font-black text-neutral-200 uppercase tracking-wider block mb-2 font-mono">
              // INITIAL_OBSERVED_SYMPTOMS (CHECK ALL OBSERVED):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(COMMON_SYMPTOMS[selectedCategory] || []).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-3.5 border-2 border-black text-left text-xs font-mono uppercase flex items-center justify-between transition-all duration-100 ${
                      isChecked
                        ? 'bg-[#FF7844] text-black font-black shadow-[3px_3px_0px_#000000] translate-x-0.5 translate-y-0.5'
                        : 'bg-[#13111C] text-neutral-300 shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:text-white'
                    }`}
                  >
                    <span>{sym.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-black text-xs px-2 py-0.5 border-2 border-black bg-black text-white shadow-[1px_1px_0px_#000000]">
                      {isChecked ? '[X]' : '[ ]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4 border-t-2 border-black flex justify-end">
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-6 py-3.5 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{loading ? 'INITIALIZING INFERENCE...' : '[ BEGIN_DIAGNOSTIC_INTERVIEW ]'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Flow */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Card */}
          <div className="lg:col-span-2 space-y-6">
            {!completed && currentQuestion ? (
              <div className="bg-[#1E1A29] border-3 border-black p-6 space-y-6 shadow-[5px_5px_0px_#000000]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 bg-[#FED156] text-black border-2 border-black font-black text-xs px-3 py-1 shadow-[2px_2px_0px_#000000] -rotate-1 font-mono">
                    <Activity className="w-4 h-4" />
                    ADAPTIVE_INQUIRY // QUERY: {currentQuestion.fact_key}
                  </span>
                </div>

                <h3 className="text-lg font-black uppercase text-white leading-snug font-sans">
                  {currentQuestion.question_text}
                </h3>

                {/* Input Controls */}
                {currentQuestion.input_type === 'numeric' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder={`ENTER MEASUREMENT (${currentQuestion.unit || 'UNITS'})...`}
                        value={numericInput}
                        onChange={(e) => setNumericInput(e.target.value)}
                        className="bg-[#13111C] border-2 border-black p-3.5 text-sm font-mono font-bold text-[#49D49D] shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none flex-1 uppercase"
                      />
                      <button
                        onClick={() => handleAnswer(Number(numericInput))}
                        disabled={numericInput === '' || loading}
                        className="px-6 py-3.5 bg-[#FF7844] hover:bg-[#FF8800] text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                      >
                        [ SUBMIT ]
                      </button>
                    </div>
                    {currentQuestion.safe_range && (
                      <p className="text-[10px] text-neutral-300 uppercase font-mono">
                        // REFERENCE SPEC: <span className="text-[#FED156] font-bold">{currentQuestion.safe_range}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAnswer(true)}
                      disabled={loading}
                      className="p-5 bg-[#49D49D] hover:bg-[#2DE1C2] text-black font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 font-mono"
                    >
                      [ YES // OBSERVED ]
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      disabled={loading}
                      className="p-5 bg-[#FF4785] hover:bg-[#FF3E6C] text-white font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 font-mono"
                    >
                      [ NO // NOT_OBSERVED ]
                    </button>
                  </div>
                )}

                {/* Unknown Button */}
                <div className="pt-4 border-t-2 border-black flex justify-end">
                  <button
                    onClick={() => handleAnswer('UNKNOWN')}
                    disabled={loading}
                    className="px-4 py-2.5 bg-[#161320] hover:bg-[#FED156] text-neutral-200 hover:text-black border-2 border-black text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>[ UNKNOWN // 3VL_PRESERVED ]</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Completed Results Card */
              <div className="bg-[#1E1A29] border-3 border-black p-6 space-y-6 shadow-[5px_5px_0px_#000000]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#49D49D]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      [ DIAGNOSTIC_INFERENCE_COMPLETE ]
                    </h3>
                  </div>
                  {report && (
                    <a
                      href={api.downloadReportPdfUrl(report.id)}
                      download
                      className="px-4 py-2.5 bg-[#49D49D] hover:bg-[#2DE1C2] text-black border-2 border-black text-xs font-mono font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>[ DOWNLOAD_PDF_DOSSIER ]</span>
                    </a>
                  )}
                </div>

                {report && report.conclusions?.length > 0 ? (
                  <div className="space-y-4">
                    {report.conclusions.map((conc, idx) => (
                      <div
                        key={idx}
                        className="bg-[#13111C] border-2 border-black p-5 shadow-[4px_4px_0px_#000000] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                            {conc.title}
                          </h4>
                          <EvidenceScoreBadge score={conc.evidence_match_score} />
                        </div>

                        <p className="text-xs text-neutral-200 leading-relaxed font-mono">
                          {conc.explanation}
                        </p>

                        <div className="p-4 border-2 border-black bg-[#2D1A10] shadow-[3px_3px_0px_#FF7844] text-xs font-mono">
                          <strong className="text-[#FF7844] block mb-1 uppercase tracking-wider font-bold">
                            // RECOMMENDED_ACTION:
                          </strong>
                          {conc.recommended_action}
                        </div>

                        {conc.preventive_maintenance && (
                          <div className="text-[11px] text-neutral-300 font-mono">
                            <strong className="text-[#FED156] uppercase">// PREVENTIVE_TIP:</strong>{' '}
                            {conc.preventive_maintenance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-400 text-xs uppercase tracking-wider font-mono">
                    /// NO ACTIVE FAULTS OR SAFETY VIOLATIONS IDENTIFIED ///
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Working Memory Inspector Panel */}
          <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 h-fit shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-2 text-xs font-black text-neutral-200 uppercase tracking-wider pb-3 border-b-2 border-black">
              <span className="border-2 border-black bg-[#FF7844] text-black font-black text-xs px-2.5 py-0.5 shadow-[2px_2px_0px_#000000] -rotate-1 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                3VL_WORKING_MEMORY // REGISTRY
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {Object.keys(workingMemory).length === 0 ? (
                <div className="text-xs text-neutral-400 uppercase italic font-mono">
                  /// NO FACTS ASSERTED ///
                </div>
              ) : (
                Object.entries(workingMemory).map(([key, f]) => {
                  const val = typeof f === 'object' && f !== null ? f.value : f;
                  const prov = typeof f === 'object' && f !== null ? f.provenance : 'INITIAL_FACT';

                  let badgeColor = 'bg-[#00E5FF] text-black border-2 border-black shadow-[1px_1px_0px_#000000]';
                  if (val === true) badgeColor = 'bg-[#49D49D] text-black border-2 border-black shadow-[1px_1px_0px_#000000]';
                  if (val === false) badgeColor = 'bg-[#FF4785] text-white border-2 border-black shadow-[1px_1px_0px_#000000]';
                  if (val === 'UNKNOWN') badgeColor = 'bg-[#FED156] text-black border-2 border-black shadow-[1px_1px_0px_#000000]';

                  return (
                    <div
                      key={key}
                      className="p-2.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between font-mono text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-white font-bold block truncate">{key}</span>
                        <span className="text-[9px] text-[#FED156] uppercase font-mono">{prov}</span>
                      </div>
                      <span className={`px-2 py-0.5 font-mono font-black text-[10px] uppercase shrink-0 ${badgeColor}`}>
                        [ {String(val)} ]
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
