import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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
      alert('Please register or select a vehicle first.');
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Preventive Maintenance & Service Records</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log routine services, set custom inspection intervals, and monitor upcoming service milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {vehicles.length > 0 && (
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="bg-card border border-border text-xs text-slate-300 rounded-lg px-3 py-2"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.manufacturer} {v.model}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Service</span>
          </button>
        </div>
      </div>

      {/* Due Alerts Section */}
      {dueAlerts.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Service Due Notices ({dueAlerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {dueAlerts.map((d, i) => (
              <div key={i} className="p-3 bg-slate-950/60 rounded-lg border border-amber-500/20 text-xs">
                <div className="font-bold text-white">{d.item_type}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Next Due: {d.next_due_km ? `${d.next_due_km.toLocaleString()} km` : d.next_due_date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Records Timeline & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Records Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span>Completed Service History ({records.length})</span>
          </h3>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading service history...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No maintenance records logged for this vehicle yet.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{r.item_type}</h4>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Date: {r.service_date}</span>
                      <span>&bull;</span>
                      <span className="font-mono">Odometer: {r.odometer_km?.toLocaleString()} km</span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-slate-400 italic pt-1">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span>Active Service Intervals ({reminders.length})</span>
          </h3>

          {reminders.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4">No active reminders configured.</div>
          ) : (
            <div className="space-y-3">
              {reminders.map((rem) => (
                <div key={rem.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-slate-200">{rem.item_type}</div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Interval:</span>
                    <span>{rem.interval_km ? `${rem.interval_km.toLocaleString()} km` : `${rem.interval_days} days`}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize font-semibold text-primary">{rem.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Log Completed Service</h3>
            <p className="text-xs text-slate-400 mb-5">
              Record maintenance details and automatically calculate the next service due milestone.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Service Item</label>
                <input
                  type="text"
                  required
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Next Interval (km)</label>
                  <input
                    type="number"
                    value={formData.interval_km}
                    onChange={(e) => setFormData({ ...formData, interval_km: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Next Interval (days)</label>
                  <input
                    type="number"
                    value={formData.interval_days}
                    onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Mechanic / Service Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Replaced oil with 5W-30 synthetic, new filter, inspected belts"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold"
                >
                  Record Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
