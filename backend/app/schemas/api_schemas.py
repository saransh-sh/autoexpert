"""AutoExpert — Pydantic v2 API Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# Vehicle Schemas
class VehicleCreate(BaseModel):
    vehicle_type: Literal["motorcycle", "car"]
    manufacturer: str
    model: str
    year: int
    fuel_type: str = "petrol"
    cooling_type: str = "liquid_cooled"
    displacement_cc: Optional[int] = None
    transmission: str = "manual"
    odometer_km: int = 0
    last_service_date: Optional[str] = None
    last_oil_change_date: Optional[str] = None
    registration_no: Optional[str] = None
    spec_source: Dict[str, str] = Field(default_factory=dict)


class VehicleUpdate(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: Optional[str] = None
    cooling_type: Optional[str] = None
    displacement_cc: Optional[int] = None
    transmission: Optional[str] = None
    odometer_km: Optional[int] = None
    last_service_date: Optional[str] = None
    last_oil_change_date: Optional[str] = None
    registration_no: Optional[str] = None
    spec_source: Optional[Dict[str, str]] = None


# Diagnostics Schemas
class DiagnosticStartRequest(BaseModel):
    vehicle_id: Optional[int] = None
    category: str
    initial_symptoms: List[str] = Field(default_factory=list)


class DiagnosticAnswerRequest(BaseModel):
    session_id: int
    fact_key: str
    value: Any
    provenance: str = "observation"


class ForwardChainRawRequest(BaseModel):
    session_id: Optional[int] = None
    vehicle_context: Optional[Dict[str, Any]] = None
    facts: Optional[Dict[str, Any]] = None


class BackwardChainRequest(BaseModel):
    session_id: Optional[int] = None
    target_goal: str
    vehicle_context: Optional[Dict[str, Any]] = None
    facts: Optional[Dict[str, Any]] = None


# Maintenance Schemas
class MaintenanceRecordCreate(BaseModel):
    vehicle_id: int
    item_type: str
    service_date: str
    odometer_km: int
    notes: Optional[str] = ""
    interval_km: Optional[int] = None
    interval_days: Optional[int] = None


class MaintenanceRecordUpdate(BaseModel):
    item_type: Optional[str] = None
    service_date: Optional[str] = None
    odometer_km: Optional[int] = None
    notes: Optional[str] = None


# Demo Schemas
class DemoRunRequest(BaseModel):
    scenario_id: str
    mode: Literal["forward", "backward"] = "forward"
    target_goal: Optional[str] = None


# Settings Schemas
class SettingsUpdate(BaseModel):
    distance_unit: Optional[Literal["km", "mi"]] = None
    pressure_unit: Optional[Literal["psi", "bar"]] = None
    default_demo_playback_ms: Optional[int] = None
