import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  Cpu,
  Droplets,
  Edit3,
  Eye,
  Fuel,
  Gauge,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Stethoscope,
  Thermometer,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import {
  HudButton,
  NexusPanel,
  PageTransition,
  SectionHeader,
  TelemetryBadge,
} from '../components/ui';

const KM_TO_MI = 0.621371;

const VEHICLE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

const FUEL_OPTIONS = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
];

const COOLING_OPTIONS = [
  { value: 'liquid_cooled', label: 'Liquid Cooled' },
  { value: 'air_cooled', label: 'Air Cooled' },
  { value: 'oil_cooled', label: 'Oil Cooled' },
];

const TRANSMISSION_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'cvt', label: 'CVT' },
];

const PROVENANCE_OPTIONS = [
  {
    value: 'User-Entered',
    label: 'User-Entered (Operator Observation)',
    badgeVariant: 'cyan',
    shortLabel: 'User-Entered',
  },
  {
    value: 'Verified',
    label: 'Verified (OEM Manual / Spec Sheet)',
    badgeVariant: 'lime',
    shortLabel: 'Verified',
  },
  {
    value: 'Estimated / Needs Confirmation',
    label: 'Estimated / Needs Confirmation',
    badgeVariant: 'amber',
    shortLabel: 'Estimated / Needs Confirmation',
  },
];

const SUBSYSTEM_META = [
  { key: 'engine', label: 'Engine Core', code: 'SYS-ENG' },
  { key: 'electrical', label: 'Electrical Bus', code: 'SYS-ELC' },
  { key: 'transmission', label: 'Drivetrain & Clutch', code: 'SYS-TRN' },
  { key: 'brakes', label: 'Braking System', code: 'SYS-BRK' },
  { key: 'cooling_lubrication', label: 'Cooling & Oil', code: 'SYS-THM' },
  { key: 'suspension_tyres', label: 'Suspension & Tyres', code: 'SYS-SUS' },
  { key: 'fuel_system', label: 'Fuel Delivery', code: 'SYS-FUL' },
];

function createEmptyVehicleForm() {
  return {
    vehicle_type: 'car',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'petrol',
    cooling_type: 'liquid_cooled',
    displacement_cc: '',
    transmission: 'automatic',
    odometer_km: 0,
    last_service_date: '',
    last_oil_change_date: '',
    registration_no: '',
    spec_provenance: 'User-Entered',
    spec_note: '',
  };
}

function mapVehicleToForm(vehicle) {
  return {
    vehicle_type: vehicle.vehicle_type || 'car',
    manufacturer: vehicle.manufacturer || '',
    model: vehicle.model || '',
    year: vehicle.year || new Date().getFullYear(),
    fuel_type: vehicle.fuel_type || 'petrol',
    cooling_type: vehicle.cooling_type || 'liquid_cooled',
    displacement_cc:
      vehicle.displacement_cc !== null && vehicle.displacement_cc !== undefined
        ? String(vehicle.displacement_cc)
        : '',
    transmission: vehicle.transmission || 'manual',
    odometer_km: vehicle.odometer_km ?? 0,
    last_service_date: vehicle.last_service_date || '',
    last_oil_change_date: vehicle.last_oil_change_date || '',
    registration_no: vehicle.registration_no || '',
    spec_provenance: getSpecProvenance(vehicle),
    spec_note: vehicle.spec_source?.source_note || '',
  };
}

function getSpecProvenance(vehicle) {
  const accuracy = vehicle?.spec_source?.spec_accuracy;
  if (
    accuracy === 'Verified' ||
    accuracy === 'User-Entered' ||
    accuracy === 'Estimated / Needs Confirmation'
  ) {
    return accuracy;
  }
  return 'Estimated / Needs Confirmation';
}

function getProvenanceMeta(provenance) {
  return (
    PROVENANCE_OPTIONS.find((opt) => opt.value === provenance) ||
    PROVENANCE_OPTIONS[2]
  );
}

