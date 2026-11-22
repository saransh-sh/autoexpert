import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Car } from 'lucide-react';
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
    if (confirm('CONFIRM PURGE: Delete this vehicle and all associated historical reports?')) {
      try {
        await api.deleteVehicle(id);
        loadVehicles();
      } catch (err) {
        alert(`Error deleting vehicle: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <span className="text-[10px] text-[#E61919] uppercase tracking-widest block mb-1">
            &lt; FLEET_REGISTRY // ASSET_PROVENANCE_MATRIX &gt;
          </span>
          <h2 className="text-xl font-black text-[#EAEAEA] uppercase tracking-tight font-mono">
            [ REGISTRY // VEHICLE_FLEET_INVENTORY ]
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-wide">
            REGISTER MOTORCYCLES AND AUTOMOBILES WITH EXPLICIT DATA PROVENANCE ATTESTATION.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0A0A0A] border border-[#333333] text-xs font-mono uppercase text-[#EAEAEA] rounded-none px-3 py-2 focus:outline-none"
          >
            <option value="">ALL VEHICLE PLATFORMS</option>
            <option value="motorcycle">MOTORCYCLES ONLY</option>
            <option value="car">AUTOMOBILES ONLY</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#E61919] flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>[ ADD_FLEET_UNIT ]</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-16 text-neutral-500 text-xs uppercase tracking-widest font-mono">
          /// RETRIEVING REGISTERED ASSET DOSSIERS... ///
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-[#121212] border border-[#262626] rounded-none p-12 text-center text-neutral-500 font-mono">
          <Car className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
          <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-wider">
            /// NO MONITORED FLEET ASSETS REGISTERED IN DATABASE ///
          </h3>
          <p className="text-xs text-neutral-500 mt-1 uppercase max-w-sm mx-auto">
            Add your motorcycle or car profile to enable deterministic diagnostic sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const specSource = v.spec_source?.spec_accuracy || 'User-Entered';
            return (
              <div
                key={v.id}
                className="bg-[#121212] border border-[#262626] rounded-none p-5 flex flex-col justify-between hover:border-[#E61919] transition font-mono relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase bg-black text-[#EAEAEA] border border-[#333333] px-2 py-0.5 rounded-none">
                        [ {v.vehicle_type.toUpperCase()} ]
                      </span>
                      <h3 className="text-base font-black text-[#EAEAEA] uppercase tracking-wide mt-2">
                        {v.year} {v.manufacturer} {v.model}
                      </h3>
                      {v.registration_no && (
                        <span className="text-xs font-mono text-[#E61919] font-bold block mt-0.5">
                          REG_ID: [ {v.registration_no} ]
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-neutral-500 hover:text-[#E61919] border border-transparent hover:border-[#E61919] hover:bg-[#0A0A0A] rounded-none transition"
                      title="Purge Vehicle Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attributes Matrix */}
                  <div className="grid grid-cols-2 gap-px bg-[#262626] border border-[#262626] my-3">
                    <div className="bg-[#0A0A0A] p-2.5 rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// COOLING_SYS:</span>
                      <span className="font-bold text-neutral-300 uppercase text-xs">
                        {v.cooling_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="bg-[#0A0A0A] p-2.5 rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// TRANSMISSION:</span>
                      <span className="font-bold text-neutral-300 uppercase text-xs">
                        {v.transmission}
                      </span>
                    </div>
                    <div className="bg-[#0A0A0A] p-2.5 rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// DISPLACEMENT:</span>
                      <span className="font-bold text-neutral-300 text-xs">
                        {v.displacement_cc ? `${v.displacement_cc} CC` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-[#0A0A0A] p-2.5 rounded-none">
                      <span className="text-neutral-500 text-[10px] block uppercase">// ODOMETER_LOG:</span>
                      <span className="font-bold text-neutral-300 font-mono text-xs">
                        {v.odometer_km?.toLocaleString()} KM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Provenance Badge Footer */}
                <div className="pt-2 border-t border-[#1E1E1E] flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-none border ${
                      specSource === 'Verified'
                        ? 'border-[#4AF626] text-[#4AF626] bg-black'
                        : specSource === 'Estimated / Needs Confirmation'
                        ? 'border-[#E61919] text-[#E61919] bg-black'
                        : 'border-[#333333] text-neutral-400 bg-black'
                    }`}
                  >
                    [ PROVENANCE: {specSource.toUpperCase()} ]
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase">
                    LOGGED: {v.created_at?.slice(0, 10)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border-2 border-[#E61919] rounded-none max-w-lg w-full p-6 shadow-none font-mono">
            <h3 className="text-sm font-black text-[#EAEAEA] uppercase tracking-widest mb-1">
              [ NEW_ASSET_ENTRY_PROTOCOL // REGISTRATION ]
            </h3>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-5">
              INPUT SPECIFICATIONS. ALL FIELDS ARE TAGGED WITH DATA PROVENANCE AUDIT METADATA.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // VEHICLE_PLATFORM:
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  >
                    <option value="car">CAR / AUTOMOBILE</option>
                    <option value="motorcycle">MOTORCYCLE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // MODEL_YEAR:
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // MANUFACTURER:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. HONDA, YAMAHA, TOYOTA"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // MODEL_NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. CIVIC, MT-07, COROLLA"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // COOLING:
                  </label>
                  <select
                    value={formData.cooling_type}
                    onChange={(e) => setFormData({ ...formData, cooling_type: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  >
                    <option value="liquid_cooled">LIQUID COOLED</option>
                    <option value="air_cooled">AIR COOLED</option>
                    <option value="oil_cooled">OIL COOLED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // TRANS:
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  >
                    <option value="manual">MANUAL</option>
                    <option value="automatic">AUTOMATIC</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // DISPL (CC):
                  </label>
                  <input
                    type="number"
                    placeholder="E.G. 1996"
                    value={formData.displacement_cc}
                    onChange={(e) => setFormData({ ...formData, displacement_cc: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // ODOMETER (KM):
                  </label>
                  <input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    // REG_NO (PLATE):
                  </label>
                  <input
                    type="text"
                    placeholder="E.G. MH-12-AB-1234"
                    value={formData.registration_no}
                    onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                  // SPECIFICATION_PROVENANCE_ATTESTATION:
                </label>
                <select
                  value={formData.spec_provenance}
                  onChange={(e) => setFormData({ ...formData, spec_provenance: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-none p-2 text-xs text-[#EAEAEA] font-mono uppercase focus:border-[#E61919] focus:outline-none"
                >
                  <option value="User-Entered">USER-ENTERED (OPERATOR OBSERVATION)</option>
                  <option value="Verified">VERIFIED FROM OEM MANUAL</option>
                  <option value="Estimated / Needs Confirmation">ESTIMATED / NEEDS CONFIRMATION</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-neutral-900 border border-[#333333] text-neutral-300 font-mono text-xs uppercase rounded-none"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E61919] hover:bg-[#FF2A2A] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-none border border-[#E61919]"
                >
                  [ COMMIT_RECORD ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
