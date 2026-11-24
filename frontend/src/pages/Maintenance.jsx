import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Edit3,
  Gauge,
  Plus,
  ShieldAlert,
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

const SERVICE_PRESETS = [
  'Engine Oil & Filter Replacement',
  'Air Filter Inspection / Replacement',
  'Brake Pad Inspection / Replacement',
  'Brake Fluid Flush',
  'Coolant Inspection / Replacement',
  'Tyre Pressure & Tread Inspection',
  'Motorcycle Chain Clean & Lubricate',
  'Battery & Charging System Check',
  'General Periodic Service',
];

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

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function evaluateReminderAlert(reminder, selectedVehicle, backendDueIds, todayStr) {
  if (!reminder) return null;
  const isCompleted = reminder.status === 'completed';
  const isBackendDue =
    backendDueIds.has(reminder.id) ||
    reminder.status === 'due' ||
    reminder.status === 'overdue';

  const hasVehicleOdometer =
    selectedVehicle &&
    selectedVehicle.odometer_km !== null &&
    selectedVehicle.odometer_km !== undefined;

  const isOdometerReached =
    !isCompleted &&
    hasVehicleOdometer &&
    reminder.next_due_km !== null &&
    reminder.next_due_km !== undefined &&
    Number(selectedVehicle.odometer_km) >= Number(reminder.next_due_km);

  const isDatePast =
    !isCompleted &&
    Boolean(reminder.next_due_date && reminder.next_due_date < todayStr);

  const isActionable = !isCompleted && (isBackendDue || isOdometerReached || isDatePast);
  if (!isActionable) return null;

  let reasonLabel = reminder.status === 'overdue' ? 'Overdue' : 'Service Due';
  if (isOdometerReached) {
    reasonLabel = 'Odometer Threshold Reached';
  } else if (isDatePast) {
    reasonLabel = 'Service Date Overdue';
  }

  return {
    ...reminder,
    isOdometerReached,
    isDatePast,
    isBackendDue,
    reasonLabel,
    overdueKm:
      isOdometerReached && hasVehicleOdometer
        ? Math.max(0, Number(selectedVehicle.odometer_km) - Number(reminder.next_due_km))
        : 0,
  };
}

function createInitialLogForm(defaultOdometer = '') {
  return {
    item_type: 'Engine Oil & Filter Replacement',
    service_date: getTodayDateString(),
    odometer_km: defaultOdometer !== null && defaultOdometer !== undefined ? String(defaultOdometer) : '',
    notes: '',
    interval_km: '10000',
    interval_days: '365',
  };
}

