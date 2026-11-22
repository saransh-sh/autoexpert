"""AutoExpert — Maintenance Records & Reminders API Router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.db_models import MaintenanceRecord, MaintenanceReminder, Vehicle
from backend.app.schemas.api_schemas import MaintenanceRecordCreate, MaintenanceRecordUpdate

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


@router.get("")
def get_maintenance_overview(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
):
    rec_query = db.query(MaintenanceRecord)
    rem_query = db.query(MaintenanceReminder)

    if vehicle_id:
        rec_query = rec_query.filter(MaintenanceRecord.vehicle_id == vehicle_id)
        rem_query = rem_query.filter(MaintenanceReminder.vehicle_id == vehicle_id)

    records = rec_query.order_by(MaintenanceRecord.service_date.desc()).all()
    reminders = rem_query.all()

    # Determine due alerts
    due_alerts = [r.to_dict() for r in reminders if r.status in ("due", "overdue")]

    return {
        "records": [r.to_dict() for r in records],
        "reminders": [rem.to_dict() for rem in reminders],
        "due_alerts": due_alerts,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_maintenance_entry(payload: MaintenanceRecordCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Create service record
    record = MaintenanceRecord(
        vehicle_id=payload.vehicle_id,
        item_type=payload.item_type,
        service_date=payload.service_date,
        odometer_km=payload.odometer_km,
        notes=payload.notes or "",
    )
    db.add(record)

    # If interval is provided, create or update a reminder
    if payload.interval_km or payload.interval_days:
        next_km = payload.odometer_km + (payload.interval_km or 10000)
        reminder = MaintenanceReminder(
            vehicle_id=payload.vehicle_id,
            item_type=payload.item_type,
            interval_km=payload.interval_km,
            interval_days=payload.interval_days,
            interval_source="user_custom",
            next_due_km=next_km,
            status="pending",
        )
        db.add(reminder)

    # Update vehicle's odometer and last service date
    if payload.odometer_km > vehicle.odometer_km:
        vehicle.odometer_km = payload.odometer_km
    vehicle.last_service_date = payload.service_date
    if "oil" in payload.item_type.lower():
        vehicle.last_oil_change_date = payload.service_date

    db.commit()
    db.refresh(record)
    return record.to_dict()


@router.put("/{record_id}")
def update_maintenance_record(
    record_id: int, payload: MaintenanceRecordUpdate, db: Session = Depends(get_db)
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(record, key, val)

    db.commit()
    db.refresh(record)
    return record.to_dict()
