"""AutoExpert — Vehicles API Router."""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.db_models import DiagnosticReport, MaintenanceRecord, MaintenanceReminder, Vehicle
from backend.app.schemas.api_schemas import VehicleCreate, VehicleUpdate

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = Vehicle(
        vehicle_type=payload.vehicle_type,
        manufacturer=payload.manufacturer,
        model=payload.model,
        year=payload.year,
        fuel_type=payload.fuel_type,
        cooling_type=payload.cooling_type,
        displacement_cc=payload.displacement_cc,
        transmission=payload.transmission,
        odometer_km=payload.odometer_km,
        last_service_date=payload.last_service_date,
        last_oil_change_date=payload.last_oil_change_date,
        registration_no=payload.registration_no,
        spec_source_json=json.dumps(payload.spec_source),
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle.to_dict()


@router.get("")
def list_vehicles(
    vehicle_type: Optional[str] = Query(None, description="Filter by motorcycle or car"),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return [v.to_dict() for v in vehicles]


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    v_data = vehicle.to_dict()

    # Attach summary of recent diagnostic reports
    reports = (
        db.query(DiagnosticReport)
        .filter(DiagnosticReport.vehicle_id == vehicle_id)
        .order_by(DiagnosticReport.created_at.desc())
        .limit(5)
        .all()
    )
    v_data["recent_reports"] = [r.to_dict() for r in reports]

    # Attach summary of maintenance records
    records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.vehicle_id == vehicle_id)
        .order_by(MaintenanceRecord.created_at.desc())
        .limit(5)
        .all()
    )
    v_data["recent_maintenance"] = [m.to_dict() for m in records]

    # Attach maintenance reminders
    reminders = (
        db.query(MaintenanceReminder)
        .filter(MaintenanceReminder.vehicle_id == vehicle_id)
        .all()
    )
    v_data["reminders"] = [rem.to_dict() for rem in reminders]

    return v_data


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "spec_source" in update_data and update_data["spec_source"] is not None:
        vehicle.spec_source_json = json.dumps(update_data.pop("spec_source"))

    for key, val in update_data.items():
        setattr(vehicle, key, val)

    db.commit()
    db.refresh(vehicle)
    return vehicle.to_dict()


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db.delete(vehicle)
    db.commit()
    return {"message": f"Vehicle {vehicle_id} deleted successfully"}


@router.get("/{vehicle_id}/health")
def get_vehicle_health_dashboard(vehicle_id: int, db: Session = Depends(get_db)):
    """Computes Subsystem Health Dashboard status with honest 'Not Assessed' defaults."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    subsystems = [
        "engine",
        "electrical",
        "transmission",
        "brakes",
        "cooling_lubrication",
        "suspension_tyres",
        "fuel_system",
    ]

    # Fetch past reports for this vehicle to derive assessed statuses
    reports = (
        db.query(DiagnosticReport)
        .filter(DiagnosticReport.vehicle_id == vehicle_id)
        .order_by(DiagnosticReport.created_at.desc())
        .all()
    )

    health_status = {}
    for sub in subsystems:
        # Default is strictly "Not Assessed"
        health_status[sub] = {
            "status": "Not Assessed",
            "last_assessed": None,
            "severity": None,
            "conclusions_count": 0,
            "evidence_score": None,
        }

    for rep in reports:
        cat = rep.category
        if cat in health_status and health_status[cat]["status"] == "Not Assessed":
            conclusions = json.loads(rep.conclusions_json) if rep.conclusions_json else []
            sev = rep.highest_severity or "low"

            if rep.safety_warning_triggered or sev == "critical":
                stat = "Critical"
            elif sev == "high":
                stat = "Warning"
            elif sev == "medium":
                stat = "Attention Required"
            else:
                stat = "Healthy" if not conclusions else "Attention Required"

            health_status[cat] = {
                "status": stat,
                "last_assessed": rep.created_at.isoformat() if rep.created_at else None,
                "severity": sev,
                "conclusions_count": len(conclusions),
                "evidence_score": conclusions[0].get("evidence_match_score", 100.0) if conclusions else 100.0,
            }

    return {
        "vehicle_id": vehicle_id,
        "vehicle_name": f"{vehicle.year} {vehicle.manufacturer} {vehicle.model}",
        "odometer_km": vehicle.odometer_km,
        "subsystems": health_status,
    }