export default function Maintenance() {
  const shouldReduceMotion = useReducedMotion();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');

  const [records, setRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [dueAlerts, setDueAlerts] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Log New Service Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState(() => createInitialLogForm());
  const [logError, setLogError] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // Edit Service Record Modal
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    item_type: '',
    service_date: '',
    odometer_km: '',
    notes: '',
  });
  const [editError, setEditError] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const maintenanceReqRef = useRef(0);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null,
    [vehicles, selectedVehicleId]
  );

  const loadMaintenanceForVehicle = useCallback(async (vehicleId) => {
    const reqId = ++maintenanceReqRef.current;
    if (!vehicleId) {
      setRecords([]);
      setReminders([]);
      setDueAlerts([]);
      return;
    }
    setMaintenanceLoading(true);
    setErrorMessage('');
    try {
      const mData = await api.getMaintenance(vehicleId);
      if (maintenanceReqRef.current !== reqId) return;
      setRecords(Array.isArray(mData?.records) ? mData.records : []);
      setReminders(Array.isArray(mData?.reminders) ? mData.reminders : []);
      setDueAlerts(Array.isArray(mData?.due_alerts) ? mData.due_alerts : []);
    } catch (err) {
      if (maintenanceReqRef.current !== reqId) return;
      setErrorMessage(err.message || 'Failed to load maintenance telemetry.');
    } finally {
      if (maintenanceReqRef.current === reqId) {
        setMaintenanceLoading(false);
      }
    }
  }, []);

  const refreshVehiclesAndMaintenance = useCallback(
    async (preferredVehicleId) => {
      const vList = await api.getVehicles();
      const safeList = Array.isArray(vList) ? vList : [];
      setVehicles(safeList);

      let nextId = preferredVehicleId;
      if (
        !nextId ||
        !safeList.some((v) => String(v.id) === String(nextId))
      ) {
        nextId = safeList.length > 0 ? String(safeList[0].id) : '';
      }
      setSelectedVehicleId(nextId ? String(nextId) : '');
      if (nextId) {
        await loadMaintenanceForVehicle(nextId);
      } else {
        setRecords([]);
        setReminders([]);
        setDueAlerts([]);
      }
    },
    [loadMaintenanceForVehicle]
  );

  useEffect(() => {
    let active = true;
    async function init() {
      setInitialLoading(true);
      setErrorMessage('');
      try {
        const [vList, prefs] = await Promise.all([
          api.getVehicles(),
          api.getSettings().catch(() => ({ distance_unit: 'km' })),
        ]);
        if (!active) return;

        if (prefs?.distance_unit) {
          setDistanceUnit(prefs.distance_unit);
        }

        const safeList = Array.isArray(vList) ? vList : [];
        setVehicles(safeList);
        if (safeList.length > 0) {
          const firstId = String(safeList[0].id);
          setSelectedVehicleId(firstId);
          await loadMaintenanceForVehicle(firstId);
        }
      } catch (err) {
        if (active) {
          setErrorMessage(err.message || 'Failed to initialize maintenance module.');
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [loadMaintenanceForVehicle]);

  // Close open modals on Escape
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (editingRecord && !submittingEdit) {
        setEditingRecord(null);
      } else if (showLogModal && !submittingLog) {
        setShowLogModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingRecord, submittingEdit, showLogModal, submittingLog]);

  const handleVehicleChange = async (nextId) => {
    setSelectedVehicleId(nextId);
    setStatusMessage('');
    await loadMaintenanceForVehicle(nextId);
  };

  const openLogModal = (presetItemType = null) => {
    const initial = createInitialLogForm(selectedVehicle?.odometer_km ?? '');
    if (presetItemType) {
      initial.item_type = presetItemType;
    }
    setLogForm(initial);
    setLogError('');
    setShowLogModal(true);
  };

  const handleLogSubmit = async (event) => {
    event.preventDefault();
    setLogError('');
    setStatusMessage('');

    if (!selectedVehicleId) {
      setLogError('Register or select a vehicle unit first.');
      return;
    }

    const itemType = logForm.item_type.trim();
    if (!itemType) {
      setLogError('Service item name is required.');
      return;
    }

    const parsedOdometer = Math.max(0, Math.round(Number(logForm.odometer_km) || 0));
    const parsedIntervalKm =
      logForm.interval_km !== '' && Number(logForm.interval_km) > 0
        ? Math.round(Number(logForm.interval_km))
        : null;
    const parsedIntervalDays =
      logForm.interval_days !== '' && Number(logForm.interval_days) > 0
        ? Math.round(Number(logForm.interval_days))
        : null;

    setSubmittingLog(true);
    try {
      await api.createMaintenance({
        vehicle_id: Number(selectedVehicleId),
        item_type: itemType,
        service_date: logForm.service_date,
        odometer_km: parsedOdometer,
        notes: logForm.notes.trim(),
        interval_km: parsedIntervalKm,
        interval_days: parsedIntervalDays,
      });
      setShowLogModal(false);
      setStatusMessage(`Service entry "${itemType}" recorded.`);
      await refreshVehiclesAndMaintenance(selectedVehicleId);
    } catch (err) {
      setLogError(err.message || 'Failed to log maintenance record.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditForm({
      item_type: record.item_type || '',
      service_date: record.service_date || getTodayDateString(),
      odometer_km:
        record.odometer_km !== null && record.odometer_km !== undefined
          ? String(record.odometer_km)
          : '0',
      notes: record.notes || '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingRecord) return;
    setEditError('');
    setStatusMessage('');

    const itemType = editForm.item_type.trim();
    if (!itemType) {
      setEditError('Service item name cannot be empty.');
      return;
    }

    setSubmittingEdit(true);
    try {
      await api.updateMaintenance(editingRecord.id, {
        item_type: itemType,
        service_date: editForm.service_date,
        odometer_km: Math.max(0, Math.round(Number(editForm.odometer_km) || 0)),
        notes: editForm.notes.trim(),
      });
      setEditingRecord(null);
      setStatusMessage(`Updated service record #${editingRecord.id}.`);
      await loadMaintenanceForVehicle(selectedVehicleId);
    } catch (err) {
      setEditError(err.message || 'Failed to update service record.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Combine backend due_alerts with live odometer / date threshold detection (Bug #5 fix)
  const todayStr = getTodayDateString();
  const backendDueIds = useMemo(
    () => new Set(dueAlerts.map((alert) => alert.id)),
    [dueAlerts]
  );

  const enrichedReminders = useMemo(() => {
    return reminders.map((rem) => {
      const alertInfo = evaluateReminderAlert(rem, selectedVehicle, backendDueIds, todayStr);
      return {
        ...rem,
        alertInfo,
      };
    });
  }, [reminders, selectedVehicle, backendDueIds, todayStr]);

  const effectiveDueAlerts = useMemo(() => {
    const byId = new Map();
    for (const rem of enrichedReminders) {
      if (rem.alertInfo) {
        byId.set(rem.id, rem.alertInfo);
      }
    }
    for (const alert of dueAlerts) {
      if (!byId.has(alert.id)) {
        const evaluated = evaluateReminderAlert(
          alert,
          selectedVehicle,
          backendDueIds,
          todayStr
        ) || {
          ...alert,
          isOdometerReached: false,
          isDatePast: false,
          isBackendDue: true,
          reasonLabel: alert.status === 'overdue' ? 'Overdue' : 'Service Due',
          overdueKm: 0,
        };
        byId.set(alert.id, evaluated);
      }
    }
    return Array.from(byId.values());
  }, [enrichedReminders, dueAlerts, selectedVehicle, backendDueIds, todayStr]);

  const logOdoPreview = useMemo(() => {
    if (distanceUnit !== 'mi') return null;
    if (logForm.odometer_km === '' || Number.isNaN(Number(logForm.odometer_km))) return null;
    return formatDistance(Number(logForm.odometer_km), 'mi');
  }, [distanceUnit, logForm.odometer_km]);

  const logIntervalPreview = useMemo(() => {
    if (distanceUnit !== 'mi') return null;
    if (logForm.interval_km === '' || Number.isNaN(Number(logForm.interval_km))) return null;
    return formatDistance(Number(logForm.interval_km), 'mi');
  }, [distanceUnit, logForm.interval_km]);

  const editOdoPreview = useMemo(() => {
    if (distanceUnit !== 'mi') return null;
    if (editForm.odometer_km === '' || Number.isNaN(Number(editForm.odometer_km))) return null;
    return formatDistance(Number(editForm.odometer_km), 'mi');
  }, [distanceUnit, editForm.odometer_km]);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <SectionHeader
        code="MNT_05"
        eyebrow="Preventive Lifecycle Intelligence"
        title="Maintenance & Service Intervals"
        description="Log completed service milestones, edit historical maintenance records, and intercept odometer or date interval thresholds before component wear escalates."
        icon={Wrench}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {vehicles.length > 0 ? (
              <select
                aria-label="Select vehicle for maintenance"
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="nexus-input w-auto min-w-[230px] py-2 text-xs font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.manufacturer} {v.model} ({v.registration_no || 'No Plate'})
                  </option>
                ))}
              </select>
            ) : null}

            <HudButton
              variant="primary"
              icon={Plus}
              disabled={!selectedVehicleId}
              onClick={() => openLogModal()}
            >
              Log Service
            </HudButton>
          </div>
        }
      />

      {/* Selected Vehicle Telemetry Strip */}
      {selectedVehicle ? (
        <NexusPanel variant="inset" padding="sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-[#00D9FF]/30 bg-[#08242E] text-[#00D9FF]">
                <Car className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-[#E8EDF3]">
                  {selectedVehicle.year} {selectedVehicle.manufacturer} {selectedVehicle.model}
                </div>
                <div className="font-mono text-[11px] text-[#8B96A5]">
                  {selectedVehicle.vehicle_type === 'motorcycle' ? 'Motorcycle' : 'Car'} ·{' '}
                  {selectedVehicle.fuel_type} · {selectedVehicle.cooling_type?.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
              <div>
                <span className="text-[#8B96A5]">Odometer: </span>
                <span className="font-semibold text-[#C7FF4A] tabular-nums">
                  {formatDistance(selectedVehicle.odometer_km, distanceUnit)}
                </span>
              </div>
              <div>
                <span className="text-[#8B96A5]">Last Service: </span>
                <span className="text-[#E8EDF3]">
                  {selectedVehicle.last_service_date || 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-[#8B96A5]">Last Oil Change: </span>
                <span className="text-[#E8EDF3]">
                  {selectedVehicle.last_oil_change_date || 'Not recorded'}
                </span>
              </div>
              <TelemetryBadge variant="neutral">
                Unit: {distanceUnit.toUpperCase()}
              </TelemetryBadge>
            </div>
          </div>
        </NexusPanel>
      ) : null}

      {/* Feedback & Error Banners */}
      {statusMessage ? (
        <NexusPanel variant="lime" padding="sm">
          <div className="flex items-center justify-between gap-3 text-xs text-[#E8EDF3]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#C7FF4A]" aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage('')}
              aria-label="Dismiss notification"
              className="text-[#8B96A5] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </NexusPanel>
      ) : null}

      {errorMessage ? (
        <NexusPanel variant="critical" padding="sm" role="alert">
          <div className="flex items-center justify-between gap-3 text-xs text-[#FFC2CD]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF3B5C]" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              aria-label="Dismiss error"
              className="text-[#FFC2CD] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </NexusPanel>
      ) : null}

      {/* No Vehicles Registered State */}
      {!initialLoading && vehicles.length === 0 ? (
        <NexusPanel padding="lg" className="text-center">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#00D9FF]/30 bg-[#08242E] text-[#00D9FF]">
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#E8EDF3]">
              No fleet vehicles available
            </h3>
            <p className="text-xs leading-relaxed text-[#8B96A5]">
              Register a car or motorcycle profile in the Vehicles Garage first to log service
              records and monitor preventive maintenance intervals.
            </p>
            <div className="pt-2">
              <HudButton to="/vehicles" variant="primary" size="sm" icon={Car}>
                Go to Vehicle Registry
              </HudButton>
            </div>
          </div>
        </NexusPanel>
      ) : (
        <>
          {/* Due & Overdue Alerts Banner (Backend + Client-side Threshold Intercept) */}
          {effectiveDueAlerts.length > 0 ? (
            <NexusPanel
              variant="critical"
              padding="md"
              role="region"
              aria-label="Due and overdue maintenance alerts"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#FF3B5C]/25 pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-[#FF3B5C]" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-sm font-semibold text-[#E8EDF3]">
                      Service Milestones Requiring Attention ({effectiveDueAlerts.length})
                    </h3>
                    <p className="text-xs text-[#FFC2CD]">
                      Includes backend due alerts and active reminders where vehicle odometer or
                      service date threshold has been reached.
                    </p>
                  </div>
                </div>
                <TelemetryBadge variant="critical" dot pulse>
                  {effectiveDueAlerts.some((a) => a.isOdometerReached)
                    ? 'Odometer Threshold Reached'
                    : effectiveDueAlerts.some((a) => a.isDatePast)
                    ? 'Date Threshold Reached'
                    : 'Action Required'}
                </TelemetryBadge>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {effectiveDueAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#FF3B5C]/35 bg-[#0C0709] p-3.5"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold text-[#E8EDF3]">
                          {alert.item_type}
                        </span>
                        <TelemetryBadge variant="critical" size="sm">
                          {alert.reasonLabel}
                        </TelemetryBadge>
                      </div>
                      <div className="font-mono text-[11px] text-[#8B96A5]">
                        {alert.next_due_km !== null && alert.next_due_km !== undefined ? (
                          <span>
                            Target: {formatDistance(alert.next_due_km, distanceUnit)}
                            {alert.overdueKm > 0
                              ? ` (+${formatDistance(alert.overdueKm, distanceUnit)} past)`
                              : ''}
                          </span>
                        ) : null}
                        {alert.next_due_date ? (
                          <span>
                            {alert.next_due_km != null ? ' · ' : ''}
                            Due Date: {alert.next_due_date}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <HudButton
                      variant="outline"
                      size="sm"
                      icon={Wrench}
                      onClick={() => openLogModal(alert.item_type)}
                    >
                      Log Service
                    </HudButton>
                  </div>
                ))}
              </div>
            </NexusPanel>
          ) : null}

          {/* Main Grid: Service History Timeline (Left 2/3) + Active Intervals Panel (Right 1/3) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Completed Service History */}
            <NexusPanel
              className="lg:col-span-8"
              code="SVC_LOG"
              title={`Completed Service History (${records.length})`}
              subtitle="Recorded maintenance interventions with editable odometer, date, and technician notes"
              headerAction={
                <HudButton
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  disabled={!selectedVehicleId}
                  onClick={() => openLogModal()}
                >
                  New Record
                </HudButton>
              }
            >
              {initialLoading || maintenanceLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="h-20 rounded-md border border-white/[0.06] bg-[#0A0E13] animate-pulse"
                    />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-md border border-dashed border-white/[0.1] bg-[#0A0E13] py-12 px-4 text-center">
                  <Wrench className="mx-auto mb-2.5 h-8 w-8 text-[#5E6B7D]" aria-hidden="true" />
                  <h4 className="font-display text-sm font-semibold text-[#E8EDF3]">
                    No maintenance history logged yet
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-[#8B96A5]">
                    Record an oil change, brake inspection, or periodic service to start tracking
                    component intervals for this vehicle.
                  </p>
                  <div className="mt-4">
                    <HudButton
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => openLogModal()}
                    >
                      Log First Service
                    </HudButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col gap-3 rounded-md border border-white/[0.08] bg-[#0A0E13] p-4 transition-colors hover:border-white/[0.16] sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-[#C7FF4A]"
                            aria-hidden="true"
                          />
                          <h4 className="font-display text-sm font-semibold text-[#E8EDF3]">
                            {record.item_type}
                          </h4>
                          <span className="font-mono text-[10px] text-[#5E6B7D]">
                            #{record.id}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#8B96A5]">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#00D9FF]" aria-hidden="true" />
                            {record.service_date}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[#C7FF4A] font-medium">
                            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDistance(record.odometer_km, distanceUnit)}
                          </span>
                        </div>

                        {record.notes ? (
                          <p className="rounded border border-white/[0.05] bg-[#10151D] px-3 py-2 text-xs leading-relaxed text-[#8B96A5]">
                            {record.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-start">
                        <HudButton
                          variant="secondary"
                          size="sm"
                          icon={Edit3}
                          onClick={() => openEditModal(record)}
                        >
                          Edit
                        </HudButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NexusPanel>

            {/* Active Service Intervals Panel */}
            <NexusPanel
              className="lg:col-span-4 h-fit"
              code="INT_MON"
              title={`Active Intervals (${reminders.length})`}
              subtitle="Configured km/day thresholds with source provenance"
            >
              {initialLoading || maintenanceLoading ? (
                <div className="space-y-2.5 py-2">
                  {[1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="h-24 rounded-md border border-white/[0.06] bg-[#0A0E13] animate-pulse"
                    />
                  ))}
                </div>
              ) : enrichedReminders.length === 0 ? (
                <div className="rounded-md border border-dashed border-white/[0.1] bg-[#0A0E13] p-6 text-center text-xs text-[#8B96A5]">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-[#5E6B7D]" aria-hidden="true" />
                  <p>
                    No active intervals configured. Specify an interval (km or days) when logging
                    a service entry.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrichedReminders.map((rem) => {
                    const alertInfo = rem.alertInfo;
                    const hasProgress =
                      selectedVehicle &&
                      rem.next_due_km !== null &&
                      rem.next_due_km !== undefined &&
                      rem.interval_km > 0;

                    let progressPct = 0;
                    if (hasProgress) {
                      const startKm = Number(rem.next_due_km) - Number(rem.interval_km);
                      const traveled = Number(selectedVehicle.odometer_km) - startKm;
                      progressPct = Math.max(
                        0,
                        Math.min(100, Math.round((traveled / Number(rem.interval_km)) * 100))
                      );
                    }

                    return (
                      <div
                        key={rem.id}
                        className={`rounded-md border p-3.5 space-y-2.5 ${
                          alertInfo
                            ? 'border-[#FF3B5C]/45 bg-[#190B10]'
                            : 'border-white/[0.08] bg-[#0A0E13]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-display text-xs font-semibold text-[#E8EDF3]">
                              {rem.item_type}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <TelemetryBadge
                                variant={rem.interval_source === 'verified' ? 'lime' : 'cyan'}
                                size="sm"
                              >
                                {rem.interval_source === 'verified'
                                  ? 'Verified Interval'
                                  : 'User Custom Interval'}
                              </TelemetryBadge>
                              {alertInfo ? (
                                <TelemetryBadge variant="critical" size="sm" dot pulse>
                                  {alertInfo.reasonLabel}
                                </TelemetryBadge>
                              ) : (
                                <TelemetryBadge variant="neutral" size="sm">
                                  {rem.status}
                                </TelemetryBadge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 font-mono text-[11px] text-[#8B96A5]">
                          {rem.interval_km ? (
                            <div className="flex justify-between">
                              <span>Interval Span</span>
                              <span className="text-[#E8EDF3]">
                                {formatDistance(rem.interval_km, distanceUnit)}
                              </span>
                            </div>
                          ) : null}

                          {rem.interval_days ? (
                            <div className="flex justify-between">
                              <span>Time Span</span>
                              <span className="text-[#E8EDF3]">{rem.interval_days} days</span>
                            </div>
                          ) : null}

                          {rem.next_due_km !== null && rem.next_due_km !== undefined ? (
                            <div className="flex justify-between">
                              <span>Next Due Odometer</span>
                              <span
                                className={
                                  alertInfo?.isOdometerReached
                                    ? 'font-semibold text-[#FF6B84]'
                                    : 'font-semibold text-[#00D9FF]'
                                }
                              >
                                {formatDistance(rem.next_due_km, distanceUnit)}
                              </span>
                            </div>
                          ) : null}

                          {rem.next_due_date ? (
                            <div className="flex justify-between">
                              <span>Next Due Date</span>
                              <span
                                className={
                                  alertInfo?.isDatePast
                                    ? 'font-semibold text-[#FF6B84]'
                                    : 'text-[#E8EDF3]'
                                }
                              >
                                {rem.next_due_date}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {hasProgress ? (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between font-mono text-[10px] text-[#8B96A5]">
                              <span>Interval Utilization</span>
                              <span className={alertInfo ? 'text-[#FF6B84]' : 'text-[#00D9FF]'}>
                                {progressPct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  alertInfo
                                    ? 'bg-[#FF3B5C]'
                                    : progressPct >= 80
                                    ? 'bg-[#F59E0B]'
                                    : 'bg-[#00D9FF]'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </NexusPanel>
          </div>
        </>
      )}

      {/* Log New Service Modal */}
      <AnimatePresence>
        {showLogModal ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-service-title"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              onClick={() => !submittingLog && setShowLogModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-white/[0.12] bg-[#10151D] shadow-nexus-elevated"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00D9FF]">
                    MNT_LOG // SERVICE COMPLETION
                  </div>
                  <h2
                    id="log-service-title"
                    className="font-display text-lg font-semibold text-[#E8EDF3]"
                  >
                    Log Maintenance Service
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={submittingLog}
                  onClick={() => setShowLogModal(false)}
                  aria-label="Close log service modal"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#07090C] text-[#8B96A5] hover:text-[#E8EDF3] nexus-focus"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4 p-6">
                {logError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md border border-[#FF3B5C]/45 bg-[#290D16] px-3.5 py-2.5 text-xs text-[#FFC2CD]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B5C]" />
                    <span>{logError}</span>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="log-item-type"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Service Item *
                  </label>
                  <input
                    id="log-item-type"
                    list="nexus-service-presets"
                    type="text"
                    required
                    value={logForm.item_type}
                    onChange={(e) => setLogForm({ ...logForm, item_type: e.target.value })}
                    className="nexus-input"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="log-service-date"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Service Date *
                    </label>
                    <input
                      id="log-service-date"
                      type="date"
                      required
                      value={logForm.service_date}
                      onChange={(e) =>
                        setLogForm({ ...logForm, service_date: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="log-odometer-km"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Odometer (km) *
                    </label>
                    <input
                      id="log-odometer-km"
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 45000"
                      value={logForm.odometer_km}
                      onChange={(e) =>
                        setLogForm({ ...logForm, odometer_km: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                    {logOdoPreview ? (
                      <p className="mt-1 font-mono text-[10px] text-[#00D9FF]">
                        Display equivalent: {logOdoPreview}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="log-interval-km"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Next Interval (km)
                    </label>
                    <input
                      id="log-interval-km"
                      type="number"
                      min={0}
                      placeholder="Optional (e.g. 10000)"
                      value={logForm.interval_km}
                      onChange={(e) =>
                        setLogForm({ ...logForm, interval_km: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                    {logIntervalPreview ? (
                      <p className="mt-1 font-mono text-[10px] text-[#00D9FF]">
                        Display equivalent: {logIntervalPreview}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="log-interval-days"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Next Interval (days)
                    </label>
                    <input
                      id="log-interval-days"
                      type="number"
                      min={0}
                      placeholder="Optional (e.g. 365)"
                      value={logForm.interval_days}
                      onChange={(e) =>
                        setLogForm({ ...logForm, interval_days: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="log-notes"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Technician Notes
                  </label>
                  <textarea
                    id="log-notes"
                    rows={3}
                    placeholder="e.g. Replaced oil with 5W-30 full synthetic, inspected drain plug & filter"
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    className="nexus-input"
                  />
                </div>

                <p className="rounded border border-white/[0.06] bg-[#0A0E13] px-3 py-2 text-[11px] text-[#8B96A5]">
                  Custom intervals specified here are tagged as{' '}
                  <span className="font-mono text-[#00D9FF]">user_custom</span> unless superseded
                  by OEM-verified manufacturer schedules.
                </p>

                <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
                  <HudButton
                    variant="secondary"
                    disabled={submittingLog}
                    onClick={() => setShowLogModal(false)}
                  >
                    Cancel
                  </HudButton>
                  <HudButton type="submit" variant="primary" loading={submittingLog}>
                    Record Service
                  </HudButton>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Edit Service Record Modal (PUT /api/maintenance/{id}) */}
      <AnimatePresence>
        {editingRecord ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-service-title"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              onClick={() => !submittingEdit && setEditingRecord(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-white/[0.12] bg-[#10151D] shadow-nexus-elevated"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00D9FF]">
                    MNT_EDIT // RECORD #{editingRecord.id}
                  </div>
                  <h2
                    id="edit-service-title"
                    className="font-display text-lg font-semibold text-[#E8EDF3]"
                  >
                    Edit Service Record
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={submittingEdit}
                  onClick={() => setEditingRecord(null)}
                  aria-label="Close edit service modal"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#07090C] text-[#8B96A5] hover:text-[#E8EDF3] nexus-focus"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
                {editError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-md border border-[#FF3B5C]/45 bg-[#290D16] px-3.5 py-2.5 text-xs text-[#FFC2CD]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B5C]" />
                    <span>{editError}</span>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="edit-item-type"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Service Item *
                  </label>
                  <input
                    id="edit-item-type"
                    list="nexus-service-presets"
                    type="text"
                    required
                    value={editForm.item_type}
                    onChange={(e) => setEditForm({ ...editForm, item_type: e.target.value })}
                    className="nexus-input"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-service-date"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Service Date *
                    </label>
                    <input
                      id="edit-service-date"
                      type="date"
                      required
                      value={editForm.service_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, service_date: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-odometer-km"
                      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                    >
                      Odometer (km) *
                    </label>
                    <input
                      id="edit-odometer-km"
                      type="number"
                      required
                      min={0}
                      value={editForm.odometer_km}
                      onChange={(e) =>
                        setEditForm({ ...editForm, odometer_km: e.target.value })
                      }
                      className="nexus-input font-mono"
                    />
                    {editOdoPreview ? (
                      <p className="mt-1 font-mono text-[10px] text-[#00D9FF]">
                        Display equivalent: {editOdoPreview}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-notes"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[#8B96A5]"
                  >
                    Technician Notes
                  </label>
                  <textarea
                    id="edit-notes"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="nexus-input"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
                  <HudButton
                    variant="secondary"
                    disabled={submittingEdit}
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </HudButton>
                  <HudButton type="submit" variant="primary" loading={submittingEdit}>
                    Save Changes
                  </HudButton>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <datalist id="nexus-service-presets">
        {SERVICE_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>
    </PageTransition>
  );
}
