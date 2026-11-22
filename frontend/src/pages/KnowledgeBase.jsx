import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] font-mono uppercase tracking-widest block mb-1">
            &lt; KB_SPEC_INDEX // SYMBOLIC_RULE_INSPECTOR &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ SYMBOLIC_KNOWLEDGE_BASE // RULE_REGISTRY ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            INSPECT VALIDATED IF-THEN RULES IN PRODUCTION RUNTIME ([ {totalMatches} / {totalKbRules} ] ACTIVE RULES MATCHED).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Blueprint Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#262626] border border-[#262626]">
        {/* Search Input */}
        <div className="relative bg-[#0A0A0A] p-1 flex items-center">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3" />
          <input
            type="text"
            placeholder="SEARCH RULES, PREMISES, IDS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent pl-8 pr-3 py-2 text-xs text-[#EAEAEA] font-mono uppercase placeholder-neutral-600 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#0A0A0A] p-3 text-xs text-[#EAEAEA] font-mono uppercase focus:outline-none"
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
          className="bg-[#0A0A0A] p-3 text-xs text-[#EAEAEA] font-mono uppercase focus:outline-none"
        >
          <option value="">ALL VEHICLE PLATFORMS</option>
          <option value="motorcycle">MOTORCYCLE RULES</option>
          <option value="car">CAR / AUTOMOBILE RULES</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-[#0A0A0A] p-3 text-xs text-[#EAEAEA] font-mono uppercase focus:outline-none"
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
        <div className="text-center py-16 text-xs text-neutral-500 uppercase tracking-widest font-mono">
          /// QUERYING SYMBOLIC RULE MATRIX... ///
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-[#121212] border border-[#262626] rounded-none p-12 text-center text-neutral-500 font-mono">
          <BookOpen className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
          <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wider">
            /// NO MATCHING PRODUCTION RULES LOCATED ///
          </h3>
          <p className="text-xs text-neutral-500 mt-1 uppercase">
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
                className={`bg-[#121212] border rounded-none p-5 space-y-3.5 transition font-mono ${
                  isCritical ? 'border-2 border-[#E61919]' : 'border-[#262626]'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#1E1E1E]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-black bg-[#EAEAEA] px-2 py-0.5 rounded-none border border-[#EAEAEA]">
                        [ {rule.rule_id} ]
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        DOMAIN: {rule.category.toUpperCase()}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-none bg-[#E61919] text-white flex items-center gap-1 uppercase tracking-widest">
                          <ShieldAlert className="w-3.5 h-3.5" /> [ CRITICAL_SAFETY_HALT ]
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wide mt-2">
                      {rule.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-none bg-[#0A0A0A] border border-[#262626] text-neutral-300 font-mono text-[10px] uppercase">
                      SPEC: {rule.conditions.length} CONDS
                    </span>
                    <span className="px-2 py-0.5 rounded-none bg-[#0A0A0A] border border-[#262626] text-neutral-300 font-mono text-[10px] uppercase">
                      PRIORITY: {rule.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-none font-mono font-bold uppercase text-[10px] border ${
                        rule.severity === 'critical'
                          ? 'border-[#E61919] text-[#E61919] bg-black'
                          : rule.severity === 'high'
                          ? 'border-[#F59E0B] text-[#F59E0B] bg-black'
                          : 'border-cyan-500 text-cyan-400 bg-black'
                      }`}
                    >
                      [ {rule.severity.toUpperCase()} ]
                    </span>
                  </div>
                </div>

                {/* Conditions (IF) */}
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                    // IF PREMISE CONDITIONS (ALL MUST SATISFY 3VL CONSTRAINTS):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.map((cond, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-[#0A0A0A] border border-[#262626] rounded-none font-mono text-xs text-neutral-300"
                      >
                        {cond.fact} <span className="text-[#E61919] font-bold">{cond.operator}</span>{' '}
                        {String(cond.value)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Derived Facts & Conclusion (THEN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1E1E1E]">
                  {rule.derived_facts?.length > 0 && (
                    <div className="p-3 bg-[#0A0A0A] border-l-2 border-l-[#4AF626] border border-[#262626] rounded-none text-xs">
                      <span className="text-[10px] font-black text-[#4AF626] uppercase tracking-widest block mb-1">
                        // ASSERT DERIVED INTERMEDIATE FACTS:
                      </span>
                      <div className="font-mono text-[#4AF626]">
                        {rule.derived_facts.map((df) => `+${df.fact} = ${df.value}`).join(', ')}
                      </div>
                    </div>
                  )}

                  {rule.conclusion && (
                    <div className="p-3 bg-[#0A0A0A] border-l-2 border-l-[#E61919] border border-[#262626] rounded-none text-xs">
                      <span className="text-[10px] font-black text-[#E61919] uppercase tracking-widest block mb-1">
                        // DEDUCE DIAGNOSTIC CONCLUSION:
                      </span>
                      <div className="font-black text-[#EAEAEA] uppercase">
                        {rule.conclusion.title}{' '}
                        <span className="font-mono font-normal text-neutral-500">
                          [ {rule.conclusion.fault_id} ]
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Template & Recommended Action */}
                <div className="text-xs text-neutral-400 pt-1 space-y-1 bg-[#0A0A0A] p-3 border border-[#262626]">
                  <div>
                    <strong className="text-neutral-500 uppercase">// EXPLANATION_TEMPLATE: </strong>
                    <span className="text-neutral-300 italic">"{rule.explanation_template}"</span>
                  </div>
                  <div className="pt-1">
                    <strong className="text-neutral-500 uppercase">// RECOMMENDED_ACTION: </strong>
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
