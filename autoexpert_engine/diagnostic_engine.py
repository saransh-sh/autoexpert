"""AutoExpert — Diagnostic Engine Facade.

Integrates KnowledgeBase, WorkingMemory, ForwardChainingEngine,
BackwardChainingEngine, ConflictResolver, InterviewManager, and ExplanationEngine.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from autoexpert_engine.backward_chaining import BackwardChainingEngine
from autoexpert_engine.explanation_engine import ExplanationEngine
from autoexpert_engine.forward_chaining import ForwardChainingEngine
from autoexpert_engine.interview_manager import InterviewManager
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.schemas import (
    DiagnosticReportData,
    ForwardChainingResult,
    ProofTree,
)
from autoexpert_engine.working_memory import WorkingMemory


class DiagnosticEngine:
    """High-level unified expert system engine for AutoExpert."""

    def __init__(self, kb_dir: Optional[Path | str] = None):
        self.kb = KnowledgeBase(kb_dir=kb_dir)
        self.forward_engine = ForwardChainingEngine(self.kb.rules)
        self.backward_engine = BackwardChainingEngine(self.kb.rules)
        self.interview_manager = InterviewManager(self.kb)
        self.explanation_engine = ExplanationEngine()

    def run_forward_chaining(
        self,
        facts: Dict[str, Any],
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> ForwardChainingResult:
        """Run standalone multi-pass forward chaining from raw facts."""
        wm = WorkingMemory(initial_facts=facts)
        return self.forward_engine.run(wm, vehicle_context=vehicle_context)

    def run_backward_chaining(
        self,
        target_goal: str,
        facts: Dict[str, Any],
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> ProofTree:
        """Run standalone recursive backward chaining for a target goal."""
        wm = WorkingMemory(initial_facts=facts)
        return self.backward_engine.prove_goal(
            goal=target_goal,
            working_memory=wm,
            vehicle_context=vehicle_context,
        )

    def generate_report(
        self,
        working_memory: WorkingMemory,
        category: str,
        vehicle_id: Optional[int] = None,
        odometer: Optional[int] = None,
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> DiagnosticReportData:
        """Runs forward chaining and compiles an immutable DiagnosticReportData."""
        result = self.forward_engine.run(working_memory, vehicle_context=vehicle_context)
        explanation = self.explanation_engine.explain_forward_chaining(result, working_memory)

        # Calculate highest severity
        severity_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        highest_sev = "low"
        max_rank = 0
        for conc in result.conclusions:
            sev = conc.get("severity", "low")
            if severity_rank.get(sev, 1) > max_rank:
                max_rank = severity_rank.get(sev, 1)
                highest_sev = sev

        safety_triggered = explanation["safety_escalation"]

        # Calculate Evidence-Match Score strictly per conclusion
        conclusions_with_scores = []
        for conc in result.conclusions:
            rule_id = conc["rule_id"]
            rule = self.kb.get_rule(rule_id)
            total_conds = len(rule.conditions) if rule else 1
            sat_conds = 0
            if rule:
                for cond in rule.conditions:
                    sat, _ = working_memory.evaluate_condition(cond)
                    if sat:
                        sat_conds += 1
            evidence_score = round((sat_conds / total_conds) * 100.0, 1)
            
            conc_copy = dict(conc)
            conc_copy["evidence_match_score"] = evidence_score
            conclusions_with_scores.append(conc_copy)

        report_code = f"REP-{uuid.uuid4().hex[:8].upper()}"

        return DiagnosticReportData(
            report_code=report_code,
            vehicle_id=vehicle_id,
            category=category,
            odometer_at_diagnosis=odometer,
            conclusions=conclusions_with_scores,
            highest_severity=highest_sev,
            safety_warning_triggered=safety_triggered,
            explanation=explanation,
        )
