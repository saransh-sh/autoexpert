import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [pressureUnit, setPressureUnit] = useState('psi');
  const [playbackSpeed, setPlaybackSpeed] = useState(600);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        if (data) {
          setDistanceUnit(data.distance_unit || 'km');
          setPressureUnit(data.pressure_unit || 'psi');
          setPlaybackSpeed(data.default_demo_playback_ms || 600);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        distance_unit: distanceUnit,
        pressure_unit: pressureUnit,
        default_demo_playback_ms: Number(playbackSpeed),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(`Error saving preferences: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>System Settings & Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure diagnostic unit conventions, reasoning playback timing, and view system specifications.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>User preferences successfully saved to SQLite persistence.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
        {/* Distance Unit */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Distance & Odometer Measurement Unit
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setDistanceUnit('km')}
              className={`p-3 rounded-lg text-xs font-bold border transition ${
                distanceUnit === 'km'
                  ? 'bg-primary/20 border-primary text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Kilometers (km)
            </button>
            <button
              type="button"
              onClick={() => setDistanceUnit('mi')}
              className={`p-3 rounded-lg text-xs font-bold border transition ${
                distanceUnit === 'mi'
                  ? 'bg-primary/20 border-primary text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Miles (mi)
            </button>
          </div>
        </div>

        {/* Pressure Unit */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Tyre & Hydraulic Pressure Unit
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setPressureUnit('psi')}
              className={`p-3 rounded-lg text-xs font-bold border transition ${
                pressureUnit === 'psi'
                  ? 'bg-primary/20 border-primary text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Pounds per Square Inch (PSI)
            </button>
            <button
              type="button"
              onClick={() => setPressureUnit('bar')}
              className={`p-3 rounded-lg text-xs font-bold border transition ${
                pressureUnit === 'bar'
                  ? 'bg-primary/20 border-primary text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Bar (metric bar)
            </button>
          </div>
        </div>

        {/* Playback speed */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Reasoning Playback Interval (Milliseconds per Step)
          </label>
          <input
            type="number"
            min={200}
            max={3000}
            step={100}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Controls the automatic step delay during TraceViewer playback (default: 600ms).
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* System Specifications Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-primary" />
          <span>Academic System Architecture Notes</span>
        </h3>
        <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
          <p>
            AutoExpert is an installable pure symbolic expert system. It does not utilize any external LLM APIs, probabilistic models, or hardcoded result pages.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Engine:</strong> <code className="text-primary font-mono">autoexpert_engine</code> (Shared pip-installable package)</li>
            <li><strong>Working Memory:</strong> 3-Valued Logic (<code className="text-emerald-400 font-mono">TRUE</code>, <code className="text-red-400 font-mono">FALSE</code>, <code className="text-amber-400 font-mono">UNKNOWN</code>)</li>
            <li><strong>Conflict Resolution:</strong> Refraction &rarr; Safety &rarr; Specificity &rarr; Priority &rarr; Rule ID</li>
            <li><strong>Database:</strong> SQLite + SQLAlchemy 2.0 ORM with immutable report persistence</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
