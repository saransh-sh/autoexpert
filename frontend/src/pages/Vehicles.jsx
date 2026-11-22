import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Car, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vehicle_type: 'car',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'petrol',
    cooling_type: 'liquid_cooled',
    displacement_cc: '',
    transmission: 'automatic',
    odometer_km: 0,
    registration_no: '',
    spec_provenance: 'User-Entered',
  });

  const loadVehicles = async () => {
    try {
      const data = await api.getVehicles(filterType);
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        displacement_cc: formData.displacement_cc ? Number(formData.displacement_cc) : null,
        odometer_km: Number(formData.odometer_km) || 0,
        spec_source: {
          spec_accuracy: formData.spec_provenance,
          source_note: 'Entered during vehicle registration profile creation',
        },
      };
      await api.createVehicle(payload);
      setShowModal(false);
      setFormData({
        vehicle_type: 'car',
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: 'petrol',
        cooling_type: 'liquid_cooled',
        displacement_cc: '',
        transmission: 'automatic',
        odometer_km: 0,
        registration_no: '',
        spec_provenance: 'User-Entered',
      });
      loadVehicles();
    } catch (err) {
      alert(`Error creating vehicle: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vehicle and all associated reports?')) {
      try {
        await api.deleteVehicle(id);
        loadVehicles();
      } catch (err) {
        alert(`Error deleting vehicle: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Vehicle Profiles & Fleet Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Register motorcycles and cars with specification provenance tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-card border border-border text-xs text-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">All Vehicle Types</option>
            <option value="motorcycle">Motorcycles Only</option>
            <option value="car">Cars Only</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-slate-400">
          <Car className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No vehicles registered</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your motorcycle or car to start diagnostic sessions and track component health.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const specSource = v.spec_source?.spec_accuracy || 'User-Entered';
            return (
              <div
                key={v.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {v.vehicle_type}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-1.5">
                        {v.year} {v.manufacturer} {v.model}
                      </h3>
                      {v.registration_no && (
                        <span className="text-xs font-mono text-slate-400">
                          Reg: {v.registration_no}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attributes list */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-800 my-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cooling Type:</span>
                      <span className="font-medium text-slate-200 capitalize">
                        {v.cooling_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Transmission:</span>
                      <span className="font-medium text-slate-200 capitalize">
                        {v.transmission}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Engine Size:</span>
                      <span className="font-medium text-slate-200">
                        {v.displacement_cc ? `${v.displacement_cc} cc` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Odometer:</span>
                      <span className="font-medium text-slate-200 font-mono">
                        {v.odometer_km?.toLocaleString()} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Provenance Badge Footer */}
                <div className="pt-2 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      specSource === 'Verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : specSource === 'Estimated / Needs Confirmation'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    Spec: {specSource}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Added {v.created_at?.slice(0, 10)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Register Vehicle Profile</h3>
            <p className="text-xs text-slate-400 mb-5">
              Enter vehicle details. Specifications are explicitly tagged with data provenance.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="car">Car / Automobile</option>
                    <option value="motorcycle">Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Honda, Yamaha, Toyota"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Civic, MT-07, Corolla"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cooling Type</label>
                  <select
                    value={formData.cooling_type}
                    onChange={(e) => setFormData({ ...formData, cooling_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="liquid_cooled">Liquid Cooled</option>
                    <option value="air_cooled">Air Cooled</option>
                    <option value="oil_cooled">Oil Cooled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Displacement (cc)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1996"
                    value={formData.displacement_cc}
                    onChange={(e) => setFormData({ ...formData, displacement_cc: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Specification Provenance</label>
                  <select
                    value={formData.spec_provenance}
                    onChange={(e) => setFormData({ ...formData, spec_provenance: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="User-Entered">User-Entered</option>
                    <option value="Verified">Verified from Manual</option>
                    <option value="Estimated / Needs Confirmation">Estimated / Needs Confirmation</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
