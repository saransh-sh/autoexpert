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
  Flame,
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
          <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider bg-[#49D49D] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
            [ STATUS: HEALTHY ]
          </span>
        );
      case 'Attention Required':
        return (
          <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider bg-[#00E5FF] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
            [ STATUS: ATTN_REQ ]
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider bg-[#FED156] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
            [ STATUS: WARNING ]
          </span>
        );
      case 'Critical':
        return (
          <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider bg-[#FF4785] text-white border-2 border-black shadow-[2px_2px_0px_#000000]">
            [ HAZARD: CRITICAL ]
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-[#262135] text-neutral-300 border-2 border-black shadow-[1px_1px_0px_#000000]">
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header Banner */}
      <div className="bg-[#1E1A29] border-3 border-black p-6 shadow-[5px_5px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ SYS_OVERVIEW // TELEMETRY_DASHBOARD ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            VEHICLE HEALTH &amp; EXPERT SYSTEM DASHBOARD
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed font-sans">
            Deterministic rule-based mechanical diagnostic engine. Subsystem health defaults strictly to{' '}
            <span className="text-[#FED156] font-bold font-mono">[NOT_ASSESSED]</span> until validated by physical diagnostic evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/diagnose"
            className="px-5 py-3 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>[ INITIATE_DIAGNOSIS ]</span>
          </Link>
          <Link
            to="/demo"
            className="px-5 py-3 bg-[#FED156] hover:bg-[#FFE279] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            [ ACADEMIC_BENCHMARK ]
          </Link>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E1A29] border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-300 text-xs font-black uppercase tracking-wider font-mono">
            <span>// METRIC_01: UNITS</span>
            <div className="p-2 bg-[#FF7844] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">{vehicles.length}</div>
          <div className="text-[10px] text-[#FF7844] font-bold font-mono uppercase mt-1">FLEET UNITS MONITORED</div>
        </div>

        <div className="bg-[#1E1A29] border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-300 text-xs font-black uppercase tracking-wider font-mono">
            <span>// METRIC_02: RULES</span>
            <div className="p-2 bg-[#49D49D] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">{ruleStats?.total_rules || 55}</div>
          <div className="text-[10px] text-[#49D49D] font-bold font-mono uppercase mt-1">DETERMINISTIC IF-THEN RULES</div>
        </div>

        <div className="bg-[#1E1A29] border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-300 text-xs font-black uppercase tracking-wider font-mono">
            <span>// METRIC_03: HAZARDS</span>
            <div className="p-2 bg-[#FF4785] text-white border-2 border-black shadow-[2px_2px_0px_#000000]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#FF4785] mt-3 font-mono">{ruleStats?.safety_critical_rules || 15}</div>
          <div className="text-[10px] text-[#FF4785] font-bold font-mono uppercase mt-1">SAFETY INTERLOCK TRIGGERS</div>
        </div>

        <div className="bg-[#1E1A29] border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-300 text-xs font-black uppercase tracking-wider font-mono">
            <span>// METRIC_04: AUDITS</span>
            <div className="p-2 bg-[#FED156] text-black border-2 border-black shadow-[2px_2px_0px_#000000]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">{reports.length}</div>
          <div className="text-[10px] text-[#FED156] font-bold font-mono uppercase mt-1">RECORDED DIAGNOSTIC AUDITS</div>
        </div>
      </div>

      {/* Subsystem Health Dashboard Section */}
      <div className="bg-[#1E1A29] border-3 border-black p-6 shadow-[5px_5px_0px_#000000]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b-2 border-black pb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-sans">
              [ SUBSYSTEM_TELEMETRY // GROUND_TRUTH_EVAL ]
            </h3>
            <p className="text-[11px] text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
              EVALUATED AGAINST INFERENCE AUDIT LOGS.
            </p>
          </div>

          {vehicles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300 uppercase tracking-wider font-mono font-bold">// TARGET_UNIT:</span>
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="bg-[#13111C] border-2 border-black text-xs text-white font-mono uppercase px-3 py-2 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
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
          <div className="text-center py-10 text-neutral-400">
            <Car className="w-10 h-10 mx-auto text-neutral-500 mb-2" />
            <p className="text-xs uppercase tracking-wider font-mono">/// NO FLEET ASSETS REGISTERED ///</p>
            <Link to="/vehicles" className="text-xs text-[#FF7844] hover:underline mt-2 inline-block uppercase font-bold font-mono">
              &gt;&gt; REGISTER VEHICLE ASSET NOW
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {healthData &&
              Object.entries(healthData.subsystems).map(([subsystemKey, info]) => (
                <div
                  key={subsystemKey}
                  className="bg-[#13111C] border-2 border-black p-4 shadow-[3px_3px_0px_#000000] flex flex-col justify-between hover:shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider font-sans">
                        {subsystemKey.replace('_', ' ')}
                      </span>
                      {getStatusBadge(info.status)}
                    </div>
                    <div className="text-[10px] text-neutral-400 uppercase mt-2 font-mono">
                      // LAST_ASSESSED:{' '}
                      <span className="text-neutral-200 font-bold">
                        {info.last_assessed ? info.last_assessed.slice(0, 10) : 'NEVER'}
                      </span>
                    </div>
                  </div>

                  {info.status !== 'Not Assessed' && (
                    <div className="mt-3 pt-3 border-t border-black/60 text-[10px] flex justify-between text-neutral-300 uppercase font-mono">
                      <span>EVIDENCE_MATCH:</span>
                      <span className="font-bold text-[#FF7844]">{info.evidence_score}%</span>
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
        <div className="bg-[#1E1A29] border-3 border-black p-6 shadow-[4px_4px_0px_#000000]">
          <div className="mb-4 border-b-2 border-black pb-3">
            <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
              [ KNOWLEDGE_BASE_DISTRIBUTION // SUBSYSTEM_COVERAGE ]
            </h3>
            <p className="text-[10px] text-neutral-300 uppercase tracking-wide mt-0.5 font-mono">
              QUANTITATIVE RULE DOMAIN COVERAGE
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#B8B0C8" fontSize={10} fontFamily="monospace" />
                <YAxis dataKey="name" type="category" stroke="#B8B0C8" fontSize={9} width={120} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1A29',
                    borderColor: '#000000',
                    borderWidth: 2,
                    boxShadow: '3px 3px 0px #000000',
                    color: '#FFFDF9',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#FF7844" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="bg-[#1E1A29] border-3 border-black p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                  [ RECENT_DIAGNOSTIC_REPORTS ]
                </h3>
                <p className="text-[10px] text-neutral-300 uppercase tracking-wide mt-0.5 font-mono">
                  AUDIT LOG IMMUTABLE DOSSIERS
                </p>
              </div>
              <Link to="/reports" className="text-xs text-[#FF7844] hover:underline flex items-center gap-1 uppercase font-bold font-mono">
                VIEW_ALL &gt;&gt;
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs uppercase font-mono">
                /// NO DIAGNOSTIC SESSIONS RECORDED ///
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.slice(0, 4).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-between font-mono"
                  >
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-wider font-sans">
                        {rep.report_code} // {rep.category.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-neutral-400 uppercase mt-0.5 font-mono">
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