function formatEnumLabel(value, options) {
  if (!value) return 'Not Specified';
  const match = options.find((opt) => opt.value === value);
  if (match) return match.label;
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDistance(kmValue, distanceUnit = 'km') {
  if (kmValue === null || kmValue === undefined || Number.isNaN(Number(kmValue))) {
    return '—';
  }
  const km = Number(kmValue);
  if (distanceUnit === 'mi') {
    const miles = km * KM_TO_MI;
    const rounded =
      miles > 0 && miles < 10
        ? Number(miles.toFixed(1))
        : Math.round(miles);
    return `${rounded.toLocaleString()} mi`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

function getHealthBadgeVariant(status) {
  switch (status) {
    case 'Healthy':
      return 'healthy';
    case 'Attention Required':
      return 'attention';
    case 'Warning':
      return 'warning';
    case 'Critical':
      return 'critical';
    default:
      return 'unassessed';
  }
}

function getVehicleAsset(vehicleType) {
  return vehicleType === 'motorcycle'
    ? '/assets/moto-telemetry-silhouette.jpg'
    : '/assets/hero-concept-chassis.jpg';
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Vehicles() {
  const shouldReduceMotion = useReducedMotion();

  const [vehicles, setVehicles] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState('');

  // Add / Edit Modal state
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [formData, setFormData] = useState(createEmptyVehicleForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Vehicle Detail & Health Drawer state
  const [inspectedVehicleId, setInspectedVehicleId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [vehicleDetail, setVehicleDetail] = useState(null);
  const [vehicleHealth, setVehicleHealth] = useState(null);
  const inspectRequestRef = useRef(0);

  const loadVehicles = useCallback(async (activeFilter) => {
    setLoading(true);
    setBannerError('');
    try {
      const data = await api.getVehicles(activeFilter);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setBannerError(err.message || 'Failed to retrieve fleet inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getSettings()
      .then((prefs) => {
        if (active && prefs?.distance_unit) {
          setDistanceUnit(prefs.distance_unit);
        }
      })
      .catch(() => {
        // Default to km if settings endpoint is unavailable
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadVehicles(filterType);
  }, [filterType, loadVehicles]);

  const loadVehicleInspection = useCallback(async (vehicleId) => {
    const reqId = ++inspectRequestRef.current;
    setInspectedVehicleId(vehicleId);
    setDetailLoading(true);
    setDetailError('');
    try {
      const [detail, health] = await Promise.all([
        api.getVehicle(vehicleId),
        api.getVehicleHealth(vehicleId),
      ]);
      if (inspectRequestRef.current !== reqId) return;
      setVehicleDetail(detail);
      setVehicleHealth(health);
    } catch (err) {
      if (inspectRequestRef.current !== reqId) return;
      setDetailError(err.message || 'Failed to load subsystem telemetry.');
    } finally {
      if (inspectRequestRef.current === reqId) {
        setDetailLoading(false);
      }
    }
  }, []);

  // Close open overlays on Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (deleteTarget && !deleting) {
        setDeleteTarget(null);
      } else if (formMode && !submitting) {
        setFormMode(null);
      } else if (inspectedVehicleId) {
        setInspectedVehicleId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, deleting, formMode, submitting, inspectedVehicleId]);

  const openCreateModal = () => {
    setFormMode('create');
    setEditingVehicleId(null);
    setFormData(createEmptyVehicleForm());
    setFormError('');
  };

  const openEditModal = (vehicle) => {
    setFormMode('edit');
    setEditingVehicleId(vehicle.id);
    setFormData(mapVehicleToForm(vehicle));
    setFormError('');
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const manufacturer = formData.manufacturer.trim();
    const model = formData.model.trim();
    if (!manufacturer || !model) {
      setFormError('Manufacturer and model name are required.');
      return;
    }

    const parsedYear = Number(formData.year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 2) {
      setFormError('Enter a valid 4-digit model year.');
      return;
    }

    const parsedOdometer = Math.max(0, Math.round(Number(formData.odometer_km) || 0));
    const parsedDisplacement =
      formData.displacement_cc !== '' && formData.displacement_cc !== null
        ? Math.max(0, Math.round(Number(formData.displacement_cc)))
        : null;

    const specSourcePayload = {
      spec_accuracy: formData.spec_provenance,
      source_note:
        formData.spec_note.trim() ||
        (formMode === 'create'
          ? 'Entered during vehicle registration profile creation'
          : 'Updated via vehicle fleet profile editor'),
    };

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const createPayload = {
          vehicle_type: formData.vehicle_type,
          manufacturer,
          model,
          year: parsedYear,
          fuel_type: formData.fuel_type,
          cooling_type: formData.cooling_type,
          displacement_cc: parsedDisplacement,
          transmission: formData.transmission,
          odometer_km: parsedOdometer,
          last_service_date: formData.last_service_date || null,
          last_oil_change_date: formData.last_oil_change_date || null,
          registration_no: formData.registration_no.trim() || null,
          spec_source: specSourcePayload,
        };
        const created = await api.createVehicle(createPayload);
        setFormMode(null);
        await loadVehicles(filterType);
        if (created?.id && (!filterType || filterType === created.vehicle_type)) {
          loadVehicleInspection(created.id);
        }
      } else if (formMode === 'edit' && editingVehicleId) {
        // VehicleUpdate omits vehicle_type per backend schema
        const updatePayload = {
          manufacturer,
          model,
          year: parsedYear,
          fuel_type: formData.fuel_type,
          cooling_type: formData.cooling_type,
          displacement_cc: parsedDisplacement,
          transmission: formData.transmission,
          odometer_km: parsedOdometer,
          last_service_date: formData.last_service_date || null,
          last_oil_change_date: formData.last_oil_change_date || null,
          registration_no: formData.registration_no.trim() || null,
          spec_source: specSourcePayload,
        };
        await api.updateVehicle(editingVehicleId, updatePayload);
        setFormMode(null);
        await loadVehicles(filterType);
        if (inspectedVehicleId === editingVehicleId) {
          await loadVehicleInspection(editingVehicleId);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Unable to save vehicle record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setBannerError('');
    try {
      await api.deleteVehicle(deleteTarget.id);
      if (inspectedVehicleId === deleteTarget.id) {
        setInspectedVehicleId(null);
        setVehicleDetail(null);
        setVehicleHealth(null);
      }
      setDeleteTarget(null);
      await loadVehicles(filterType);
    } catch (err) {
      setBannerError(err.message || 'Failed to delete vehicle.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const fleetSummary = useMemo(() => {
    const cars = vehicles.filter((v) => v.vehicle_type === 'car').length;
    const motorcycles = vehicles.filter((v) => v.vehicle_type === 'motorcycle').length;
    const verified = vehicles.filter((v) => getSpecProvenance(v) === 'Verified').length;
    return { total: vehicles.length, cars, motorcycles, verified };
  }, [vehicles]);

  const inputOdometerMilesPreview = useMemo(() => {
    if (distanceUnit !== 'mi') return null;
    const val = Number(formData.odometer_km);
    if (formData.odometer_km === '' || Number.isNaN(val)) return null;
    return formatDistance(val, 'mi');
  }, [distanceUnit, formData.odometer_km]);

  return (
    <PageTransition className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        code="FLT_02"
        eyebrow="Garage & Specification Provenance"
        title="Vehicle Fleet Registry"
        description="Register automobiles and motorcycles with transparent specification provenance, inspect per-subsystem health telemetry, and keep odometer and service dates current."
        icon={Car}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <TelemetryBadge variant="neutral" size="md">
              Display Unit: {distanceUnit.toUpperCase()}
            </TelemetryBadge>

            <div
              role="group"
              aria-label="Filter vehicles by platform"
              className="inline-flex items-center rounded-md border border-white/[0.1] bg-[#0C1016] p-0.5"
            >
              {VEHICLE_FILTERS.map((opt) => {
                const active = filterType === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilterType(opt.value)}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors nexus-focus ${
                      active
                        ? 'bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/40'
                        : 'text-[#8B96A5] border border-transparent hover:text-[#E8EDF3]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <HudButton variant="primary" icon={Plus} onClick={openCreateModal}>
              Add Vehicle
            </HudButton>
          </div>
        }
      />

      {/* Fleet Telemetry Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NexusPanel padding="sm" className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
              Active View Units
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#E8EDF3] tabular-nums">
              {fleetSummary.total}
            </div>
          </div>
          <Car className="h-5 w-5 text-[#00D9FF]" aria-hidden="true" />
        </NexusPanel>

        <NexusPanel padding="sm" className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
              Automobiles
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#E8EDF3] tabular-nums">
              {fleetSummary.cars}
            </div>
          </div>
          <SlidersHorizontal className="h-5 w-5 text-[#8B96A5]" aria-hidden="true" />
        </NexusPanel>

        <NexusPanel padding="sm" className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
              Motorcycles
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#E8EDF3] tabular-nums">
              {fleetSummary.motorcycles}
            </div>
          </div>
          <Gauge className="h-5 w-5 text-[#8B96A5]" aria-hidden="true" />
        </NexusPanel>

        <NexusPanel padding="sm" className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
              OEM Verified Specs
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-[#C7FF4A] tabular-nums">
              {fleetSummary.verified}
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-[#C7FF4A]" aria-hidden="true" />
        </NexusPanel>
      </div>

      {/* Provenance Integrity Notice */}
      <NexusPanel variant="inset" padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#8B96A5]">
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 shrink-0 text-[#00D9FF]" aria-hidden="true" />
            <span>
              <strong className="font-medium text-[#E8EDF3]">Specification Provenance Policy:</strong>{' '}
              AutoExpert never fabricates manufacturer specs. Every profile records whether attributes are{' '}
              <span className="text-[#C7FF4A]">Verified</span>,{' '}
              <span className="text-[#67E8F9]">User-Entered</span>, or{' '}
              <span className="text-[#FBBF24]">Estimated / Needs Confirmation</span>.
            </span>
          </div>
          <HudButton to="/settings" variant="ghost" size="sm">
            Units: {distanceUnit.toUpperCase()}
          </HudButton>
        </div>
      </NexusPanel>

      {/* Error Alert Banner */}
      {bannerError ? (
        <NexusPanel variant="critical" padding="sm" role="alert">
          <div className="flex items-center justify-between gap-3 text-xs text-[#FFC2CD]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
              <span>{bannerError}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerError('')}
              className="text-[#FFC2CD] hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </NexusPanel>
      ) : null}

      {/* Fleet Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <NexusPanel key={idx} padding="none" className="overflow-hidden animate-pulse">
              <div className="h-28 bg-[#151C26]" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 rounded bg-white/[0.06]" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-14 rounded bg-white/[0.04]" />
                  <div className="h-14 rounded bg-white/[0.04]" />
                  <div className="h-14 rounded bg-white/[0.04]" />
                  <div className="h-14 rounded bg-white/[0.04]" />
                </div>
              </div>
            </NexusPanel>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <NexusPanel variant="default" padding="lg" className="text-center">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#00D9FF]/30 bg-[#08242E] text-[#00D9FF]">
              <Car className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
              {filterType
                ? `No ${filterType} profiles registered`
                : 'No fleet vehicles registered yet'}
            </h3>
            <p className="text-xs leading-relaxed text-[#8B96A5]">
              Add a car or motorcycle profile with verified or user-entered specifications to enable
              vehicle-aware rule filtering and subsystem health tracking.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2.5">
              {filterType ? (
                <HudButton variant="secondary" size="sm" onClick={() => setFilterType('')}>
                  Show All Platforms
                </HudButton>
              ) : null}
              <HudButton variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
                Register Vehicle
              </HudButton>
            </div>
          </div>
        </NexusPanel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const provenance = getSpecProvenance(vehicle);
            const provenanceMeta = getProvenanceMeta(provenance);
            const isSelected = inspectedVehicleId === vehicle.id;

            return (
              <NexusPanel
                key={vehicle.id}
                padding="none"
                interactive
                variant={isSelected ? 'cyan' : 'default'}
                className="group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Visual Studio Silhouette Header */}
                  <div
                    onClick={() => loadVehicleInspection(vehicle.id)}
                    className="relative h-28 cursor-pointer overflow-hidden border-b border-white/[0.07] bg-[#07090C]"
                  >
                    <img
                      src={getVehicleAsset(vehicle.vehicle_type)}
                      alt={`${vehicle.year} ${vehicle.manufacturer} ${vehicle.model} silhouette`}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-55 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10151D] via-[#10151D]/55 to-transparent" />
                    <div className="absolute inset-0 nexus-scanline opacity-60" />

                    <div className="absolute inset-x-3.5 top-3 flex items-center justify-between gap-2">
                      <TelemetryBadge
                        variant={vehicle.vehicle_type === 'motorcycle' ? 'lime' : 'cyan'}
                        dot
                        className="bg-[#07090C]/85 backdrop-blur-sm"
                      >
                        {vehicle.vehicle_type === 'motorcycle' ? 'Motorcycle' : 'Car'}
                      </TelemetryBadge>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(vehicle);
                          }}
                          title="Edit vehicle profile"
                          aria-label={`Edit ${vehicle.year} ${vehicle.manufacturer} ${vehicle.model}`}
                          className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.14] bg-[#07090C]/80 text-[#E8EDF3] backdrop-blur-sm transition-colors hover:border-[#00D9FF]/60 hover:text-[#00D9FF] nexus-focus"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(vehicle);
                          }}
                          title="Delete vehicle profile"
                          aria-label={`Delete ${vehicle.year} ${vehicle.manufacturer} ${vehicle.model}`}
                          className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.14] bg-[#07090C]/80 text-[#8B96A5] backdrop-blur-sm transition-colors hover:border-[#FF3B5C]/60 hover:bg-[#290D16]/90 hover:text-[#FF6B84] nexus-focus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="absolute inset-x-3.5 bottom-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold tracking-tight text-[#E8EDF3] truncate">
                          {vehicle.year} {vehicle.manufacturer} {vehicle.model}
                        </h3>
                      </div>
                      {vehicle.registration_no ? (
                        <span className="shrink-0 rounded border border-white/[0.15] bg-[#07090C]/85 px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-[#E8EDF3] backdrop-blur-sm">
                          {vehicle.registration_no}
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          No Reg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Specs Grid */}
                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded border border-white/[0.06] bg-[#0A0E13] px-3 py-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          <Thermometer className="h-3 w-3 text-[#00D9FF]" aria-hidden="true" />
                          <span>Cooling</span>
                        </div>
                        <div className="mt-1 text-xs font-medium text-[#E8EDF3]">
                          {formatEnumLabel(vehicle.cooling_type, COOLING_OPTIONS)}
                        </div>
                      </div>

                      <div className="rounded border border-white/[0.06] bg-[#0A0E13] px-3 py-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          <Fuel className="h-3 w-3 text-[#00D9FF]" aria-hidden="true" />
                          <span>Fuel Type</span>
                        </div>
                        <div className="mt-1 text-xs font-medium text-[#E8EDF3]">
                          {formatEnumLabel(vehicle.fuel_type, FUEL_OPTIONS)}
                        </div>
                      </div>

                      <div className="rounded border border-white/[0.06] bg-[#0A0E13] px-3 py-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          <SlidersHorizontal className="h-3 w-3 text-[#8B96A5]" aria-hidden="true" />
                          <span>Transmission</span>
                        </div>
                        <div className="mt-1 text-xs font-medium text-[#E8EDF3]">
                          {formatEnumLabel(vehicle.transmission, TRANSMISSION_OPTIONS)}
                        </div>
                      </div>

                      <div className="rounded border border-white/[0.06] bg-[#0A0E13] px-3 py-2">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          <Cpu className="h-3 w-3 text-[#8B96A5]" aria-hidden="true" />
                          <span>Displacement</span>
                        </div>
                        <div className="mt-1 font-mono text-xs font-medium text-[#E8EDF3] tabular-nums">
                          {vehicle.displacement_cc
                            ? `${Number(vehicle.displacement_cc).toLocaleString()} cc`
                            : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Odometer + Service Milestones */}
                    <div className="rounded border border-white/[0.07] bg-[#0C1016] px-3.5 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8B96A5]">
                          <Gauge className="h-3.5 w-3.5 text-[#C7FF4A]" aria-hidden="true" />
                          Odometer
                        </span>
                        <span
                          title={`${Number(vehicle.odometer_km || 0).toLocaleString()} km`}
                          className="font-mono text-xs font-semibold text-[#C7FF4A] tabular-nums"
                        >
                          {formatDistance(vehicle.odometer_km, distanceUnit)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#8B96A5]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[#5E6B7D]" aria-hidden="true" />
                          Last Service
                        </span>
                        <span className="font-mono text-[#E8EDF3]">
                          {vehicle.last_service_date || 'Not recorded'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#8B96A5]">
                        <span className="flex items-center gap-1.5">
                          <Droplets className="h-3 w-3 text-[#5E6B7D]" aria-hidden="true" />
                          Last Oil Change
                        </span>
                        <span className="font-mono text-[#E8EDF3]">
                          {vehicle.last_oil_change_date || 'Not recorded'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provenance & Inspection Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-[#0C1016] px-4 py-3 sm:px-5">
                  <TelemetryBadge variant={provenanceMeta.badgeVariant} size="sm">
                    {provenanceMeta.shortLabel}
                  </TelemetryBadge>

                  <HudButton
                    variant={isSelected ? 'primary' : 'outline'}
                    size="sm"
                    icon={Eye}
                    onClick={() => loadVehicleInspection(vehicle.id)}
                  >
                    {isSelected ? 'Inspecting' : 'Inspect Health'}
                  </HudButton>
                </div>
              </NexusPanel>
            );
          })}
        </div>
      )}

      {/* Vehicle Detail & 7-Subsystem Health Drawer */}
      <AnimatePresence>
        {inspectedVehicleId ? (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Vehicle subsystem health and telemetry drawer"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              onClick={() => setInspectedVehicleId(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            <motion.aside
              initial={shouldReduceMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: '100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.12] bg-[#0B0F15] shadow-nexus-elevated"
            >
              {/* Drawer Top Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#10151D] px-5 py-4">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00D9FF]">
                    UNIT TELEMETRY // ID #{inspectedVehicleId}
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[#E8EDF3] truncate">
                    {vehicleDetail
                      ? `${vehicleDetail.year} ${vehicleDetail.manufacturer} ${vehicleDetail.model}`
                      : vehicleHealth?.vehicle_name || 'Loading vehicle dossier...'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {vehicleDetail ? (
                    <HudButton
                      variant="secondary"
                      size="sm"
                      icon={Edit3}
                      onClick={() => openEditModal(vehicleDetail)}
                    >
                      Edit
                    </HudButton>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setInspectedVehicleId(null)}
                    aria-label="Close telemetry drawer"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#07090C] text-[#8B96A5] hover:border-[#00D9FF]/40 hover:text-[#E8EDF3] nexus-focus"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {detailLoading ? (
                  <div className="space-y-4 py-8 text-center">
                    <div className="mx-auto h-0.5 w-40 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-[#00D9FF]" />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-widest text-[#8B96A5]">
                      Loading vehicle telemetry &amp; subsystem health...
                    </p>
                  </div>
                ) : detailError ? (
                  <NexusPanel variant="critical" padding="md">
                    <div className="flex items-start gap-3 text-xs text-[#FFC2CD]">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" />
                      <div>
                        <div className="font-semibold text-white">Failed to inspect unit</div>
                        <p className="mt-1">{detailError}</p>
                      </div>
                    </div>
                  </NexusPanel>
                ) : vehicleDetail ? (
                  <>
                    {/* Hero Studio Visual Banner + Primary Diagnostic CTA */}
                    <div className="relative overflow-hidden rounded-md border border-white/[0.09] bg-[#07090C]">
                      <img
                        src={getVehicleAsset(vehicleDetail.vehicle_type)}
                        alt={`${vehicleDetail.year} ${vehicleDetail.manufacturer} ${vehicleDetail.model}`}
                        className="h-36 w-full object-cover opacity-55"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/65 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <TelemetryBadge
                                variant={
                                  vehicleDetail.vehicle_type === 'motorcycle' ? 'lime' : 'cyan'
                                }
                              >
                                {vehicleDetail.vehicle_type === 'motorcycle' ? 'Motorcycle' : 'Car'}
                              </TelemetryBadge>
                              <TelemetryBadge
                                variant={
                                  getProvenanceMeta(getSpecProvenance(vehicleDetail)).badgeVariant
                                }
                              >
                                {getSpecProvenance(vehicleDetail)}
                              </TelemetryBadge>
                              {vehicleDetail.registration_no ? (
                                <TelemetryBadge variant="neutral">
                                  {vehicleDetail.registration_no}
                                </TelemetryBadge>
                              ) : null}
                            </div>
                            <div className="font-mono text-xs text-[#8B96A5]">
                              Odometer:{' '}
                              <span className="font-semibold text-[#C7FF4A]">
                                {formatDistance(vehicleDetail.odometer_km, distanceUnit)}
                              </span>{' '}
                              {distanceUnit === 'mi'
                                ? `(${Number(vehicleDetail.odometer_km || 0).toLocaleString()} km)`
                                : null}
                            </div>
                          </div>

                          <HudButton
                            to="/diagnose"
                            state={{ vehicleId: vehicleDetail.id }}
                            variant="primary"
                            size="sm"
                            icon={Stethoscope}
                          >
                            Run Diagnostic
                          </HudButton>
                        </div>
                      </div>
                    </div>

                    {/* Specification Provenance Note */}
                    {vehicleDetail.spec_source?.source_note ? (
                      <div className="rounded border border-white/[0.07] bg-[#10151D] px-3.5 py-2.5 text-xs text-[#8B96A5]">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#00D9FF]">
                          Provenance Note:{' '}
                        </span>
                        {vehicleDetail.spec_source.source_note}
                      </div>
                    ) : null}

                    {/* Core Powertrain & Service Dates */}
                    <NexusPanel code="SPECS" title="Registered Powertrain & Service Profile" padding="sm">
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Fuel</div>
                          <div className="mt-0.5 font-medium text-[#E8EDF3]">
                            {formatEnumLabel(vehicleDetail.fuel_type, FUEL_OPTIONS)}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Cooling</div>
                          <div className="mt-0.5 font-medium text-[#E8EDF3]">
                            {formatEnumLabel(vehicleDetail.cooling_type, COOLING_OPTIONS)}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Transmission</div>
                          <div className="mt-0.5 font-medium text-[#E8EDF3]">
                            {formatEnumLabel(vehicleDetail.transmission, TRANSMISSION_OPTIONS)}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Displacement</div>
                          <div className="mt-0.5 font-mono text-[#E8EDF3]">
                            {vehicleDetail.displacement_cc
                              ? `${Number(vehicleDetail.displacement_cc).toLocaleString()} cc`
                              : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Last Service</div>
                          <div className="mt-0.5 font-mono text-[#E8EDF3]">
                            {vehicleDetail.last_service_date || 'Not recorded'}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase text-[#8B96A5]">Last Oil Change</div>
                          <div className="mt-0.5 font-mono text-[#E8EDF3]">
                            {vehicleDetail.last_oil_change_date || 'Not recorded'}
                          </div>
                        </div>
                      </div>
                    </NexusPanel>

                    {/* 7-Subsystem Diagnostic Health */}
                    <NexusPanel
                      code="HEALTH_7"
                      title="7-Subsystem Diagnostic Status"
                      subtitle="Derived strictly from persisted diagnostic reports; defaults to Not Assessed"
                      padding="sm"
                      headerAction={
                        <HudButton
                          to="/diagnose"
                          state={{ vehicleId: vehicleDetail.id }}
                          variant="outline"
                          size="sm"
                          icon={Stethoscope}
                        >
                          Run Diagnostic
                        </HudButton>
                      }
                    >
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {SUBSYSTEM_META.map((sub) => {
                          const info = vehicleHealth?.subsystems?.[sub.key] || {
                            status: 'Not Assessed',
                            last_assessed: null,
                            severity: null,
                            conclusions_count: 0,
                            evidence_score: null,
                          };
                          return (
                            <div
                              key={sub.key}
                              className="flex flex-col justify-between rounded border border-white/[0.07] bg-[#0A0E13] p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#5E6B7D]">
                                    {sub.code}
                                  </div>
                                  <div className="text-xs font-semibold text-[#E8EDF3]">
                                    {sub.label}
                                  </div>
                                </div>
                                <TelemetryBadge
                                  variant={getHealthBadgeVariant(info.status)}
                                  dot
                                  pulse={info.status === 'Critical'}
                                >
                                  {info.status}
                                </TelemetryBadge>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.05] pt-2 font-mono text-[10px] text-[#8B96A5]">
                                <span>
                                  {info.last_assessed
                                    ? `Assessed ${info.last_assessed.slice(0, 10)}`
                                    : 'No diagnostic session'}
                                </span>
                                {info.status !== 'Not Assessed' && info.evidence_score !== null ? (
                                  <span className="text-[#00D9FF]">
                                    Match {info.evidence_score}% · {info.conclusions_count} fault(s)
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </NexusPanel>

                    {/* Recent Diagnostic Reports */}
                    <NexusPanel
                      code="AUD_LOG"
                      title={`Recent Diagnostic Reports (${vehicleDetail.recent_reports?.length || 0})`}
                      padding="sm"
                      headerAction={
                        <HudButton to="/reports" variant="ghost" size="sm">
                          All Reports
                        </HudButton>
                      }
                    >
                      {!vehicleDetail.recent_reports?.length ? (
                        <p className="py-3 text-xs text-[#8B96A5]">
                          No diagnostic sessions recorded for this vehicle yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {vehicleDetail.recent_reports.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/[0.07] bg-[#0A0E13] px-3 py-2.5 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#E8EDF3]">
                                  <span>{rep.report_code}</span>
                                  <span className="text-[#5E6B7D]">/</span>
                                  <span className="uppercase text-[#00D9FF]">
                                    {rep.category?.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-[#8B96A5]">
                                  {rep.created_at?.slice(0, 10)} · {rep.conclusions?.length || 0} conclusion(s)
                                  {rep.odometer_at_diagnosis !== null &&
                                  rep.odometer_at_diagnosis !== undefined
                                    ? ` · ${formatDistance(rep.odometer_at_diagnosis, distanceUnit)}`
                                    : ''}
                                </div>
                              </div>
                              <TelemetryBadge
                                variant={
                                  rep.safety_warning_triggered || rep.highest_severity === 'critical'
                                    ? 'critical'
                                    : rep.highest_severity === 'high'
                                    ? 'warning'
                                    : rep.highest_severity === 'medium'
                                    ? 'attention'
                                    : 'neutral'
                                }
                              >
                                {rep.safety_warning_triggered ? 'Safety Halt' : rep.highest_severity}
                              </TelemetryBadge>
                            </div>
                          ))}
                        </div>
                      )}
                    </NexusPanel>

                    {/* Active Maintenance Reminders */}
                    <NexusPanel
                      code="MNT_DUE"
                      title={`Active Service Reminders (${vehicleDetail.reminders?.length || 0})`}
                      padding="sm"
                      headerAction={
                        <HudButton to="/maintenance" variant="ghost" size="sm" icon={Wrench}>
                          Open Maintenance
                        </HudButton>
                      }
                    >
                      {!vehicleDetail.reminders?.length ? (
                        <p className="py-3 text-xs text-[#8B96A5]">
                          No maintenance intervals scheduled yet. Log a service entry in Maintenance to
                          configure intervals.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {vehicleDetail.reminders.map((rem) => {
                            const todayStr = getTodayDateString();
                            const odoReached =
                              rem.status !== 'completed' &&
                              rem.next_due_km !== null &&
                              rem.next_due_km !== undefined &&
                              Number(vehicleDetail.odometer_km) >= Number(rem.next_due_km);
                            const dateOverdue =
                              rem.status !== 'completed' &&
                              Boolean(rem.next_due_date && rem.next_due_date < todayStr);
                            const isAlert =
                              odoReached ||
                              dateOverdue ||
                              rem.status === 'due' ||
                              rem.status === 'overdue';

                            return (
                              <div
                                key={rem.id}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2.5 text-xs ${
                                  isAlert
                                    ? 'border-[#FF3B5C]/45 bg-[#190B10]'
                                    : 'border-white/[0.07] bg-[#0A0E13]'
                                }`}
                              >
                                <div>
                                  <div className="font-medium text-[#E8EDF3]">{rem.item_type}</div>
                                  <div className="mt-0.5 font-mono text-[11px] text-[#8B96A5]">
                                    {rem.next_due_km !== null && rem.next_due_km !== undefined
                                      ? `Due at ${formatDistance(rem.next_due_km, distanceUnit)}`
                                      : ''}
                                    {rem.next_due_date ? ` · Due ${rem.next_due_date}` : ''}
                                  </div>
                                </div>
                                <TelemetryBadge
                                  variant={isAlert ? 'critical' : 'neutral'}
                                  dot={isAlert}
                                  pulse={isAlert}
                                >
                                  {odoReached
                                    ? 'Odometer Threshold Reached'
                                    : dateOverdue
                                    ? 'Overdue'
                                    : rem.status}
                                </TelemetryBadge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </NexusPanel>
                  </>
                ) : null}
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Add / Edit Vehicle Modal */}
      <AnimatePresence>
        {formMode ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-modal-title"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              onClick={() => !submitting && setFormMode(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-white/[0.12] bg-[#10151D] shadow-nexus-elevated"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00D9FF]">
                    {formMode === 'create'
                      ? 'FLT_CREATE // NEW VEHICLE PROFILE'
                      : `FLT_UPDATE // EDIT UNIT #${editingVehicleId}`}
                  </div>
                  <h2
                    id="vehicle-modal-title"
                    className="font-display text-lg font-semibold text-[#E8EDF3]"
                  >
                    {formMode === 'create' ? 'Register Fleet Vehicle' : 'Edit Vehicle Profile'}
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setFormMode(null)}
                  aria-label="Close vehicle modal"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#07090C] text-[#8B96A5] hover:text-[#E8EDF3] nexus-focus"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
                {formError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md border border-[#FF3B5C]/45 bg-[#290D16] px-3.5 py-2.5 text-xs text-[#FFC2CD]"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B5C]" />
                    <span>{formError}</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="vf-type"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Vehicle Platform
                    </label>
                    <select
                      id="vf-type"
                      disabled={formMode === 'edit'}
                      value={formData.vehicle_type}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicle_type: e.target.value })
                      }
                      className="nexus-input"
                    >
                      <option value="car">Car / Automobile</option>
                      <option value="motorcycle">Motorcycle</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vf-year"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Model Year *
                    </label>
                    <input
                      id="vf-year"
                      type="number"
                      required
                      min={1900}
                      max={new Date().getFullYear() + 2}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="nexus-input font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vf-reg"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Registration Plate
                    </label>
                    <input
                      id="vf-reg"
                      type="text"
                      placeholder="e.g. MH-12-AB-1234"
                      value={formData.registration_no}
                      onChange={(e) =>
                        setFormData({ ...formData, registration_no: e.target.value })
                      }
                      className="nexus-input font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vf-manufacturer"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Manufacturer *
                    </label>
                    <input
                      id="vf-manufacturer"
                      type="text"
                      required
                      placeholder="e.g. Honda, Yamaha, Toyota"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        setFormData({ ...formData, manufacturer: e.target.value })
                      }
                      className="nexus-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vf-model"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Model *
                    </label>
                    <input
                      id="vf-model"
                      type="text"
                      required
                      placeholder="e.g. Civic, MT-07, Corolla"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="nexus-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label
                      htmlFor="vf-fuel"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Fuel Type
                    </label>
                    <select
                      id="vf-fuel"
                      value={formData.fuel_type}
                      onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                      className="nexus-input"
                    >
                      {FUEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vf-cooling"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Cooling System
                    </label>
                    <select
                      id="vf-cooling"
                      value={formData.cooling_type}
                      onChange={(e) =>
                        setFormData({ ...formData, cooling_type: e.target.value })
                      }
                      className="nexus-input"
                    >
                      {COOLING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vf-transmission"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Transmission
                    </label>
                    <select
                      id="vf-transmission"
                      value={formData.transmission}
                      onChange={(e) =>
                        setFormData({ ...formData, transmission: e.target.value })
                      }
                      className="nexus-input"
                    >
                      {TRANSMISSION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vf-displacement"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Displacement (cc)
                    </label>
                    <input
                      id="vf-displacement"
                      type="number"
                      min={0}
                      placeholder="e.g. 1996"
                      value={formData.displacement_cc}
                      onChange={(e) =>
                        setFormData({ ...formData, displacement_cc: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="vf-odometer"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Odometer (km)
                    </label>
                    <input
                      id="vf-odometer"
                      type="number"
                      min={0}
                      value={formData.odometer_km}
                      onChange={(e) =>
                        setFormData({ ...formData, odometer_km: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                    {inputOdometerMilesPreview ? (
                      <p className="mt-1 font-mono text-[10px] text-[#00D9FF]">
                        Display equivalent: {inputOdometerMilesPreview}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="vf-last-service"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Last Service Date
                    </label>
                    <input
                      id="vf-last-service"
                      type="date"
                      value={formData.last_service_date}
                      onChange={(e) =>
                        setFormData({ ...formData, last_service_date: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vf-last-oil"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Last Oil Change Date
                    </label>
                    <input
                      id="vf-last-oil"
                      type="date"
                      value={formData.last_oil_change_date}
                      onChange={(e) =>
                        setFormData({ ...formData, last_oil_change_date: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vf-provenance"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Specification Provenance *
                    </label>
                    <select
                      id="vf-provenance"
                      value={formData.spec_provenance}
                      onChange={(e) =>
                        setFormData({ ...formData, spec_provenance: e.target.value })
                      }
                      className="nexus-input"
                    >
                      {PROVENANCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vf-provenance-note"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Provenance Source Note
                    </label>
                    <input
                      id="vf-provenance-note"
                      type="text"
                      placeholder="e.g. Owner's manual p. 142 or dashboard reading"
                      value={formData.spec_note}
                      onChange={(e) => setFormData({ ...formData, spec_note: e.target.value })}
                      className="nexus-input"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                  <HudButton
                    variant="secondary"
                    disabled={submitting}
                    onClick={() => setFormMode(null)}
                  >
                    Cancel
                  </HudButton>
                  <HudButton type="submit" variant="primary" loading={submitting}>
                    {formMode === 'create' ? 'Register Vehicle' : 'Save Changes'}
                  </HudButton>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Delete Vehicle Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-vehicle-title"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 w-full max-w-md rounded-lg border border-[#FF3B5C]/40 bg-[#10151D] p-6 shadow-nexus-crimson"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#FF3B5C]/40 bg-[#290D16] text-[#FF3B5C]">
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#FF6B84]">
                    Confirm Fleet Removal
                  </div>
                  <h3
                    id="delete-vehicle-title"
                    className="font-display text-base font-semibold text-[#E8EDF3]"
                  >
                    Delete {deleteTarget.year} {deleteTarget.manufacturer} {deleteTarget.model}?
                  </h3>
                  <p className="text-xs leading-relaxed text-[#8B96A5]">
                    This permanently deletes the vehicle profile along with all associated diagnostic
                    sessions, reports, maintenance records, and service reminders.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.08] pt-4">
                <HudButton
                  variant="secondary"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </HudButton>
                <HudButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  loading={deleting}
                  onClick={handleConfirmDelete}
                >
                  Delete Vehicle
                </HudButton>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  );
}
