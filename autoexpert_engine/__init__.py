"""AutoExpert — Intelligent Vehicle Diagnosis & Mechanic Expert System Engine."""

__version__ = "1.0.0"

from autoexpert_engine.schemas import (
    Fact,
    FactProvenance,
    Condition,
    DerivedFact,
    Conclusion,
    Rule,
    VehicleApplicability,
    ConflictSetEntry,
    ConflictResolutionLog,
    ForwardChainingResult,
    ForwardChainingTraceStep,
    ProofTree,
    ProofNode,
    ProofStatus,
    DiagnosticReportData,
)
from autoexpert_engine.working_memory import WorkingMemory
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.conflict_resolution import ConflictResolver
from autoexpert_engine.forward_chaining import ForwardChainingEngine
from autoexpert_engine.backward_chaining import BackwardChainingEngine
from autoexpert_engine.explanation_engine import ExplanationEngine
from autoexpert_engine.interview_manager import InterviewManager
from autoexpert_engine.diagnostic_engine import DiagnosticEngine

__all__ = [
    "Fact",
    "FactProvenance",
    "Condition",
    "DerivedFact",
    "Conclusion",
    "Rule",
    "VehicleApplicability",
    "ConflictSetEntry",
    "ConflictResolutionLog",
    "ForwardChainingResult",
    "ForwardChainingTraceStep",
    "ProofTree",
    "ProofNode",
    "ProofStatus",
    "DiagnosticReportData",
    "WorkingMemory",
    "KnowledgeBase",
    "ConflictResolver",
    "ForwardChainingEngine",
    "BackwardChainingEngine",
    "ExplanationEngine",
    "InterviewManager",
    "DiagnosticEngine",
]
