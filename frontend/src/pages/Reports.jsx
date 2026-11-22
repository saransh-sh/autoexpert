import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  GitCompare,
  ShieldAlert,
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
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; AUDIT_TRAIL // INFERENCE_RECORDS &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ AUDIT_TRAIL // DIAGNOSTIC_INFERENCE_LOGS ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            IMMUTABLE DOSSIERS OF HISTORICAL REASONING TRACES, DELTA ENGINES &amp; CERTIFIED PDF ARTIFACTS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-[#0A0A0A] border border-[#333333] text-xs font-mono uppercase text-[#EAEAEA] rounded-none px-3 py-2 focus:outline-none"
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
        <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4">
          <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-[#262626] pb-3">
            <FileText className="w-4 h-4 text-[#E61919]" />
            <span>[ SAVED_INFERENCE_REPORTS // COUNT: {reports.length} ]</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-500 uppercase tracking-widest">
              /// RETRIEVING AUDIT ARCHIVE... ///
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 uppercase tracking-widest">
              /// NO REPORTS RECORDED IN SYSTEM ///
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
              {reports.map((r) => {
                const isSelected = selectedReport && selectedReport.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setCompareResult(null);
                    }}
                    className={`p-3.5 rounded-none border text-left cursor-pointer transition font-mono ${
                      isSelected
                        ? 'bg-[#181818] border-l-4 border-l-[#E61919] border-y-[#333333] border-r-[#333333]'
                        : 'bg-[#0A0A0A] border-[#262626] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black text-[#EAEAEA] block">
                          [ {r.report_code} ]
                        </span>
                        <div className="text-[10px] text-neutral-400 mt-0.5 uppercase">
                          DOMAIN: {r.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-none uppercase border ${
                          r.safety_warning_triggered
                            ? 'bg-black text-[#E61919] border-[#E61919]'
                            : r.highest_severity === 'high'
                            ? 'bg-black text-[#F59E0B] border-[#F59E0B]'
                            : 'bg-black text-cyan-400 border-cyan-500'
                        }`}
                      >
                        [ {r.safety_warning_triggered ? 'CRITICAL' : r.highest_severity.toUpperCase()} ]
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1E1E1E] flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                      <span>{r.created_at?.slice(0, 10)}</span>
                      <span className="text-neutral-400 font-bold">{r.conclusions?.length || 0} FAULT(S)</span>
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
          <div className="bg-[#121212] border border-[#262626] rounded-none p-5">
            <h4 className="text-xs font-black text-neutral-300 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#262626] pb-2">
              <GitCompare className="w-4 h-4 text-[#E61919]" />
              <span>[ TELEMETRY_PROGRESSION // COMPARATIVE_DELTA_ENGINE ]</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
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
                className="bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
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
                className="px-4 py-2 bg-[#EAEAEA] hover:bg-white text-black font-mono font-bold uppercase tracking-wider rounded-none text-xs border border-[#EAEAEA] disabled:opacity-30 transition"
              >
                [ EXECUTE_DIFF ]
              </button>
            </div>

            {/* Comparison Diff Card */}
            {compareResult && (
              <div className="mt-4 p-4 bg-[#0A0A0A] border border-[#333333] rounded-none space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs border-b border-[#262626] pb-2">
                  <span className="font-bold text-[#EAEAEA] uppercase">// PROGRESSION_DELTA:</span>
                  <span className="font-mono text-[#4AF626] font-bold">
                    ODOMETER_DELTA: +{compareResult.comparison.odometer_delta_km} KM
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-[#121212] rounded-none border border-[#262626]">
                    <span className="text-neutral-500 block mb-1 uppercase text-[10px]">// COMMON_FAULTS:</span>
                    <span className="font-bold text-neutral-300">
                      {compareResult.comparison.common_faults.length > 0
                        ? compareResult.comparison.common_faults.join(', ')
                        : 'NONE'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#121212] rounded-none border border-[#262626]">
                    <span className="text-[#4AF626] block mb-1 uppercase text-[10px]">// RESOLVED_IN_B:</span>
                    <span className="font-bold text-[#4AF626]">
                      {compareResult.comparison.resolved_or_absent_in_b.length > 0
                        ? compareResult.comparison.resolved_or_absent_in_b.join(', ')
                        : 'NONE'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#121212] rounded-none border border-[#262626]">
                    <span className="text-[#E61919] block mb-1 uppercase text-[10px]">// NEW_FAULTS_IN_B:</span>
                    <span className="font-bold text-[#E61919]">
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
            <div className="bg-[#121212] border border-[#262626] rounded-none p-6 space-y-5 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#262626]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#EAEAEA] font-mono tracking-tight">
                      [ REPORT: {selectedReport.report_code} ]
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-none font-black uppercase bg-black text-[#EAEAEA] border border-[#333333]">
                      DOMAIN: {selectedReport.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase mt-1">
                    RECORDED: {selectedReport.created_at?.slice(0, 19).replace('T', ' ')}
                  </div>
                </div>

                <a
                  href={api.downloadReportPdfUrl(selectedReport.id)}
                  download
                  className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none flex items-center gap-2 border border-[#E61919] transition"
                >
                  <Download className="w-4 h-4" />
                  <span>[ EXPORT_PDF_DOSSIER ]</span>
                </a>
              </div>

              {/* Safety Warning in Detail */}
              {selectedReport.safety_warning_triggered && (
                <div className="p-3.5 bg-black border-2 border-[#E61919] rounded-none flex items-center gap-3 text-xs text-[#E61919] uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>
                    CRITICAL HAZARD INTERRUPT: SAFETY PROTOCOL TRIGGERED DURING THIS EVALUATION.
                  </span>
                </div>
              )}

              {/* Concluded Faults List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                  // DIAGNOSTIC_CONCLUSIONS ({selectedReport.conclusions?.length || 0}):
                </h4>

                {selectedReport.conclusions?.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 bg-[#0A0A0A] border border-[#262626] rounded-none space-y-2.5 font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wide">
                        {c.title}
                      </h5>
                      <EvidenceScoreBadge score={c.evidence_match_score} />
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                      {c.explanation}
                    </p>

                    <div className="p-3 border-l-4 border-l-[#E61919] bg-[#121212] border border-[#262626] rounded-none text-xs text-neutral-300">
                      <strong className="text-[#E61919] block mb-0.5 uppercase tracking-wider">
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
