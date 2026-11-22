import React, { useState, useEffect } from 'react';
import { Wrench, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [records, setRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [dueAlerts, setDueAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Maintenance Form
  const [formData, setFormData] = useState({
    item_type: 'Engine Oil & Filter Replacement',
    service_date: new Date().toISOString().slice(0, 10),
    odometer_km: '',
    notes: '',
    interval_km: 10000,
    interval_days: 365,
  });

  const loadData = async () => {
    try {
      const vList = await api.getVehicles();
      setVehicles(vList);
      if (vList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vList[0].id);
      }
      const mData = await api.getMaintenance(selectedVehicleId);
      setRecords(mData.records || []);
      setReminders(mData.reminders || []);
      setDueAlerts(mData.due_alerts || []);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVehicleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Select or register a vehicle unit first.');
      return;
    }

    try {
      await api.createMaintenance({
        vehicle_id: Number(selectedVehicleId),
        item_type: formData.item_type,
        service_date: formData.service_date,
        odometer_km: Number(formData.odometer_km) || 0,
        notes: formData.notes,
        interval_km: Number(formData.interval_km) || null,
        interval_days: Number(formData.interval_days) || null,
      });

      setShowModal(false);
      setFormData({
        item_type: 'Engine Oil & Filter Replacement',
        service_date: new Date().toISOString().slice(0, 10),
        odometer_km: '',
        notes: '',
        interval_km: 10000,
        interval_days: 365,
      });
      loadData();
    } catch (err) {
      alert(`Error logging maintenance: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; PREVENTIVE_LIFECYCLE // SERVICE_LOGGER &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ PREVENTIVE_MAINTENANCE // LIFECYCLE_MONITOR ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            LOG SERVICE MILESTONES, CALIBRATE COMPONENT INTERVALS &amp; INTERCEPT OVERDUE WEAR.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {vehicles.length > 0 && (
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-[#0A0A0A] border border-[#333333] text-xs font-mono uppercase text-[#EAEAEA] rounded-none px-3 py-2 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.manufacturer} {v.model} ({v.registration_no || 'NO_REG'})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>[ LOG_SERVICE_ENTRY ]</span>
          </button>
        </div>
      </div>

      {/* Due Alerts Section */}
      {dueAlerts.length > 0 && (
        <div className="p-4 bg-black border-2 border-[#E61919] rounded-none space-y-2 font-mono">
          <div className="flex items-center gap-2 text-[#E61919] font-black text-xs uppercase tracking-widest">
            <AlertCircle className="w-4 h-4 text-[#E61919]" />
            <span>[ !!! CRITICAL_SERVICE_MILESTONES_OVERDUE ({dueAlerts.length}) !!! ]</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {dueAlerts.map((d, i) => (
              <div key={i} className="p-3 bg-[#121212] border border-[#E61919]/50 rounded-none text-xs">
                <div className="font-black text-[#EAEAEA] uppercase">{d.item_type}</div>
                <div className="text-neutral-400 text-[10px] uppercase mt-0.5 font-bold">
                  NEXT_DUE: {d.next_due_km ? `${d.next_due_km.toLocaleString()} KM` : d.next_due_date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Records Timeline & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Records Table */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4 font-mono">
          <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-[#262626] pb-3">
            <Wrench className="w-4 h-4 text-[#E61919]" />
            <span>[ COMPLETED_SERVICE_HISTORY // COUNT: {records.length} ]</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-500 uppercase tracking-widest">
              /// RETRIEVING SERVICE RECORDS... ///
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral-500 uppercase tracking-wider">
              /// NO MAINTENANCE RECORDS LOGGED FOR THIS VEHICLE UNIT ///
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-[#0A0A0A] border border-[#262626] rounded-none flex items-start justify-between gap-4 font-mono"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#EAEAEA] uppercase">{r.item_type}</h4>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-3 uppercase">
                      <span>DATE: {r.service_date}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-neutral-300 font-bold">
                        ODOMETER: {r.odometer_km?.toLocaleString()} KM
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-neutral-400 italic pt-1">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#4AF626] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders Card */}
        <div className="bg-[#121212] border border-[#262626] rounded-none p-5 space-y-4 h-fit font-mono">
          <h3 className="text-xs font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-[#262626] pb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>[ ACTIVE_SERVICE_INTERVALS // COUNT: {reminders.length} ]</span>
          </h3>

          {reminders.length === 0 ? (
            <div className="text-xs text-neutral-500 uppercase tracking-wider italic py-4">
              /// NO ACTIVE INTERVALS CONFIGURED ///
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <div key={rem.id} className="p-3 bg-[#0A0A0A] border border-[#262626] rounded-none text-xs space-y-1">
                  <div className="font-black text-[#EAEAEA] uppercase">{rem.item_type}</div>
                  <div className="text-[10px] text-neutral-400 flex justify-between uppercase">
                    <span>INTERVAL:</span>
                    <span className="font-bold text-neutral-300">
                      {rem.interval_km ? `${rem.interval_km.toLocaleString()} KM` : `${rem.interval_days} DAYS`}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 flex justify-between uppercase">
                    <span>STATUS:</span>
                    <span className="font-bold text-[#E61919]">[ {rem.status.toUpperCase()} ]</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border-2 border-[#E61919] rounded-none max-w-md w-full p-6 shadow-none font-mono">
            <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-widest mb-1">
              [ LOG_SERVICE_COMPLETION_RECORD ]
            </h3>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-5">
              RECORD SERVICE EVENT &amp; AUTO-SCHEDULE SUBSEQUENT LIFECYCLE MILESTONE.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                  // SERVICE_ITEM:
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // DATE:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // ODOMETER (KM):
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="E.G. 45000"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // NEXT_INTERVAL (KM):
                  </label>
                  <input
                    type="number"
                    value={formData.interval_km}
                    onChange={(e) => setFormData({ ...formData, interval_km: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // NEXT_INTERVAL (DAYS):
                  </label>
                  <input
                    type="number"
                    value={formData.interval_days}
                    onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                  // TECHNICIAN_NOTES:
                </label>
                <textarea
                  rows={2}
                  placeholder="E.G. REPLACED FLUID WITH 5W-30 SYNTHETIC, INSPECTED BELTS"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-neutral-900 border border-[#333333] text-neutral-300 font-mono text-xs uppercase rounded-none"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-none border border-[#E61919]"
                >
                  [ RECORD_SERVICE ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
