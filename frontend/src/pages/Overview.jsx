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
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
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
        return (
          <span className="px-2 py-0.5 rounded-none font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-[#4AF626] border border-[#4AF626]">
            [ STATUS: HEALTHY ]
          </span>
        );
      case 'Attention Required':
        return (
          <span className="px-2 py-0.5 rounded-none font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-cyan-400 border border-cyan-500">
            [ STATUS: ATTN_REQ ]
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2 py-0.5 rounded-none font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-[#F59E0B] border border-[#F59E0B]">
            [ STATUS: WARNING ]
          </span>
        );
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded-none font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-[#E61919] border border-[#E61919]">
            [ HAZARD: CRITICAL ]
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-none font-mono text-[10px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-neutral-400 border border-neutral-700">
            [ NOT_ASSESSED ]
          </span>
        );
    }
  };

  const chartData = ruleStats
    ? Object.entries(ruleStats.by_category).map(([name, count]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        count,
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header Banner */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded-none flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#E61919] font-mono uppercase tracking-widest block mb-1">
            &lt; SYS_OVERVIEW // TELEMETRY_DASHBOARD &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            VEHICLE HEALTH &amp; EXPERT SYSTEM DASHBOARD
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl font-mono leading-relaxed">
            Deterministic rule-based mechanical diagnostic engine. Subsystem health defaults strictly to{' '}
            <span className="text-[#EAEAEA] font-bold">[NOT_ASSESSED]</span> until validated by physical diagnostic evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/diagnose"
            className="px-4 py-2.5 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center gap-2 transition"
          >
            <Stethoscope className="w-4 h-4" />
            <span>[ INITIATE_DIAGNOSIS ]</span>
          </Link>
          <Link
            to="/demo"
            className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#333333] transition"
          >
            [ ACADEMIC_BENCHMARK ]
          </Link>
        </div>
      </div>

      {/* Quick Metrics Blueprint Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#262626] border border-[#262626]">
        <div className="bg-[#121212] p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>// METRIC_01: UNITS</span>
            <Car className="w-4 h-4 text-[#E61919]" />
          </div>
          <div className="text-3xl font-black text-[#EAEAEA] mt-2 font-mono">{vehicles.length}</div>
          <div className="text-[10px] text-neutral-500 uppercase mt-1">FLEET UNITS MONITORED</div>
        </div>

        <div className="bg-[#121212] p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>// METRIC_02: RULES</span>
            <CheckCircle className="w-4 h-4 text-[#4AF626]" />
          </div>
          <div className="text-3xl font-black text-[#EAEAEA] mt-2 font-mono">{ruleStats?.total_rules || 55}</div>
          <div className="text-[10px] text-neutral-500 uppercase mt-1">DETERMINISTIC IF-THEN RULES</div>
        </div>

        <div className="bg-[#121212] p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>// METRIC_03: HAZARDS</span>
            <ShieldAlert className="w-4 h-4 text-[#E61919]" />
          </div>
          <div className="text-3xl font-black text-[#E61919] mt-2 font-mono">{ruleStats?.safety_critical_rules || 15}</div>
          <div className="text-[10px] text-neutral-500 uppercase mt-1">SAFETY INTERLOCK TRIGGERS</div>
        </div>

        <div className="bg-[#121212] p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>// METRIC_04: AUDITS</span>
            <Clock className="w-4 h-4 text-neutral-300" />
          </div>
          <div className="text-3xl font-black text-[#EAEAEA] mt-2 font-mono">{reports.length}</div>
          <div className="text-[10px] text-neutral-500 uppercase mt-1">RECORDED DIAGNOSTIC AUDITS</div>
        </div>
      </div>

      {/* Subsystem Health Dashboard Section */}
      <div className="bg-[#121212] border border-[#262626] rounded-none p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-[#262626] pb-4">
          <div>
            <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-widest flex items-center gap-2">
              [ SUBSYSTEM_TELEMETRY // GROUND_TRUTH_EVAL ]
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 uppercase tracking-wide">
              EVALUATED AGAINST INFERENCE AUDIT LOGS.
            </p>
          </div>

          {vehicles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider">// TARGET_UNIT:</span>
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="bg-[#0A0A0A] border border-[#333333] text-xs text-[#EAEAEA] font-mono uppercase rounded-none px-3 py-1.5 focus:outline-none focus:border-[#E61919]"
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
          <div className="text-center py-10 text-neutral-500">
            <Car className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
            <p className="text-xs uppercase tracking-wider">/// NO FLEET ASSETS REGISTERED ///</p>
            <Link to="/vehicles" className="text-xs text-[#E61919] hover:underline mt-2 inline-block uppercase font-bold">
              &gt;&gt; REGISTER VEHICLE ASSET NOW
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[#262626] border border-[#262626]">
            {healthData &&
              Object.entries(healthData.subsystems).map(([subsystemKey, info]) => (
                <div
                  key={subsystemKey}
                  className="bg-[#0A0A0A] p-4 rounded-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#EAEAEA] uppercase tracking-wider">
                        {subsystemKey.replace('_', ' ')}
                      </span>
                      {getStatusBadge(info.status)}
                    </div>
                    <div className="text-[10px] text-neutral-500 uppercase mt-2">
                      // LAST_ASSESSED:{' '}
                      <span className="text-neutral-300 font-bold">
                        {info.last_assessed ? info.last_assessed.slice(0, 10) : 'NEVER'}
                      </span>
                    </div>
                  </div>

                  {info.status !== 'Not Assessed' && (
                    <div className="mt-3 pt-3 border-t border-[#1E1E1E] text-[10px] flex justify-between text-neutral-400 uppercase">
                      <span>EVIDENCE_MATCH:</span>
                      <span className="font-bold text-[#E61919]">{info.evidence_score}%</span>
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
        <div className="bg-[#121212] border border-[#262626] rounded-none p-6">
          <div className="mb-4 border-b border-[#262626] pb-3">
            <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
              [ KNOWLEDGE_BASE_DISTRIBUTION // SUBSYSTEM_COVERAGE ]
            </h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">
              QUANTITATIVE RULE DOMAIN COVERAGE
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#525252" fontSize={10} fontFamily="monospace" />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} width={120} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderColor: '#333333',
                    borderRadius: '0px',
                    color: '#EAEAEA',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#EAEAEA" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="bg-[#121212] border border-[#262626] rounded-none p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-xs font-black text-[#EAEAEA] uppercase tracking-widest">
                  [ RECENT_DIAGNOSTIC_REPORTS ]
                </h3>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">
                  AUDIT LOG IMMUTABLE DOSSIERS
                </p>
              </div>
              <Link to="/reports" className="text-xs text-[#E61919] hover:underline flex items-center gap-1 uppercase font-bold">
                VIEW_ALL &gt;&gt;
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 text-xs uppercase">
                /// NO DIAGNOSTIC SESSIONS RECORDED ///
              </div>
            ) : (
              <div className="space-y-2">
                {reports.slice(0, 4).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none flex items-center justify-between font-mono"
                  >
                    <div>
                      <div className="text-xs font-black text-[#EAEAEA] uppercase tracking-wider">
                        {rep.report_code} // {rep.category.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-neutral-500 uppercase mt-0.5">
                        {rep.created_at?.slice(0, 10)} &bull; {rep.conclusions?.length || 0} FAULT(S) DETECTED
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(
                        rep.safety_warning_triggered
                          ? 'Critical'
                          : rep.highest_severity === 'high'
                          ? 'Warning'
                          : 'Attention Required'
                      )}
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
