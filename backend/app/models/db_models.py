"""AutoExpert — SQLAlchemy 2.0 ORM Models."""

from datetime import datetime
import json
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String(50), nullable=False)  # "motorcycle" | "car"
    manufacturer = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    fuel_type = Column(String(50), default="petrol")  # "petrol", "diesel", "hybrid", "electric"
    cooling_type = Column(String(50), default="liquid_cooled")  # "air_cooled", "liquid_cooled", "oil_cooled"
    displacement_cc = Column(Integer, nullable=True)
    transmission = Column(String(50), default="manual")  # "manual", "automatic", "cvt"
    odometer_km = Column(Integer, default=0)
    last_service_date = Column(String(50), nullable=True)
    last_oil_change_date = Column(String(50), nullable=True)
    registration_no = Column(String(50), nullable=True)
    spec_source_json = Column(Text, default="{}")  # Provenance: User-Entered, Verified, Estimated
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("DiagnosticSession", back_populates="vehicle", cascade="all, delete-orphan")
    reports = relationship("DiagnosticReport", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_reminders = relationship("MaintenanceReminder", back_populates="vehicle", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "vehicle_type": self.vehicle_type,
            "manufacturer": self.manufacturer,
            "model": self.model,
            "year": self.year,
            "fuel_type": self.fuel_type,
            "cooling_type": self.cooling_type,
            "displacement_cc": self.displacement_cc,
            "transmission": self.transmission,
            "odometer_km": self.odometer_km,
            "last_service_date": self.last_service_date,
            "last_oil_change_date": self.last_oil_change_date,
            "registration_no": self.registration_no,
            "spec_source": json.loads(self.spec_source_json) if self.spec_source_json else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(50), nullable=False)
    mode = Column(String(50), default="interview")  # "forward", "backward", "interview"
    status = Column(String(50), default="in_progress")  # "in_progress", "completed", "safety_escalated"
    working_memory_json = Column(Text, default="{}")
    trace_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="sessions")
    facts = relationship("SessionFact", back_populates="session", cascade="all, delete-orphan")


class SessionFact(Base):
    __tablename__ = "session_facts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"), nullable=False)
    fact_key = Column(String(100), nullable=False)
    fact_value = Column(String(200), nullable=False)
    provenance = Column(String(50), default="symptom")
    source_rule_id = Column(String(50), nullable=True)
    pass_number = Column(Integer, default=0)

    session = relationship("DiagnosticSession", back_populates="facts")


class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    session_id = Column(Integer, ForeignKey("diagnostic_sessions.id", ondelete="SET NULL"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    odometer_at_diagnosis = Column(Integer, nullable=True)
    category = Column(String(50), nullable=False)
    conclusions_json = Column(Text, default="[]")
    highest_severity = Column(String(50), default="low")
    safety_warning_triggered = Column(Boolean, default=False)
    explanation_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="reports")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "report_code": self.report_code,
            "session_id": self.session_id,
            "vehicle_id": self.vehicle_id,
            "odometer_at_diagnosis": self.odometer_at_diagnosis,
            "category": self.category,
            "conclusions": json.loads(self.conclusions_json) if self.conclusions_json else [],
            "highest_severity": self.highest_severity,
            "safety_warning_triggered": self.safety_warning_triggered,
            "explanation": json.loads(self.explanation_json) if self.explanation_json else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(100), nullable=False)
    service_date = Column(String(50), nullable=False)
    odometer_km = Column(Integer, nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_records")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "item_type": self.item_type,
            "service_date": self.service_date,
            "odometer_km": self.odometer_km,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MaintenanceReminder(Base):
    __tablename__ = "maintenance_reminders"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(100), nullable=False)
    interval_km = Column(Integer, nullable=True)
    interval_days = Column(Integer, nullable=True)
    interval_source = Column(String(50), default="verified")  # "verified", "user_custom"
    next_due_km = Column(Integer, nullable=True)
    next_due_date = Column(String(50), nullable=True)
    status = Column(String(50), default="pending")  # "pending", "due", "overdue", "completed"

    vehicle = relationship("Vehicle", back_populates="maintenance_reminders")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "item_type": self.item_type,
            "interval_km": self.interval_km,
            "interval_days": self.interval_days,
            "interval_source": self.interval_source,
            "next_due_km": self.next_due_km,
            "next_due_date": self.next_due_date,
            "status": self.status,
        }


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    distance_unit = Column(String(10), default="km")  # "km" | "mi"
    pressure_unit = Column(String(10), default="psi")  # "psi" | "bar"
    default_demo_playback_ms = Column(Integer, default=500)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "distance_unit": self.distance_unit,
            "pressure_unit": self.pressure_unit,
            "default_demo_playback_ms": self.default_demo_playback_ms,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
