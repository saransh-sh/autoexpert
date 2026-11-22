"""AutoExpert — Genuine Multi-Pass Forward Chaining Inference Engine.

Iterates through rule evaluation passes until a fixed point is reached.
Demonstrates multi-hop chained inference, refraction enforcement,
conflict resolution logging, and detailed step-by-step trace generation.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional, Tuple

from autoexpert_engine.conflict_resolution import ConflictResolver
from autoexpert_engine.schemas import (
    FactProvenance,
    ForwardChainingResult,
    ForwardChainingTraceStep,
    Rule,
)
from autoexpert_engine.working_memory import WorkingMemory


class ForwardChainingEngine:
    """Multi-pass data-driven forward chaining engine."""

    def __init__(self, rules: List[Rule]):
        self.rules = rules
        self.conflict_resolver = ConflictResolver()

    def run(
        self,
        working_memory: WorkingMemory,
        vehicle_context: Optional[Dict[str, Any]] = None,
        max_passes: int = 50,
    ) -> ForwardChainingResult:
        """Executes multi-pass forward chaining until no new rules can fire (fixed point)."""
        start_time = time.perf_counter()

        self.conflict_resolver.reset_refraction()
        execution_steps: List[ForwardChainingTraceStep] = []
        conflict_log = []
        conclusions: List[Dict[str, Any]] = []
        derived_facts: List[Dict[str, Any]] = []
        triggered_rules: List[str] = []

        pass_number = 1
        fixed_point_reached = False

        # Filter rules applicable to the vehicle
        applicable_rules = [
            r for r in self.rules
            if vehicle_context is None or r.vehicle_applicability.is_applicable(vehicle_context)
        ]

        while pass_number <= max_passes:
            working_memory.set_pass_number(pass_number)

            # Find all eligible rules that satisfy all conditions under 3VL and are not refracted
            candidate_rules: List[Tuple[Rule, List[Dict[str, Any]]]] = []

            for rule in applicable_rules:
                if self.conflict_resolver.is_refracted(rule.rule_id):
                    continue

                all_sat, eval_details = working_memory.evaluate_all_conditions(rule.conditions)
                if all_sat:
                    candidate_rules.append((rule, eval_details))

            if not candidate_rules:
                # No eligible rules can fire -> fixed point reached
                fixed_point_reached = True
                break

            # Separate out the rules for conflict resolution
            rules_in_conflict = [cr[0] for cr in candidate_rules]
            eval_map = {cr[0].rule_id: cr[1] for cr in candidate_rules}

            winning_rule, resolution_log = self.conflict_resolver.resolve(
                rules_in_conflict, pass_number=pass_number
            )

            if winning_rule is None:
                fixed_point_reached = True
                break

            if resolution_log:
                conflict_log.append(resolution_log)

            # Fire the winning rule
            self.conflict_resolver.record_fired(winning_rule.rule_id)
            triggered_rules.append(winning_rule.rule_id)

            step_derived: List[Dict[str, Any]] = []
            for df in winning_rule.derived_facts:
                changed = working_memory.assert_fact(
                    key=df.fact,
                    value=df.value,
                    provenance=FactProvenance.DERIVED,
                    source_rule_id=winning_rule.rule_id,
                    pass_number=pass_number,
                )
                df_entry = {
                    "fact": df.fact,
                    "value": df.value,
                    "source_rule_id": winning_rule.rule_id,
                    "pass_number": pass_number,
                }
                step_derived.append(df_entry)
                derived_facts.append(df_entry)

            step_conclusion: Optional[Dict[str, Any]] = None
            if winning_rule.conclusion:
                step_conclusion = {
                    "fault_id": winning_rule.conclusion.fault_id,
                    "title": winning_rule.conclusion.title,
                    "rule_id": winning_rule.rule_id,
                    "category": winning_rule.category.value,
                    "severity": winning_rule.severity.value,
                    "safety_critical": winning_rule.safety_critical,
                    "explanation": winning_rule.explanation_template,
                    "recommended_action": winning_rule.recommended_action,
                    "preventive_maintenance": winning_rule.preventive_maintenance,
                    "is_final_diagnosis": winning_rule.conclusion.is_final_diagnosis,
                    "pass_number": pass_number,
                }
                conclusions.append(step_conclusion)

            # Build trace step
            trace_step = ForwardChainingTraceStep(
                pass_number=pass_number,
                rule_id=winning_rule.rule_id,
                rule_name=winning_rule.name,
                satisfied_conditions=eval_map.get(winning_rule.rule_id, []),
                derived_facts_added=step_derived,
                conclusion_reached=step_conclusion,
                explanation=winning_rule.explanation_template,
            )
            execution_steps.append(trace_step)

            pass_number += 1

        runtime_ms = (time.perf_counter() - start_time) * 1000.0

        return ForwardChainingResult(
            conclusions=conclusions,
            derived_facts=derived_facts,
            triggered_rules=triggered_rules,
            conflict_log=conflict_log,
            execution_steps=execution_steps,
            runtime_ms=round(runtime_ms, 2),
            fixed_point_reached=fixed_point_reached,
            total_passes=pass_number - 1,
        )
