import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBase() {
  const [rules, setRules] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalKbRules, setTotalKbRules] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (vehicleType) params.vehicle_type = vehicleType;
      if (severity) params.severity = severity;

      const data = await api.getRules(params);
      setRules(data.rules || []);
      setTotalMatches(data.total_matches || 0);
      setTotalKbRules(data.total_kb_rules || 0);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadRules, 250);
    return () => clearTimeout(timer);
  }, [search, category, vehicleType, severity]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ KB_SPEC_INDEX // SYMBOLIC_RULE_INSPECTOR ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            SYMBOLIC KNOWLEDGE BASE // RULE REGISTRY
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            INSPECT VALIDATED IF-THEN RULES IN PRODUCTION RUNTIME ([ {totalMatches} / {totalKbRules} ] ACTIVE RULES MATCHED).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative bg-[#1E1A29] border-2 border-black shadow-[3px_3px_0px_#000000] p-1 flex items-center focus-within:shadow-[4px_4px_0px_#FF7844] transition-all">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3" />
          <input
            type="text"
            placeholder="SEARCH RULES, PREMISES, IDS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent pl-8 pr-3 py-2 text-xs text-white font-mono uppercase font-bold placeholder-neutral-400 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#1E1A29] border-2 border-black shadow-[3px_3px_0px_#000000] p-3 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:shadow-[4px_4px_0px_#FF7844] transition-all cursor-pointer"
        >
          <option value="">ALL DIAGNOSTIC DOMAINS</option>
          <option value="engine">ENGINE &amp; PERFORMANCE</option>
          <option value="electrical">ELECTRICAL &amp; STARTING</option>
          <option value="transmission">TRANSMISSION &amp; CLUTCH</option>
          <option value="brakes">BRAKING SYSTEM</option>
          <option value="cooling_lubrication">COOLING &amp; LUBRICATION</option>
          <option value="suspension_tyres">SUSPENSION &amp; TYRES</option>
          <option value="fuel_system">FUEL SYSTEM</option>
          <option value="maintenance">PREVENTIVE MAINTENANCE</option>
        </select>

        {/* Vehicle Filter */}
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="bg-[#1E1A29] border-2 border-black shadow-[3px_3px_0px_#000000] p-3 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:shadow-[4px_4px_0px_#FF7844] transition-all cursor-pointer"
        >
          <option value="">ALL VEHICLE PLATFORMS</option>
          <option value="motorcycle">MOTORCYCLE RULES</option>
          <option value="car">CAR / AUTOMOBILE RULES</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-[#1E1A29] border-2 border-black shadow-[3px_3px_0px_#000000] p-3 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:shadow-[4px_4px_0px_#FF7844] transition-all cursor-pointer"
        >
          <option value="">ALL SEVERITY LEVELS</option>
          <option value="low">SEVERITY: LOW</option>
          <option value="medium">SEVERITY: MEDIUM</option>
          <option value="high">SEVERITY: HIGH</option>
          <option value="critical">SEVERITY: CRITICAL</option>
        </select>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-neutral-400 uppercase tracking-widest font-mono">
          /// QUERYING SYMBOLIC RULE MATRIX... ///
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-[#1E1A29] border-3 border-black p-12 text-center text-neutral-400 font-mono shadow-[4px_4px_0px_#000000]">
          <BookOpen className="w-10 h-10 mx-auto text-neutral-500 mb-2" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
            /// NO MATCHING PRODUCTION RULES LOCATED ///
          </h3>
          <p className="text-xs text-neutral-400 mt-1 uppercase">
            Adjust filter parameters or clear search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const isCritical = rule.safety_critical;
            return (
              <div
                key={rule.rule_id}
                className={`p-5 space-y-3.5 transition-all font-mono border-3 border-black ${
                  isCritical
                    ? 'bg-[#201014] shadow-[5px_5px_0px_#FF4785] hover:shadow-[7px_7px_0px_#FF4785] hover:-translate-x-0.5 hover:-translate-y-0.5'
                    : 'bg-[#1E1A29] shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-black bg-[#FED156] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] -rotate-1 inline-block">
                        [ {rule.rule_id} ]
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 font-mono">
                        DOMAIN: {rule.category.toUpperCase()}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-black px-2.5 py-1 bg-[#FF4785] text-white border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1 uppercase tracking-widest">
                          <ShieldAlert className="w-3.5 h-3.5" /> [ CRITICAL_SAFETY_HALT ]
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mt-2 font-sans">
                      {rule.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-[#13111C] border-2 border-black text-neutral-300 font-mono text-[10px] uppercase shadow-[1px_1px_0px_#000000]">
                      SPEC: {rule.conditions.length} CONDS
                    </span>
                    <span className="px-2 py-0.5 bg-[#13111C] border-2 border-black text-neutral-300 font-mono text-[10px] uppercase shadow-[1px_1px_0px_#000000]">
                      PRIORITY: {rule.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 font-mono font-black uppercase text-[10px] border-2 border-black shadow-[2px_2px_0px_#000000] ${
                        rule.severity === 'critical'
                          ? 'bg-[#FF4785] text-white'
                          : rule.severity === 'high'
                          ? 'bg-[#FED156] text-black'
                          : 'bg-[#49D49D] text-black'
                      }`}
                    >
                      [ {rule.severity.toUpperCase()} ]
                    </span>
                  </div>
                </div>

                {/* Conditions (IF) */}
                <div>
                  <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block mb-2 font-mono">
                    // IF PREMISE CONDITIONS (ALL MUST SATISFY 3VL CONSTRAINTS):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.map((cond, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-[#13111C] border-2 border-black font-mono text-xs text-white font-bold shadow-[2px_2px_0px_#000000]"
                      >
                        {cond.fact} <span className="text-[#FF7844] font-black">{cond.operator}</span>{' '}
                        {String(cond.value)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Derived Facts & Conclusion (THEN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t-2 border-black">
                  {rule.derived_facts?.length > 0 && (
                    <div className="p-3.5 bg-[#11291F] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs font-mono text-[#49D49D] font-bold">
                      <span className="text-[10px] font-black text-[#49D49D] uppercase tracking-widest block mb-1">
                        // ASSERT DERIVED INTERMEDIATE FACTS:
                      </span>
                      <div>
                        {rule.derived_facts.map((df) => `+${df.fact} = ${df.value}`).join(', ')}
                      </div>
                    </div>
                  )}

                  {rule.conclusion && (
                    <div className="p-3.5 bg-[#2D1A10] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs text-white font-black uppercase font-sans">
                      <span className="text-[10px] font-black text-[#FF7844] uppercase tracking-widest block mb-1 font-mono">
                        // DEDUCE DIAGNOSTIC CONCLUSION:
                      </span>
                      <div>
                        {rule.conclusion.title}{' '}
                        <span className="font-mono font-normal text-[#FED156] text-xs">
                          [ {rule.conclusion.fault_id} ]
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Template & Recommended Action */}
                <div className="text-xs text-neutral-200 pt-1 space-y-1.5 bg-[#13111C] p-3.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <div>
                    <strong className="text-[#FED156] uppercase font-mono">// EXPLANATION_TEMPLATE: </strong>
                    <span className="text-neutral-300 italic">"{rule.explanation_template}"</span>
                  </div>
                  <div className="pt-1">
                    <strong className="text-[#FF7844] uppercase font-mono">// RECOMMENDED_ACTION: </strong>
                    <span className="text-neutral-300">{rule.recommended_action}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
