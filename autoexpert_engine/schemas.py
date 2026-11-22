"""AutoExpert — Core Data Schemas & Types.

Defines Pydantic/dataclass schemas for Rules, Conditions, Facts, Provenance,
Conflict Resolution, Backward Proof Trees, and Inference Traces.
"""

from __future__ import annotations

import time
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class FactProvenance(str, Enum):
    INITIAL_FACT = "initial_fact"
    SYMPTOM = "symptom"
    OBSERVATION = "observation"
    MEASUREMENT = "measurement"
    DERIVED = "derived"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RuleCategory(str, Enum):
    ENGINE = "engine"
    ELECTRICAL = "electrical"
    TRANSMISSION = "transmission"
    BRAKES = "brakes"
    COOLING_LUBRICATION = "cooling_lubrication"
    SUSPENSION_TYRES = "suspension_tyres"
    FUEL_SYSTEM = "fuel_system"
    MAINTENANCE = "maintenance"


class Condition(BaseModel):
    fact: str
    operator: Literal["==", "!=", "<", "<=", ">", ">=", "in", "not_in"]
    value: Any


class DerivedFact(BaseModel):
    fact: str
    value: Any


class Conclusion(BaseModel):
    fault_id: str
    title: str
    is_final_diagnosis: bool = True


class VehicleApplicability(BaseModel):
    vehicle_types: List[str] = Field(default_factory=lambda: ["any"])
    cooling_types: List[str] = Field(default_factory=lambda: ["any"])
    fuel_types: List[str] = Field(default_factory=lambda: ["any"])

    def is_applicable(self, vehicle: Dict[str, Any]) -> bool:
        v_type = vehicle.get("vehicle_type", "any")
        c_type = vehicle.get("cooling_type", "any")
        f_type = vehicle.get("fuel_type", "any")

        if "any" not in self.vehicle_types and v_type not in self.vehicle_types:
            return False
        if "any" not in self.cooling_types and c_type not in self.cooling_types:
            return False
        if "any" not in self.fuel_types and f_type not in self.fuel_types:
            return False
        return True


class Rule(BaseModel):
    rule_id: str
    name: str
    category: RuleCategory
    vehicle_applicability: VehicleApplicability
    conditions: List[Condition]
    derived_facts: List[DerivedFact] = Field(default_factory=list)
    conclusion: Optional[Conclusion] = None
    severity: SeverityLevel
    safety_critical: bool = False
    priority: int = 50
    explanation_template: str
    recommended_action: str
    preventive_maintenance: str = ""

    @property
    def specificity(self) -> int:
        return len(self.conditions)


class Fact(BaseModel):
    key: str
    value: Any
    provenance: FactProvenance = FactProvenance.INITIAL_FACT
    source_rule_id: Optional[str] = None
    pass_number: int = 0
    timestamp: float = Field(default_factory=time.time)

    def is_unknown(self) -> bool:
        return self.value == "UNKNOWN" or self.value is None


class ConflictSetEntry(BaseModel):
    rule_id: str
    rule_name: str
    safety_critical: bool
    specificity: int
    priority: int


class ConflictResolutionLog(BaseModel):
    pass_number: int
    competing_rules: List[ConflictSetEntry]
    chosen_rule_id: str
    rationale: str


class ForwardChainingTraceStep(BaseModel):
    pass_number: int
    rule_id: str
    rule_name: str
    satisfied_conditions: List[Dict[str, Any]]
    derived_facts_added: List[Dict[str, Any]] = Field(default_factory=list)
    conclusion_reached: Optional[Dict[str, Any]] = None
    explanation: str


class ForwardChainingResult(BaseModel):
    conclusions: List[Dict[str, Any]]
    derived_facts: List[Dict[str, Any]]
    triggered_rules: List[str]
    conflict_log: List[ConflictResolutionLog]
    execution_steps: List[ForwardChainingTraceStep]
    runtime_ms: float
    fixed_point_reached: bool
    total_passes: int


class ProofStatus(str, Enum):
    PROVEN = "PROVEN"
    DISPROVEN = "DISPROVEN"
    INCONCLUSIVE_MISSING_FACTS = "INCONCLUSIVE_MISSING_FACTS"


class ProofNode(BaseModel):
    goal: str
    status: ProofStatus
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    children: List[ProofNode] = Field(default_factory=list)
    missing_facts: List[str] = Field(default_factory=list)
    details: str = ""


class ProofTree(BaseModel):
    target_goal: str
    status: ProofStatus
    root_nodes: List[ProofNode] = Field(default_factory=list)
    missing_facts: List[str] = Field(default_factory=list)
    suggested_questions: List[Dict[str, Any]] = Field(default_factory=list)
    cycles_prevented: List[str] = Field(default_factory=list)


class DiagnosticReportData(BaseModel):
    report_code: str
    vehicle_id: Optional[int]
    category: str
    odometer_at_diagnosis: Optional[int]
    conclusions: List[Dict[str, Any]]
    highest_severity: str
    safety_warning_triggered: bool
    explanation: Dict[str, Any]
    created_at: float = Field(default_factory=time.time)
