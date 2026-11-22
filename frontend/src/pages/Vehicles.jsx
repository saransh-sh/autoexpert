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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="inline-block bg-[#FF7844] text-black border-2 border-black font-black text-[10px] px-2.5 py-0.5 uppercase shadow-[2px_2px_0px_#000000] -rotate-1 mb-2 font-mono">
            ★ FLEET MATRIX // ASSET REGISTRY ★
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            REGISTRY // VEHICLE FLEET INVENTORY
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5 uppercase tracking-wide font-mono">
            REGISTER MOTORCYCLES AND AUTOMOBILES WITH EXPLICIT DATA PROVENANCE ATTESTATION.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#1E1A29] border-2 border-black text-xs font-mono font-bold uppercase text-white px-3 py-2 shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none cursor-pointer"
          >
            <option value="">ALL VEHICLE PLATFORMS</option>
            <option value="motorcycle">MOTORCYCLES ONLY</option>
            <option value="car">AUTOMOBILES ONLY</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#FF7844] hover:bg-[#FF8800] text-black text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>[ ADD_FLEET_UNIT ]</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-16 text-neutral-400 text-xs uppercase tracking-widest font-mono">
          /// RETRIEVING REGISTERED ASSET DOSSIERS... ///
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-[#1E1A29] border-3 border-black p-12 text-center text-neutral-400 font-mono shadow-[4px_4px_0px_#000000]">
          <Car className="w-12 h-12 mx-auto text-neutral-500 mb-3" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
            /// NO MONITORED FLEET ASSETS REGISTERED IN DATABASE ///
          </h3>
          <p className="text-xs text-neutral-400 mt-1 uppercase max-w-sm mx-auto">
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
                className="bg-[#1E1A29] border-3 border-black p-5 flex flex-col justify-between shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all font-mono relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase bg-[#00E5FF] text-black border-2 border-black shadow-[2px_2px_0px_#000000] px-2 py-0.5 inline-block font-mono">
                        [ {v.vehicle_type.toUpperCase()} ]
                      </span>
                      <h3 className="text-base font-black text-white uppercase tracking-wide mt-2 font-sans">
                        {v.year} {v.manufacturer} {v.model}
                      </h3>
                      {v.registration_no && (
                        <span className="text-xs font-mono text-[#FED156] font-bold block mt-0.5">
                          REG_ID: [ {v.registration_no} ]
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-neutral-400 hover:text-white bg-[#13111C] hover:bg-[#FF4785] border-2 border-black shadow-[2px_2px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                      title="Purge Vehicle Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attributes Matrix */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-[#13111C] border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// COOLING_SYS:</span>
                      <span className="font-bold text-white uppercase text-xs font-mono">
                        {v.cooling_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="bg-[#13111C] border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// TRANSMISSION:</span>
                      <span className="font-bold text-white uppercase text-xs font-mono">
                        {v.transmission}
                      </span>
                    </div>
                    <div className="bg-[#13111C] border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// DISPLACEMENT:</span>
                      <span className="font-bold text-white text-xs font-mono">
                        {v.displacement_cc ? `${v.displacement_cc} CC` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-[#13111C] border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000]">
                      <span className="text-neutral-400 text-[10px] block uppercase font-mono">// ODOMETER_LOG:</span>
                      <span className="font-bold text-[#49D49D] font-mono text-xs">
                        {v.odometer_km?.toLocaleString()} KM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Provenance Badge Footer */}
                <div className="pt-2 border-t-2 border-black flex items-center justify-between">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000000] ${
                      specSource === 'Verified'
                        ? 'bg-[#49D49D] text-black'
                        : specSource === 'Estimated / Needs Confirmation'
                        ? 'bg-[#FF7844] text-black'
                        : 'bg-[#FED156] text-black'
                    }`}
                  >
                    [ PROVENANCE: {specSource.toUpperCase()} ]
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">
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
          <div className="bg-[#1E1A29] border-3 border-black max-w-lg w-full p-6 shadow-[8px_8px_0px_#FF7844] font-mono">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 font-sans">
              [ NEW_ASSET_ENTRY_PROTOCOL // REGISTRATION ]
            </h3>
            <p className="text-[11px] text-neutral-300 uppercase tracking-wide mb-5 font-mono">
              INPUT SPECIFICATIONS. ALL FIELDS ARE TAGGED WITH DATA PROVENANCE AUDIT METADATA.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // VEHICLE_PLATFORM:
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  >
                    <option value="car">CAR / AUTOMOBILE</option>
                    <option value="motorcycle">MOTORCYCLE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // MODEL_YEAR:
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // MANUFACTURER:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. HONDA, YAMAHA, TOYOTA"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // MODEL_NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. CIVIC, MT-07, COROLLA"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // COOLING:
                  </label>
                  <select
                    value={formData.cooling_type}
                    onChange={(e) => setFormData({ ...formData, cooling_type: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  >
                    <option value="liquid_cooled">LIQUID COOLED</option>
                    <option value="air_cooled">AIR COOLED</option>
                    <option value="oil_cooled">OIL COOLED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // TRANS:
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  >
                    <option value="manual">MANUAL</option>
                    <option value="automatic">AUTOMATIC</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // DISPL (CC):
                  </label>
                  <input
                    type="number"
                    placeholder="E.G. 1996"
                    value={formData.displacement_cc}
                    onChange={(e) => setFormData({ ...formData, displacement_cc: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // ODOMETER (KM):
                  </label>
                  <input
                    type="number"
                    value={formData.odometer_km}
                    onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                    // REG_NO (PLATE):
                  </label>
                  <input
                    type="text"
                    placeholder="E.G. MH-12-AB-1234"
                    value={formData.registration_no}
                    onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-300 uppercase tracking-wider block mb-1 font-mono">
                  // SPECIFICATION_PROVENANCE_ATTESTATION:
                </label>
                <select
                  value={formData.spec_provenance}
                  onChange={(e) => setFormData({ ...formData, spec_provenance: e.target.value })}
                  className="w-full bg-[#13111C] border-2 border-black p-2 text-xs text-white font-mono uppercase font-bold shadow-[2px_2px_0px_#000000] focus:shadow-[4px_4px_0px_#FF7844] focus:outline-none"
                >
                  <option value="User-Entered">USER-ENTERED (OPERATOR OBSERVATION)</option>
                  <option value="Verified">VERIFIED FROM OEM MANUAL</option>
                  <option value="Estimated / Needs Confirmation">ESTIMATED / NEEDS CONFIRMATION</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#161320] hover:bg-[#262135] border-2 border-black text-neutral-200 font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] transition-all"
                >
                  [ CANCEL ]
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#49D49D] hover:bg-[#2DE1C2] text-black font-mono text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
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
