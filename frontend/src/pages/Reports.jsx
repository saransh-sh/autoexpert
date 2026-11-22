import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  GitCompare,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import EvidenceScoreBadge from '../components/EvidenceScoreBadge';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const vList = await api.getVehicles();
      setVehicles(vList);
      const repList = await api.getReports(selectedVehicleId ? { vehicle_id: selectedVehicleId } : {});
      setReports(repList);
      if (repList.length > 0 && !selectedReport) {
        setSelectedReport(repList[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedVehicleId]);

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    try {
      const res = await api.compareReports(compareA, compareB);
      setCompareResult(res);
    } catch (err) {
      alert(`Error comparing reports: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ AUDIT_TRAIL // INFERENCE_RECORDS ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            AUDIT TRAIL // DIAGNOSTIC INFERENCE LOGS
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            IMMUTABLE DOSSIERS OF HISTORICAL REASONING TRACES, DELTA ENGINES &amp; CERTIFIED PDF ARTIFACTS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-[#1E1A29] border-2 border-black text-xs font-mono uppercase font-bold text-white px-3 py-2 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none cursor-pointer"
          >
            <option value="">ALL FLEET UNITS</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.manufacturer} {v.model} ({v.registration_no || 'NO_REG'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Reports List + Detail / Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Table Card */}
        <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 shadow-[4px_4px_0px_#000000]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b-2 border-black pb-3 font-mono">
            <FileText className="w-4 h-4 text-[#FF7844]" />
            <span>[ SAVED_INFERENCE_REPORTS // COUNT: {reports.length} ]</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-400 uppercase tracking-widest font-mono">
              /// RETRIEVING AUDIT ARCHIVE... ///
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-400 uppercase tracking-widest font-mono">
              /// NO REPORTS RECORDED IN SYSTEM ///
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((r) => {
                const isSelected = selectedReport && selectedReport.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setCompareResult(null);
                    }}
                    className={`p-3.5 border-2 cursor-pointer transition-all font-mono ${
                      isSelected
                        ? 'bg-[#13111C] border-[#FF7844] shadow-[4px_4px_0px_#FF7844] translate-x-1'
                        : 'bg-[#13111C] border-black shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black text-white block">
                          [ {r.report_code} ]
                        </span>
                        <div className="text-[10px] text-neutral-400 mt-0.5 uppercase font-mono">
                          DOMAIN: {r.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 uppercase border-2 border-black shadow-[2px_2px_0px_#000000] ${
                          r.safety_warning_triggered
                            ? 'bg-[#FF4785] text-white'
                            : r.highest_severity === 'high'
                            ? 'bg-[#FED156] text-black'
                            : 'bg-[#49D49D] text-black'
                        }`}
                      >
                        [ {r.safety_warning_triggered ? 'CRITICAL' : r.highest_severity.toUpperCase()} ]
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t-2 border-black flex items-center justify-between text-[10px] text-neutral-400 uppercase font-mono">
                      <span>{r.created_at?.slice(0, 10)}</span>
                      <span className="text-[#FED156] font-bold">{r.conclusions?.length || 0} FAULT(S)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Detail / Comparison View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Side-by-Side Comparison Selector */}
          <div className="bg-[#1E1A29] border-3 border-black p-5 shadow-[4px_4px_0px_#000000]">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2 border-b-2 border-black pb-2 font-mono">
              <GitCompare className="w-4 h-4 text-[#FF7844]" />
              <span>[ TELEMETRY_PROGRESSION // COMPARATIVE_DELTA_ENGINE ]</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
              >
                <option value="">SELECT BASELINE REPORT A</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.report_code} ({r.created_at?.slice(0, 10)})
                  </option>
                ))}
              </select>

              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
              >
                <option value="">SELECT TARGET REPORT B</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.report_code} ({r.created_at?.slice(0, 10)})
                  </option>
                ))}
              </select>

              <button
                onClick={handleCompare}
                disabled={!compareA || !compareB}
                className="px-4 py-2 bg-[#FED156] hover:bg-[#FFE279] text-black font-mono font-black uppercase tracking-wider text-xs border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 transition-all"
              >
                [ EXECUTE_DIFF ]
              </button>
            </div>

            {/* Comparison Diff Card */}
            {compareResult && (
              <div className="mt-4 p-4 bg-[#13111C] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs border-b-2 border-black pb-2">
                  <span className="font-bold text-white uppercase">// PROGRESSION_DELTA:</span>
                  <span className="font-mono text-[#49D49D] font-bold">
                    ODOMETER_DELTA: +{compareResult.comparison.odometer_delta_km} KM
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#1E1A29] border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <span className="text-neutral-400 block mb-1 uppercase text-[10px]">// COMMON_FAULTS:</span>
                    <span className="font-bold text-white">
                      {compareResult.comparison.common_faults.length > 0
                        ? compareResult.comparison.common_faults.join(', ')
                        : 'NONE'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#11291F] border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <span className="text-[#49D49D] block mb-1 uppercase text-[10px] font-bold">// RESOLVED_IN_B:</span>
                    <span className="font-bold text-[#49D49D]">
                      {compareResult.comparison.resolved_or_absent_in_b.length > 0
                        ? compareResult.comparison.resolved_or_absent_in_b.join(', ')
                        : 'NONE'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#2C131D] border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <span className="text-[#FF4785] block mb-1 uppercase text-[10px] font-bold">// NEW_FAULTS_IN_B:</span>
                    <span className="font-bold text-[#FF4785]">
                      {compareResult.comparison.new_faults_in_b.length > 0
                        ? compareResult.comparison.new_faults_in_b.join(', ')
                        : 'NONE'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Report Full Detail Card */}
          {selectedReport && (
            <div className="bg-[#1E1A29] border-3 border-black p-6 space-y-5 font-mono shadow-[5px_5px_0px_#000000]">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-black">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white font-mono tracking-tight">
                      [ REPORT: {selectedReport.report_code} ]
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-black uppercase bg-[#FED156] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
                      DOMAIN: {selectedReport.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase mt-1 font-mono">
                    RECORDED: {selectedReport.created_at?.slice(0, 19).replace('T', ' ')}
                  </div>
                </div>

                <a
                  href={api.downloadReportPdfUrl(selectedReport.id)}
                  download
                  className="px-4 py-2 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>[ EXPORT_PDF_DOSSIER ]</span>
                </a>
              </div>

              {/* Safety Warning in Detail */}
              {selectedReport.safety_warning_triggered && (
                <div className="p-3.5 bg-[#2C131D] border-2 border-black shadow-[3px_3px_0px_#FF4785] flex items-center gap-3 text-xs text-[#FFAAB8] uppercase font-bold">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-[#FF4785]" />
                  <span>
                    CRITICAL HAZARD INTERRUPT: SAFETY PROTOCOL TRIGGERED DURING THIS EVALUATION.
                  </span>
                </div>
              )}

              {/* Concluded Faults List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-neutral-300 uppercase tracking-widest font-mono">
                  // DIAGNOSTIC_CONCLUSIONS ({selectedReport.conclusions?.length || 0}):
                </h4>

                {selectedReport.conclusions?.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 bg-[#13111C] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2.5 font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-sm font-black text-white uppercase tracking-wide font-sans">
                        {c.title}
                      </h5>
                      <EvidenceScoreBadge score={c.evidence_match_score} />
                    </div>

                    <p className="text-xs text-neutral-200 leading-relaxed font-mono">
                      {c.explanation}
                    </p>

                    <div className="p-3.5 border-2 border-black bg-[#2D1A10] shadow-[2px_2px_0px_#FF7844] text-xs text-neutral-200 font-mono">
                      <strong className="text-[#FF7844] block mb-0.5 uppercase tracking-wider font-bold">
                        // RECOMMENDED_ACTION:
                      </strong>
                      {c.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
