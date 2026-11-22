import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { api } from '../services/api';

export default function Overview() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [reports, setReports] = useState([]);
  const [ruleStats, setRuleStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const vList = await api.getVehicles();
        setVehicles(vList);
        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].id);
        }
        const repList = await api.getReports({ limit: 10 });
        setReports(repList);
        const rStats = await api.getRuleStats();
        setRuleStats(rStats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      api.getVehicleHealth(selectedVehicleId)
        .then(setHealthData)
        .catch((err) => console.error('Failed to load vehicle health:', err));
    }
  }, [selectedVehicleId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Healthy':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Healthy</span>;
      case 'Attention Required':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Attention Required</span>;
      case 'Warning':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Warning</span>;
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">Critical</span>;
      default:
        // Honest Not Assessed default
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Not Assessed</span>;
    }
  };

  const chartData = ruleStats
    ? Object.entries(ruleStats.by_category).map(([name, count]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
      }))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-card to-slate-900 border border-border p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Vehicle Health & Expert System Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Deterministic rule-based mechanical diagnostic engine. Subsystem health defaults strictly to <span className="text-slate-200 font-semibold">Not Assessed</span> until verified by physical diagnostic evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/diagnose"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 flex items-center gap-2 transition"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Diagnose Vehicle</span>
          </Link>
          <Link
            to="/demo"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Academic Demo
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>REGISTERED VEHICLES</span>
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{vehicles.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Motorcycles & Cars Managed</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>KNOWLEDGE BASE RULES</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{ruleStats?.total_rules || 55}</div>
          <div className="text-[11px] text-slate-400 mt-1">Validated Symbolic IF-THEN Rules</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>SAFETY-CRITICAL RULES</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{ruleStats?.safety_critical_rules || 15}</div>
          <div className="text-[11px] text-slate-400 mt-1">Immediate Safety Halt Triggers</div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>SAVED REPORTS</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{reports.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Historical Diagnostic Audits</div>
        </div>
      </div>

      {/* Subsystem Health Dashboard Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Vehicle Subsystem Health Status</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflects ground truth from past diagnostic evaluations.
            </p>
          </div>

          {vehicles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Select Vehicle:</span>
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.manufacturer} {v.model} ({v.vehicle_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Car className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No vehicles registered yet.</p>
            <Link to="/vehicles" className="text-xs text-primary hover:underline mt-1 inline-block">
              Register your first motorcycle or car &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {healthData &&
              Object.entries(healthData.subsystems).map(([subsystemKey, info]) => (
                <div
                  key={subsystemKey}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {subsystemKey.replace('_', ' ')}
                      </span>
                      {getStatusBadge(info.status)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Last Assessed:{' '}
                      <span className="text-slate-300 font-medium">
                        {info.last_assessed ? info.last_assessed.slice(0, 10) : 'Never'}
                      </span>
                    </div>
                  </div>

                  {info.status !== 'Not Assessed' && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
                      <span>Evidence Score:</span>
                      <span className="font-semibold text-primary">{info.evidence_score}%</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rules Distribution & Recent Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules Distribution Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-1">Knowledge Base Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Rule coverage across mechanical subsystems</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Recent Diagnostic Reports</h3>
              <Link to="/reports" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No diagnostic sessions conducted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 4).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {rep.report_code} &bull; {rep.category.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {rep.created_at?.slice(0, 10)} &bull; {rep.conclusions?.length || 0} fault(s) detected
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(rep.safety_warning_triggered ? 'Critical' : rep.highest_severity === 'high' ? 'Warning' : 'Attention Required')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
