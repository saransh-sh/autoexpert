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
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; INTERVIEW_CONSOLE // BACKWARD_CHAINING_ENGINE &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ INTERACTIVE_DIAGNOSTIC_INTERVIEW // INFERENCE_SESSION ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            ADAPTIVE REASONING INTERVIEW DRIVEN BY BACKWARD CHAINING &amp; REAL-TIME SAFETY HALTS.
          </p>
        </div>
        {inSession && (
          <button
            onClick={resetSession}
            className="px-3.5 py-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 hover:text-white rounded-none border border-neutral-700 flex items-center gap-1.5 transition"
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
        <div className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Select */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                // TARGET_VEHICLE_UNIT:
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2.5 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
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
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                // PRIMARY_DIAGNOSTIC_DOMAIN:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSymptoms([]);
                }}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2.5 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
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
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
              // INITIAL_OBSERVED_SYMPTOMS (CHECK ALL OBSERVED):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#262626] border border-[#262626]">
              {(COMMON_SYMPTOMS[selectedCategory] || []).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-3 rounded-none text-left text-xs font-mono uppercase flex items-center justify-between transition ${
                      isChecked
                        ? 'bg-[#181818] text-[#EAEAEA] border-l-2 border-l-[#E61919]'
                        : 'bg-[#0A0A0A] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{sym.replace(/_/g, ' ')}</span>
                    <span className="font-bold font-mono text-xs">
                      {isChecked ? '[X]' : '[ ]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4 border-t border-[#262626] flex justify-end">
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-6 py-3 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center gap-2 transition"
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
              <div className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E61919] uppercase tracking-widest pb-3 border-b border-[#262626]">
                  <Activity className="w-4 h-4" />
                  <span>[ ADAPTIVE_DIAGNOSTIC_INQUIRY // QUERY: {currentQuestion.fact_key} ]</span>
                </div>

                <h3 className="text-base font-black text-[#EAEAEA] uppercase leading-snug">
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
                        className="bg-[#0A0A0A] border border-[#333333] rounded-none p-3 text-xs font-mono text-[#4AF626] flex-1 focus:border-[#4AF626] focus:outline-none uppercase"
                      />
                      <button
                        onClick={() => handleAnswer(Number(numericInput))}
                        disabled={numericInput === '' || loading}
                        className="px-5 py-3 bg-[#E61919] hover:bg-[#FF2A2A] text-white rounded-none text-xs font-mono font-bold uppercase tracking-wider border border-[#E61919]"
                      >
                        [ SUBMIT ]
                      </button>
                    </div>
                    {currentQuestion.safe_range && (
                      <p className="text-[10px] text-neutral-400 uppercase">
                        // REFERENCE SPEC: <span className="text-[#EAEAEA] font-bold">{currentQuestion.safe_range}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAnswer(true)}
                      disabled={loading}
                      className="p-4 bg-[#0A0A0A] hover:bg-emerald-950/40 border border-[#4AF626] text-[#4AF626] font-mono font-bold text-xs uppercase tracking-wider rounded-none transition"
                    >
                      [ YES // OBSERVED ]
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      disabled={loading}
                      className="p-4 bg-[#0A0A0A] hover:bg-red-950/40 border border-[#E61919] text-[#E61919] font-mono font-bold text-xs uppercase tracking-wider rounded-none transition"
                    >
                      [ NO // NOT_OBSERVED ]
                    </button>
                  </div>
                )}

                {/* Unknown Button */}
                <div className="pt-4 border-t border-[#262626] flex justify-end">
                  <button
                    onClick={() => handleAnswer('UNKNOWN')}
                    disabled={loading}
                    className="px-4 py-2 bg-[#0A0A0A] hover:bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>[ UNKNOWN // 3VL_PRESERVED ]</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Completed Results Card */
              <div className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#4AF626]" />
                    <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wider">
                      [ DIAGNOSTIC_INFERENCE_COMPLETE ]
                    </h3>
                  </div>
                  {report && (
                    <a
                      href={api.downloadReportPdfUrl(report.id)}
                      download
                      className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 border border-[#E61919] transition"
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
                        className="bg-[#0A0A0A] border border-[#262626] rounded-none p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wider">
                            {conc.title}
                          </h4>
                          <EvidenceScoreBadge score={conc.evidence_match_score} />
                        </div>

                        <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                          {conc.explanation}
                        </p>

                        <div className="p-3.5 border-l-4 border-l-[#E61919] bg-[#121212] border border-[#262626] rounded-none text-xs">
                          <strong className="text-[#E61919] block mb-1 uppercase tracking-wider">
                            // RECOMMENDED_ACTION:
                          </strong>
                          {conc.recommended_action}
                        </div>

                        {conc.preventive_maintenance && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            <strong className="text-neutral-300 uppercase">// PREVENTIVE_TIP:</strong>{' '}
                            {conc.preventive_maintenance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-500 text-xs uppercase tracking-wider">
                    /// NO ACTIVE FAULTS OR SAFETY VIOLATIONS IDENTIFIED ///
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Working Memory Inspector Panel */}
          <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-xs font-black text-neutral-400 uppercase tracking-wider pb-3 border-b border-[#262626]">
              <Layers className="w-4 h-4 text-[#E61919]" />
              <span>[ 3VL_WORKING_MEMORY // REGISTRY ]</span>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {Object.keys(workingMemory).length === 0 ? (
                <div className="text-xs text-neutral-500 uppercase italic">
                  /// NO FACTS ASSERTED ///
                </div>
              ) : (
                Object.entries(workingMemory).map(([key, f]) => {
                  const val = typeof f === 'object' && f !== null ? f.value : f;
                  const prov = typeof f === 'object' && f !== null ? f.provenance : 'INITIAL_FACT';

                  let badgeColor = 'text-cyan-400 border-cyan-500 bg-black';
                  if (val === true) badgeColor = 'text-[#4AF626] border-[#4AF626] bg-black';
                  if (val === false) badgeColor = 'text-[#E61919] border-[#E61919] bg-black';
                  if (val === 'UNKNOWN') badgeColor = 'text-amber-400 border-amber-500 bg-black';

                  return (
                    <div
                      key={key}
                      className="p-2 bg-[#0A0A0A] border border-[#262626] rounded-none text-xs flex items-center justify-between font-mono"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-neutral-300 block truncate">{key}</span>
                        <span className="text-[9px] text-neutral-500 uppercase">{prov}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-none font-mono font-bold text-[10px] uppercase border ${badgeColor}`}>
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
