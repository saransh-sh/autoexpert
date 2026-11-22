import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  GitCompare,
  Calendar,
  AlertTriangle,
  ArrowRight,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Diagnostic Reports & Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable records of past diagnostic inferences, side-by-side progression diffs, and PDF exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="bg-card border border-border text-xs text-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.manufacturer} {v.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Reports List + Detail / Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Table Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Saved Reports ({reports.length})</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No reports recorded.</div>
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
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-white">
                          {r.report_code}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5 capitalize">
                          {r.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          r.safety_warning_triggered
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : r.highest_severity === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {r.highest_severity}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{r.created_at?.slice(0, 10)}</span>
                      <span>{r.conclusions?.length || 0} fault(s)</span>
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
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-accent" />
              <span>Side-by-Side Historical Report Comparison</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="">Select Baseline Report A</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.report_code} ({r.created_at?.slice(0, 10)})
                  </option>
                ))}
              </select>

              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="">Select Target Report B</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.report_code} ({r.created_at?.slice(0, 10)})
                  </option>
                ))}
              </select>

              <button
                onClick={handleCompare}
                disabled={!compareA || !compareB}
                className="px-4 py-2 bg-accent hover:bg-cyan-600 disabled:opacity-30 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                Compare Reports
              </button>
            </div>

            {/* Comparison Diff Card */}
            {compareResult && (
              <div className="mt-4 p-4 bg-slate-900/80 border border-accent/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">Progression Delta:</span>
                  <span className="font-mono text-accent">
                    Odometer &Delta;: +{compareResult.comparison.odometer_delta_km} km
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 block mb-1">Common Faults:</span>
                    <span className="font-semibold text-slate-200">
                      {compareResult.comparison.common_faults.length > 0
                        ? compareResult.comparison.common_faults.join(', ')
                        : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-emerald-400 block mb-1">Resolved in B:</span>
                    <span className="font-semibold text-emerald-300">
                      {compareResult.comparison.resolved_or_absent_in_b.length > 0
                        ? compareResult.comparison.resolved_or_absent_in_b.join(', ')
                        : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-red-400 block mb-1">New Faults in B:</span>
                    <span className="font-semibold text-red-300">
                      {compareResult.comparison.new_faults_in_b.length > 0
                        ? compareResult.comparison.new_faults_in_b.join(', ')
                        : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Report Full Detail Card */}
          {selectedReport && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white font-mono">
                      {selectedReport.report_code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                      {selectedReport.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Recorded {selectedReport.created_at?.slice(0, 19).replace('T', ' ')}
                  </div>
                </div>

                <a
                  href={api.downloadReportPdfUrl(selectedReport.id)}
                  download
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </a>
              </div>

              {/* Safety Warning in Detail */}
              {selectedReport.safety_warning_triggered && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg flex items-center gap-3 text-xs text-red-200">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                  <span>
                    Critical safety violations were triggered during this diagnostic evaluation.
                  </span>
                </div>
              )}

              {/* Concluded Faults List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Diagnostic Conclusions ({selectedReport.conclusions?.length || 0})
                </h4>

                {selectedReport.conclusions?.map((c, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-sm font-bold text-white">{c.title}</h5>
                      <EvidenceScoreBadge score={c.evidence_match_score} />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{c.explanation}</p>

                    <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                      <strong className="text-blue-400 block mb-0.5">Recommended Action:</strong>
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
