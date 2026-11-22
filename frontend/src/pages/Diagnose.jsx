import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
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
        // If immediate completion or safety halt
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
      const provenance = value === 'UNKNOWN' ? 'observation' : typeof value === 'number' ? 'measurement' : 'observation';

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Interactive Vehicle Diagnosis</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adaptive symbolic interview driven by backward chaining & safety guardrails.
          </p>
        </div>
        {inSession && (
          <button
            onClick={resetSession}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Diagnosis</span>
          </button>
        )}
      </div>

      {/* Safety Alert Banner */}
      <SafetyBanner alert={safetyAlert} />

      {!inSession ? (
        /* Setup Form */
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Select */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Target Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                {vehicles.length === 0 && <option value="">No registered vehicles (Generic Mode)</option>}
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.manufacturer} {v.model} ({v.vehicle_type} - {v.cooling_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Primary Diagnostic System
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSymptoms([]);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Symptoms Checkboxes */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Select Initial Symptoms or Reported Issues (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(COMMON_SYMPTOMS[selectedCategory] || []).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-3 rounded-lg text-left text-xs font-medium border flex items-center justify-between transition ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{sym.replace(/_/g, ' ')}</span>
                    {isChecked && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 flex items-center gap-2 transition"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{loading ? 'Initializing Engine...' : 'Begin Diagnostic Interview'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Flow */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Card */}
          <div className="lg:col-span-2 space-y-6">
            {!completed && currentQuestion ? (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  <Activity className="w-4 h-4" />
                  <span>Adaptive Diagnostic Inquiry</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-6 leading-snug">
                  {currentQuestion.question_text}
                </h3>

                {/* Input Controls */}
                {currentQuestion.input_type === 'numeric' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder={`Enter measurement (${currentQuestion.unit || 'units'})...`}
                        value={numericInput}
                        onChange={(e) => setNumericInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white flex-1"
                      />
                      <button
                        onClick={() => handleAnswer(Number(numericInput))}
                        disabled={numericInput === '' || loading}
                        className="px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                    {currentQuestion.safe_range && (
                      <p className="text-xs text-slate-400">
                        Reference Spec: <span className="text-slate-200">{currentQuestion.safe_range}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAnswer(true)}
                      disabled={loading}
                      className="p-4 bg-slate-900/80 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-800 rounded-xl text-center font-bold text-sm text-emerald-400 transition"
                    >
                      Yes / Observed
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      disabled={loading}
                      className="p-4 bg-slate-900/80 hover:bg-red-950/40 hover:border-red-500/50 border border-slate-800 rounded-xl text-center font-bold text-sm text-red-400 transition"
                    >
                      No / Not Observed
                    </button>
                  </div>
                )}

                {/* Unknown Button */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleAnswer('UNKNOWN')}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Unknown / Not Sure (3VL Preserved)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Completed Results Card */
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Diagnostic Inference Completed
                    </h3>
                  </div>
                  {report && (
                    <a
                      href={api.downloadReportPdfUrl(report.id)}
                      download
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>

                {report && report.conclusions?.length > 0 ? (
                  <div className="space-y-4">
                    {report.conclusions.map((conc, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-white">{conc.title}</h4>
                          <EvidenceScoreBadge score={conc.evidence_match_score} />
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {conc.explanation}
                        </p>

                        <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                          <strong className="text-blue-400 block mb-0.5">Recommended Action:</strong>
                          {conc.recommended_action}
                        </div>

                        {conc.preventive_maintenance && (
                          <div className="text-xs text-slate-400">
                            <strong>Preventive Tip:</strong> {conc.preventive_maintenance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No active faults or safety violations were concluded from the provided responses.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Working Memory Inspector Panel */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-border">
              <Layers className="w-4 h-4 text-primary" />
              <span>Active Working Memory (3VL)</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.keys(workingMemory).length === 0 ? (
                <div className="text-xs text-slate-500 italic">No facts in memory.</div>
              ) : (
                Object.entries(workingMemory).map(([key, f]) => {
                  const val = typeof f === 'object' && f !== null ? f.value : f;
                  const prov = typeof f === 'object' && f !== null ? f.provenance : 'initial_fact';

                  let badgeColor = 'text-blue-400 bg-blue-500/10';
                  if (val === true) badgeColor = 'text-emerald-400 bg-emerald-500/10';
                  if (val === false) badgeColor = 'text-red-400 bg-red-500/10';
                  if (val === 'UNKNOWN') badgeColor = 'text-amber-400 bg-amber-500/10';

                  return (
                    <div
                      key={key}
                      className="p-2.5 bg-slate-900/40 border border-slate-800 rounded text-xs flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono text-slate-300 block truncate">{key}</span>
                        <span className="text-[10px] text-slate-400">{prov}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${badgeColor}`}>
                        {String(val)}
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
