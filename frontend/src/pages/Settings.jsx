import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle, Info, Sparkles } from 'lucide-react';
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
      {/* Tactical Header */}
      <div className="border-b-2 border-black pb-4">
        <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
          ★ SYSTEM_CALIBRATION // HARDWARE_SPECS ★
        </span>
        <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#FF7844]" />
          <span>SYSTEM PARAMETERS // OPERATIONAL CALIBRATION</span>
        </h2>
        <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
          CALIBRATE TELEMETRY UNIT CONVENTIONS, PLAYBACK CHRONOMETRY &amp; HARDWARE CONSTRAINTS.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-[#49D49D] border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 text-xs text-black font-mono font-black uppercase tracking-wider">
          <CheckCircle className="w-4 h-4 text-black shrink-0" />
          <span>[ SUCCESS: OPERATIONAL_PARAMETERS_COMMITTED_TO_SQLITE ]</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#1E1A29] border-3 border-black p-6 space-y-6 shadow-[5px_5px_0px_#000000] font-mono">
        {/* Distance Unit */}
        <div>
          <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block mb-1.5 font-mono">
            // ODOMETER_DISTANCE_MEASUREMENT_UNIT:
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setDistanceUnit('km')}
              className={`p-3.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all ${
                distanceUnit === 'km'
                  ? 'bg-[#FF7844] text-black shadow-[3px_3px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#13111C] text-neutral-300 shadow-[2px_2px_0px_#000000] hover:text-black hover:bg-[#FED156]'
              }`}
            >
              {distanceUnit === 'km' ? '[X]' : '[ ]'} KILOMETERS (KM)
            </button>
            <button
              type="button"
              onClick={() => setDistanceUnit('mi')}
              className={`p-3.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all ${
                distanceUnit === 'mi'
                  ? 'bg-[#FF7844] text-black shadow-[3px_3px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#13111C] text-neutral-300 shadow-[2px_2px_0px_#000000] hover:text-black hover:bg-[#FED156]'
              }`}
            >
              {distanceUnit === 'mi' ? '[X]' : '[ ]'} MILES (MI)
            </button>
          </div>
        </div>

        {/* Pressure Unit */}
        <div>
          <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block mb-1.5 font-mono">
            // HYDRAULIC_&amp;_TYRE_PRESSURE_UNIT:
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => setPressureUnit('psi')}
              className={`p-3.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all ${
                pressureUnit === 'psi'
                  ? 'bg-[#FF7844] text-black shadow-[3px_3px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#13111C] text-neutral-300 shadow-[2px_2px_0px_#000000] hover:text-black hover:bg-[#FED156]'
              }`}
            >
              {pressureUnit === 'psi' ? '[X]' : '[ ]'} POUNDS_PER_SQ_INCH (PSI)
            </button>
            <button
              type="button"
              onClick={() => setPressureUnit('bar')}
              className={`p-3.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all ${
                pressureUnit === 'bar'
                  ? 'bg-[#FF7844] text-black shadow-[3px_3px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#13111C] text-neutral-300 shadow-[2px_2px_0px_#000000] hover:text-black hover:bg-[#FED156]'
              }`}
            >
              {pressureUnit === 'bar' ? '[X]' : '[ ]'} BAR (METRIC_BAR)
            </button>
          </div>
        </div>

        {/* Playback speed */}
        <div>
          <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block mb-1.5 font-mono">
            // TRACE_VIEWER_PLAYBACK_INTERVAL (MS_PER_STEP):
          </label>
          <input
            type="number"
            min={200}
            max={3000}
            step={100}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-full bg-[#13111C] border-2 border-black p-3 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
          />
          <span className="text-[10px] text-neutral-400 mt-1 block uppercase font-mono">
            // CONTROLS AUTOMATIC STEPPING INTERVAL IN TRACE_VIEWER FLIGHT RECORDER (DEFAULT: 600MS).
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t-2 border-black flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#49D49D] hover:bg-[#2DE1C2] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>[ COMMIT_PREFERENCES ]</span>
          </button>
        </div>
      </form>

      {/* System Specifications Card */}
      <div className="bg-[#1E1A29] border-3 border-black p-6 space-y-3 font-mono shadow-[5px_5px_0px_#FED156]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b-2 border-black pb-2 font-sans">
          <Info className="w-4 h-4 text-[#FED156]" />
          <span>[ HARDWARE &amp; ENGINE SPECIFICATIONS ]</span>
        </h3>
        <div className="text-xs text-neutral-300 space-y-2 leading-relaxed font-mono">
          <p className="uppercase text-[11px] text-[#FED156] font-bold">
            AUTOEXPERT IS AN INSTALLABLE PURE SYMBOLIC EXPERT SYSTEM. ZERO LLM APIS, PROBABILISTIC HALLUCINATIONS, OR HEURISTIC BYPASSES.
          </p>
          <div className="space-y-1.5 text-neutral-200 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#FF7844] font-bold">&gt;&gt;&gt;</span> <strong>ENGINE:</strong>{' '}
              <span className="px-2 py-0.5 bg-[#13111C] border border-black text-[#49D49D] font-bold">
                autoexpert_engine v1.0 [DETERMINISTIC SYMBOLIC EXPERT SYSTEM]
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#FF7844] font-bold">&gt;&gt;&gt;</span> <strong>WORKING_MEMORY:</strong>{' '}
              <span className="px-2 py-0.5 bg-[#13111C] border border-black text-[#FED156] font-bold">
                3-VALUED LOGIC (TRUE, FALSE, UNKNOWN)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#FF7844] font-bold">&gt;&gt;&gt;</span> <strong>CONFLICT_RESOLUTION:</strong>{' '}
              <span className="px-2 py-0.5 bg-[#13111C] border border-black text-white font-bold">
                REFRACTION &gt;&gt; SAFETY &gt;&gt; SPECIFICITY &gt;&gt; PRIORITY &gt;&gt; RULE_ID
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#FF7844] font-bold">&gt;&gt;&gt;</span> <strong>PERSISTENCE_LAYER:</strong>{' '}
              <span className="px-2 py-0.5 bg-[#13111C] border border-black text-[#00E5FF] font-bold">
                SQLITE 3 + SQLALCHEMY 2.0 ORM (IMMUTABLE AUDITS)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
