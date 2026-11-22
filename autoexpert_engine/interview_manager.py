"""AutoExpert — Interactive Diagnostic Interview Manager.

Conducts adaptive, question-driven diagnostic sessions using backward chaining
to identify missing observable facts while enforcing real-time safety escalation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from autoexpert_engine.backward_chaining import BackwardChainingEngine
from autoexpert_engine.forward_chaining import ForwardChainingEngine
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.schemas import FactProvenance, ProofStatus
from autoexpert_engine.working_memory import WorkingMemory


class InterviewManager:
    """Orchestrates interactive interviews with safety guardrails and backward-chaining guidance."""

    SAFETY_CRITICAL_CHECKS = [
        ("brake_failure_risk", True, "CRITICAL BRAKE SYSTEM RISK: Severe brake pad wear, fluid loss, or spongy pedal detected. Do not operate vehicle. Seek certified mechanic immediately."),
        ("oil_pressure_warning_light", True, "CRITICAL ENGINE RISK: Oil pressure warning light illuminated. Running engine without oil pressure will cause catastrophic engine seizure within minutes. Stop engine safely immediately."),
        ("fuel_leak_detected", True, "CRITICAL FIRE HAZARD: Fuel leak detected. High risk of vehicle fire. Turn off ignition, evacuate vehicle, and do not start."),
        ("engine_temperature_critical", True, "CRITICAL OVERHEATING HAZARD: Engine overheating into danger zone. Continuing to drive will cause head gasket failure or cylinder head warping. Pull over safely and shut off engine."),
        ("steering_loss_risk", True, "CRITICAL STEERING HAZARD: Severe steering vibration or mechanical play detected. Loss of directional control risk. Stop safely."),
        ("tyre_blowout_hazard", True, "CRITICAL TYRE HAZARD: Severe structural tyre wear or cord exposure. Extreme blowout risk at speed. Replace tyre before driving."),
    ]

    def __init__(self, kb: KnowledgeBase):
        self.kb = kb
        self.forward_engine = ForwardChainingEngine(kb.rules)
        self.backward_engine = BackwardChainingEngine(kb.rules)

    def check_safety_escalation(self, working_memory: WorkingMemory) -> Optional[Dict[str, Any]]:
        """Checks working memory for any active safety-critical conditions."""
        for fact_key, trigger_val, alert_message in self.SAFETY_CRITICAL_CHECKS:
            if working_memory.has_fact(fact_key):
                val = working_memory.get_value(fact_key)
                if val == trigger_val:
                    return {
                        "triggered": True,
                        "fact": fact_key,
                        "message": alert_message,
                        "level": "CRITICAL_SAFETY_HALT",
                    }
        return None

    def initialize_session(
        self,
        category: str,
        initial_symptoms: List[str],
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[WorkingMemory, Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Initializes working memory with vehicle context and initial symptoms."""
        wm = WorkingMemory()

        # Assert initial symptoms
        for symptom in initial_symptoms:
            wm.assert_fact(
                key=symptom,
                value=True,
                provenance=FactProvenance.SYMPTOM,
                source_rule_id=None,
                pass_number=0,
            )

        # Run forward chaining to derive any immediate facts
        fwd_result = self.forward_engine.run(wm, vehicle_context=vehicle_context)

        # Check safety immediately
        safety_alert = self.check_safety_escalation(wm)
        if not safety_alert:
            for conc in fwd_result.conclusions:
                if conc.get("safety_critical"):
                    safety_alert = {
                        "triggered": True,
                        "fact": conc.get("fault_id"),
                        "message": f"SAFETY ALERT: {conc.get('title')}. {conc.get('recommended_action')}",
                        "level": "CRITICAL_SAFETY_HALT",
                    }
                    break

        next_q = self.get_next_question(wm, category=category, vehicle_context=vehicle_context)
        return wm, safety_alert, next_q

    def process_answer(
        self,
        working_memory: WorkingMemory,
        fact_key: str,
        value: Any,
        provenance: str = "observation",
        category: str = "general",
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], bool]:
        """Asserts user's answer into working memory, runs inference, and retrieves next question.

        Returns:
            (safety_alert, next_question, is_completed)
        """
        # Assert fact into memory
        working_memory.assert_fact(
            key=fact_key,
            value=value,
            provenance=provenance,
            source_rule_id=None,
        )

        # Run forward chaining to fixed point
        fwd_result = self.forward_engine.run(working_memory, vehicle_context=vehicle_context)

        # Check safety escalation
        safety_alert = self.check_safety_escalation(working_memory)
        if not safety_alert:
            for conc in fwd_result.conclusions:
                if conc.get("safety_critical"):
                    safety_alert = {
                        "triggered": True,
                        "fact": conc.get("fault_id"),
                        "message": f"SAFETY ALERT: {conc.get('title')}. {conc.get('recommended_action')}",
                        "level": "CRITICAL_SAFETY_HALT",
                    }
                    break

        # If safety alert triggered, halt interview
        if safety_alert:
            return safety_alert, None, True

        # Retrieve next question
        next_q = self.get_next_question(
            working_memory,
            category=category,
            vehicle_context=vehicle_context,
        )

        is_completed = (next_q is None)
        return safety_alert, next_q, is_completed

    def get_next_question(
        self,
        working_memory: WorkingMemory,
        category: str,
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Identifies the most informative follow-up question by querying candidate rules."""
        candidate_rules = self.kb.get_rules_by_category(category, vehicle=vehicle_context)
        if not candidate_rules:
            candidate_rules = self.kb.get_rules_for_vehicle(vehicle_context or {})

        missing_candidate_facts: Dict[str, int] = {}

        for rule in candidate_rules:
            # Check if this rule is relevant
            if rule.conclusion:
                proof_tree = self.backward_engine.prove_goal(
                    goal=rule.conclusion.fault_id,
                    working_memory=working_memory,
                    vehicle_context=vehicle_context,
                )
                if proof_tree.status == ProofStatus.INCONCLUSIVE_MISSING_FACTS:
                    for fact in proof_tree.missing_facts:
                        if not working_memory.has_fact(fact):
                            missing_candidate_facts[fact] = missing_candidate_facts.get(fact, 0) + (1 + rule.priority // 20)

        if not missing_candidate_facts:
            return None

        # Prioritize fact appearing most frequently across high-priority rules
        sorted_facts = sorted(missing_candidate_facts.items(), key=lambda item: item[1], reverse=True)
        top_fact = sorted_facts[0][0]

        questions = self.backward_engine._generate_questions_for_facts(
            [top_fact], vehicle_context=vehicle_context
        )

        return questions[0] if questions else None
