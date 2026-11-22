import React, { useState, useEffect } from 'react';
import { Wrench, Plus, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ PREVENTIVE_LIFECYCLE // SERVICE_LOGGER ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            PREVENTIVE MAINTENANCE // LIFECYCLE MONITOR
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            LOG SERVICE MILESTONES, CALIBRATE COMPONENT INTERVALS &amp; INTERCEPT OVERDUE WEAR.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {vehicles.length > 0 && (
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-[#1E1A29] border-2 border-black text-xs font-mono uppercase font-bold text-white px-3 py-2 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none cursor-pointer"
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
            className="px-4 py-2 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>[ LOG_SERVICE_ENTRY ]</span>
          </button>
        </div>
      </div>

      {/* Due Alerts Section */}
      {dueAlerts.length > 0 && (
        <div className="p-5 bg-[#2C131D] border-3 border-black shadow-[6px_6px_0px_#FF4785] space-y-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-[#FF4785] text-white font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] -rotate-1 text-xs inline-flex items-center gap-1.5 uppercase font-mono">
              <AlertCircle className="w-4 h-4" />
              [ !!! CRITICAL_SERVICE_MILESTONES_OVERDUE ({dueAlerts.length}) !!! ]
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {dueAlerts.map((d, i) => (
              <div key={i} className="p-3.5 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs font-mono">
                <div className="font-black text-white uppercase font-sans text-sm">{d.item_type}</div>
                <div className="text-[#FED156] text-[10px] uppercase mt-1 font-bold">
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
        <div className="lg:col-span-2 bg-[#1E1A29] border-3 border-black p-5 space-y-4 font-mono shadow-[4px_4px_0px_#000000]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b-2 border-black pb-3 font-mono">
            <Wrench className="w-4 h-4 text-[#FF7844]" />
            <span>[ COMPLETED_SERVICE_HISTORY // COUNT: {records.length} ]</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-400 uppercase tracking-widest font-mono">
              /// RETRIEVING SERVICE RECORDS... ///
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral-400 uppercase tracking-wider font-mono">
              /// NO MAINTENANCE RECORDS LOGGED FOR THIS VEHICLE UNIT ///
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-[#13111C] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-start justify-between gap-4 font-mono hover:shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase font-sans">{r.item_type}</h4>
                    <div className="text-[11px] text-neutral-300 flex items-center gap-3 uppercase font-mono">
                      <span>DATE: {r.service_date}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-[#49D49D] font-bold">
                        ODOMETER: {r.odometer_km?.toLocaleString()} KM
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-neutral-300 italic pt-1 font-mono">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#49D49D] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders Card */}
        <div className="bg-[#1E1A29] border-3 border-black p-5 space-y-4 h-fit font-mono shadow-[4px_4px_0px_#000000]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b-2 border-black pb-3 font-mono">
            <Clock className="w-4 h-4 text-[#FED156]" />
            <span>[ ACTIVE_SERVICE_INTERVALS // COUNT: {reminders.length} ]</span>
          </h3>

          {reminders.length === 0 ? (
            <div className="text-xs text-neutral-400 uppercase tracking-wider italic py-4 font-mono">
              /// NO ACTIVE INTERVALS CONFIGURED ///
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <div key={rem.id} className="p-3 bg-[#13111C] border-2 border-black shadow-[2px_2px_0px_#000000] text-xs space-y-1 font-mono">
                  <div className="font-black text-white uppercase font-sans">{rem.item_type}</div>
                  <div className="text-[10px] text-neutral-300 flex justify-between uppercase font-mono">
                    <span>INTERVAL:</span>
                    <span className="font-bold text-[#49D49D]">
                      {rem.interval_km ? `${rem.interval_km.toLocaleString()} KM` : `${rem.interval_days} DAYS`}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-300 flex justify-between uppercase font-mono">
                    <span>STATUS:</span>
                    <span className="font-black text-[#FF7844]">[ {rem.status.toUpperCase()} ]</span>
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
          <div className="bg-[#1E1A29] border-3 border-black max-w-md w-full p-6 shadow-[8px_8px_0px_#FF7844] font-mono">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 font-sans">
              [ LOG_SERVICE_COMPLETION_RECORD ]
            </h3>
            <p className="text-[11px] text-neutral-300 uppercase tracking-wide mb-5 font-mono">
              RECORD SERVICE EVENT &amp; AUTO-SCHEDULE SUBSEQUENT LIFECYCLE MILESTONE.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                  // SERVICE_ITEM:
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // DATE:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // ODOMETER (KM):
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="E.G. 45000"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // NEXT_INTERVAL (KM):
                  </label>
                  <input
                    type="number"
                    value={formData.interval_km}
                    onChange={(e) => setFormData({ ...formData, interval_km: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // NEXT_INTERVAL (DAYS):
                  </label>
                  <input
                    type="number"
                    value={formData.interval_days}
                    onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                  // TECHNICIAN_NOTES:
                </label>
                <textarea
                  rows={2}
                  placeholder="E.G. REPLACED FLUID WITH 5W-30 SYNTHETIC, INSPECTED BELTS"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#13111C] border-2 border-black p-2.5 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#161320] hover:bg-[#262135] border-2 border-black text-neutral-200 font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] transition-all"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#49D49D] hover:bg-[#2DE1C2] text-black font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
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
