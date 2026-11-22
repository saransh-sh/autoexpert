import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ShieldAlert, Filter, Layers, CheckCircle } from 'lucide-react';
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Symbolic Knowledge Base Inspector</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse and inspect all validated IF-THEN diagnostic and maintenance rules ({totalMatches} of {totalKbRules} shown).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search rules, premises, IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="">All Diagnostic Categories</option>
          <option value="engine">Engine</option>
          <option value="electrical">Electrical</option>
          <option value="transmission">Transmission</option>
          <option value="brakes">Brakes</option>
          <option value="cooling_lubrication">Cooling & Lubrication</option>
          <option value="suspension_tyres">Suspension & Tyres</option>
          <option value="fuel_system">Fuel System</option>
          <option value="maintenance">Maintenance</option>
        </select>

        {/* Vehicle Filter */}
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="">All Vehicle Types</option>
          <option value="motorcycle">Motorcycle Rules</option>
          <option value="car">Car Rules</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="">All Severity Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">Loading knowledge base rules...</div>
      ) : rules.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-200">No matching rules found</h3>
          <p className="text-xs text-slate-400 mt-1">Try relaxing search or filter parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const isCritical = rule.safety_critical;
            return (
              <div
                key={rule.rule_id}
                className={`bg-card border rounded-xl p-5 space-y-3.5 transition ${
                  isCritical ? 'border-red-900/60 shadow-sm shadow-red-950/30' : 'border-border'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {rule.rule_id}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {rule.category}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1 uppercase tracking-wider">
                          <ShieldAlert className="w-3 h-3" /> Safety Critical
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5">{rule.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      Specificity: {rule.conditions.length} conds
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      Priority: {rule.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        rule.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : rule.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                </div>

                {/* Conditions (IF) */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    IF Premise Conditions (All must be TRUE):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.map((cond, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300"
                      >
                        {cond.fact} <span className="text-primary">{cond.operator}</span> {String(cond.value)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Derived Facts & Conclusion (THEN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  {rule.derived_facts?.length > 0 && (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-xs">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Assert Derived Intermediate Facts:
                      </span>
                      <div className="font-mono text-emerald-300">
                        {rule.derived_facts.map((df) => `+${df.fact} = ${df.value}`).join(', ')}
                      </div>
                    </div>
                  )}

                  {rule.conclusion && (
                    <div className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                        Deduce Diagnostic Conclusion:
                      </span>
                      <div className="font-bold text-slate-200">
                        {rule.conclusion.title}{' '}
                        <span className="font-mono font-normal text-slate-400">
                          ({rule.conclusion.fault_id})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Template & Recommended Action */}
                <div className="text-xs text-slate-300 pt-1 space-y-1">
                  <div>
                    <strong className="text-slate-400">Explanation: </strong>
                    <span className="italic">{rule.explanation_template}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Action: </strong>
                    <span>{rule.recommended_action}</span>
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
