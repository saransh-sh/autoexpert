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
    <div className="space-y-6 max-w-3xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="border-b border-[#262626] pb-4">
        <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
          &lt; SYSTEM_CALIBRATION // HARDWARE_SPECS &gt;
        </span>
        <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#E61919]" />
          <span>[ SYSTEM_PARAMETERS // OPERATIONAL_CALIBRATION ]</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
          CALIBRATE TELEMETRY UNIT CONVENTIONS, PLAYBACK CHRONOMETRY &amp; HARDWARE CONSTRAINTS.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-black border border-[#4AF626] rounded-none flex items-center gap-2 text-xs text-[#4AF626] font-mono uppercase tracking-wider">
          <CheckCircle className="w-4 h-4 text-[#4AF626] shrink-0" />
          <span>[ SUCCESS: OPERATIONAL_PARAMETERS_COMMITTED_TO_SQLITE ]</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-6 shadow-none font-mono">
        {/* Distance Unit */}
        <div>
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
            // ODOMETER_DISTANCE_MEASUREMENT_UNIT:
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setDistanceUnit('km')}
              className={`p-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider border transition ${
                distanceUnit === 'km'
                  ? 'bg-[#E61919] border-[#E61919] text-white'
                  : 'bg-[#0A0A0A] border-[#333333] text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {distanceUnit === 'km' ? '[X]' : '[ ]'} KILOMETERS (KM)
            </button>
            <button
              type="button"
              onClick={() => setDistanceUnit('mi')}
              className={`p-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider border transition ${
                distanceUnit === 'mi'
                  ? 'bg-[#E61919] border-[#E61919] text-white'
                  : 'bg-[#0A0A0A] border-[#333333] text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {distanceUnit === 'mi' ? '[X]' : '[ ]'} MILES (MI)
            </button>
          </div>
        </div>

        {/* Pressure Unit */}
        <div>
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
            // HYDRAULIC_&amp;_TYRE_PRESSURE_UNIT:
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setPressureUnit('psi')}
              className={`p-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider border transition ${
                pressureUnit === 'psi'
                  ? 'bg-[#E61919] border-[#E61919] text-white'
                  : 'bg-[#0A0A0A] border-[#333333] text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {pressureUnit === 'psi' ? '[X]' : '[ ]'} POUNDS_PER_SQ_INCH (PSI)
            </button>
            <button
              type="button"
              onClick={() => setPressureUnit('bar')}
              className={`p-3 rounded-none text-xs font-mono font-bold uppercase tracking-wider border transition ${
                pressureUnit === 'bar'
                  ? 'bg-[#E61919] border-[#E61919] text-white'
                  : 'bg-[#0A0A0A] border-[#333333] text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {pressureUnit === 'bar' ? '[X]' : '[ ]'} BAR (METRIC_BAR)
            </button>
          </div>
        </div>

        {/* Playback speed */}
        <div>
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
            // TRACE_VIEWER_PLAYBACK_INTERVAL (MS_PER_STEP):
          </label>
          <input
            type="number"
            min={200}
            max={3000}
            step={100}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2.5 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
          />
          <span className="text-[10px] text-neutral-500 mt-1 block uppercase">
            // CONTROLS AUTOMATIC STEPPING INTERVAL IN TRACE_VIEWER FLIGHT RECORDER (DEFAULT: 600MS).
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#262626] flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>[ COMMIT_PREFERENCES ]</span>
          </button>
        </div>
      </form>

      {/* System Specifications Card */}
      <div className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-3 font-mono">
        <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-[#262626] pb-2">
          <Info className="w-4 h-4 text-[#E61919]" />
          <span>[ HARDWARE &amp; ENGINE SPECIFICATIONS ]</span>
        </h3>
        <div className="text-xs text-neutral-400 space-y-2 leading-relaxed">
          <p className="uppercase text-[11px]">
            AUTOEXPERT IS AN INSTALLABLE PURE SYMBOLIC EXPERT SYSTEM. ZERO LLM APIS, PROBABILISTIC HALLUCINATIONS, OR HEURISTIC BYPASSES.
          </p>
          <div className="space-y-1 text-neutral-300 pt-1 text-xs">
            <div>
              <span className="text-[#E61919] font-bold">&gt;&gt;&gt;</span> <strong>ENGINE:</strong>{' '}
              <span className="text-[#EAEAEA]">autoexpert_engine v1.0 [DETERMINISTIC SYMBOLIC EXPERT SYSTEM]</span>
            </div>
            <div>
              <span className="text-[#E61919] font-bold">&gt;&gt;&gt;</span> <strong>WORKING_MEMORY:</strong>{' '}
              <span className="text-[#4AF626]">3-VALUED LOGIC (TRUE, FALSE, UNKNOWN)</span>
            </div>
            <div>
              <span className="text-[#E61919] font-bold">&gt;&gt;&gt;</span> <strong>CONFLICT_RESOLUTION:</strong>{' '}
              <span className="text-[#EAEAEA]">REFRACTION &gt;&gt; SAFETY &gt;&gt; SPECIFICITY &gt;&gt; PRIORITY &gt;&gt; RULE_ID</span>
            </div>
            <div>
              <span className="text-[#E61919] font-bold">&gt;&gt;&gt;</span> <strong>PERSISTENCE_LAYER:</strong>{' '}
              <span className="text-[#EAEAEA]">SQLITE 3 + SQLALCHEMY 2.0 ORM (IMMUTABLE AUDITS)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
