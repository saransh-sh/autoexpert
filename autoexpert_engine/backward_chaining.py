"""AutoExpert — Genuine Recursive Backward Chaining Inference Engine.

Starts from a target goal, recursively proves subgoals via rules,
enforces cycle detection to prevent infinite recursion, detects missing
observable facts, and generates prioritized follow-up questions.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

from autoexpert_engine.schemas import (
    Condition,
    ProofNode,
    ProofStatus,
    ProofTree,
    Rule,
)
from autoexpert_engine.working_memory import WorkingMemory


class BackwardChainingEngine:
    """Goal-driven recursive backward chaining engine."""

    def __init__(self, rules: List[Rule]):
        self.rules = rules

    def prove_goal(
        self,
        goal: str,
        working_memory: WorkingMemory,
        vehicle_context: Optional[Dict[str, Any]] = None,
    ) -> ProofTree:
        """Entry point to prove a target goal (fault_id or fact key)."""
        visited_goals: Set[str] = set()
        missing_facts: Set[str] = set()
        cycles_prevented: List[str] = []

        root_node = self._prove_recursive(
            goal=goal,
            working_memory=working_memory,
            vehicle_context=vehicle_context,
            visited_goals=visited_goals,
            missing_facts=missing_facts,
            cycles_prevented=cycles_prevented,
        )

        # Generate targeted follow-up questions for missing observable facts
        suggested_questions = self._generate_questions_for_facts(
            missing_facts=list(missing_facts),
            vehicle_context=vehicle_context,
        )

        return ProofTree(
            target_goal=goal,
            status=root_node.status,
            root_nodes=[root_node],
            missing_facts=sorted(list(missing_facts)),
            suggested_questions=suggested_questions,
            cycles_prevented=cycles_prevented,
        )

    def _prove_recursive(
        self,
        goal: str,
        working_memory: WorkingMemory,
        vehicle_context: Optional[Dict[str, Any]],
        visited_goals: Set[str],
        missing_facts: Set[str],
        cycles_prevented: List[str],
    ) -> ProofNode:
        """Recursively proves a goal or subgoal."""
        # 1. Cycle detection: if goal is already being investigated up the call stack
        if goal in visited_goals:
            cycles_prevented.append(f"Cycle prevented on goal '{goal}'")
            return ProofNode(
                goal=goal,
                status=ProofStatus.INCONCLUSIVE_MISSING_FACTS,
                details=f"Cycle detected: goal '{goal}' is already in active proof path.",
            )

        # 2. Check if goal is already established as a fact in Working Memory
        if working_memory.has_fact(goal):
            fact = working_memory.get_fact(goal)
            if fact and not fact.is_unknown():
                if fact.value is True:
                    return ProofNode(
                        goal=goal,
                        status=ProofStatus.PROVEN,
                        details=f"Directly established in Working Memory: {goal} == True",
                    )
                elif fact.value is False:
                    return ProofNode(
                        goal=goal,
                        status=ProofStatus.DISPROVEN,
                        details=f"Directly refuted in Working Memory: {goal} == False",
                    )
                else:
                    return ProofNode(
                        goal=goal,
                        status=ProofStatus.PROVEN,
                        details=f"Directly established in Working Memory: {goal} == {fact.value}",
                    )

        # Mark goal as visited in current branch
        visited_goals.add(goal)

        # 3. Locate all candidate rules that can establish this goal
        candidate_rules = self._find_candidate_rules(goal, vehicle_context)

        if not candidate_rules:
            # No rule can derive this goal -> it must be an observable primitive fact
            visited_goals.remove(goal)
            missing_facts.add(goal)
            return ProofNode(
                goal=goal,
                status=ProofStatus.INCONCLUSIVE_MISSING_FACTS,
                missing_facts=[goal],
                details=f"No rules establish '{goal}'; it is an unobserved primitive fact.",
            )

        # 4. Try candidate rules to prove the goal
        rule_nodes: List[ProofNode] = []
        overall_status = ProofStatus.DISPROVEN
        has_inconclusive = False

        for rule in candidate_rules:
            rule_node, rule_sat, rule_missing = self._evaluate_rule_conditions(
                rule=rule,
                working_memory=working_memory,
                vehicle_context=vehicle_context,
                visited_goals=visited_goals,
                missing_facts=missing_facts,
                cycles_prevented=cycles_prevented,
            )
            rule_nodes.append(rule_node)

            if rule_sat == ProofStatus.PROVEN:
                overall_status = ProofStatus.PROVEN
                # We found a valid proof! (We still record nodes for explanation tree)
                break
            elif rule_sat == ProofStatus.INCONCLUSIVE_MISSING_FACTS:
                has_inconclusive = True

        visited_goals.remove(goal)

        final_status = overall_status
        if overall_status != ProofStatus.PROVEN and has_inconclusive:
            final_status = ProofStatus.INCONCLUSIVE_MISSING_FACTS

        return ProofNode(
            goal=goal,
            status=final_status,
            children=rule_nodes,
            missing_facts=list(missing_facts),
            details=f"Goal '{goal}' evaluated with {len(candidate_rules)} candidate rule(s): status = {final_status.value}.",
        )

    def _evaluate_rule_conditions(
        self,
        rule: Rule,
        working_memory: WorkingMemory,
        vehicle_context: Optional[Dict[str, Any]],
        visited_goals: Set[str],
        missing_facts: Set[str],
        cycles_prevented: List[str],
    ) -> Tuple[ProofNode, ProofStatus, List[str]]:
        """Evaluates conditions of a candidate rule, recursively attempting to prove subgoals."""
        condition_nodes: List[ProofNode] = []
        rule_missing: List[str] = []
        is_disproven = False

        for cond in rule.conditions:
            fact_key = cond.fact
            sat, reason = working_memory.evaluate_condition(cond)

            if sat:
                condition_nodes.append(
                    ProofNode(
                        goal=fact_key,
                        status=ProofStatus.PROVEN,
                        details=reason,
                    )
                )
            else:
                # Check why it failed: is it contradicted or unknown/missing?
                if working_memory.is_known(fact_key):
                    # Fact is known but value contradicts condition
                    is_disproven = True
                    condition_nodes.append(
                        ProofNode(
                            goal=fact_key,
                            status=ProofStatus.DISPROVEN,
                            details=reason,
                        )
                    )
                else:
                    # Fact is missing or UNKNOWN -> attempt recursive subgoal proof
                    sub_node = self._prove_recursive(
                        goal=fact_key,
                        working_memory=working_memory,
                        vehicle_context=vehicle_context,
                        visited_goals=visited_goals,
                        missing_facts=missing_facts,
                        cycles_prevented=cycles_prevented,
                    )
                    condition_nodes.append(sub_node)
                    if sub_node.status == ProofStatus.DISPROVEN:
                        is_disproven = True
                    elif sub_node.status != ProofStatus.PROVEN:
                        rule_missing.append(fact_key)

        if is_disproven:
            rule_status = ProofStatus.DISPROVEN
        elif rule_missing:
            rule_status = ProofStatus.INCONCLUSIVE_MISSING_FACTS
        else:
            rule_status = ProofStatus.PROVEN

        rule_proof_node = ProofNode(
            goal=f"Rule: {rule.rule_id}",
            status=rule_status,
            rule_id=rule.rule_id,
            rule_name=rule.name,
            children=condition_nodes,
            missing_facts=rule_missing,
            details=f"Rule '{rule.name}' condition evaluation: {rule_status.value}",
        )

        return rule_proof_node, rule_status, rule_missing

    def _find_candidate_rules(
        self,
        goal: str,
        vehicle_context: Optional[Dict[str, Any]],
    ) -> List[Rule]:
        """Finds candidate rules that establish the goal as a conclusion or derived fact."""
        candidates = []
        for r in self.rules:
            if vehicle_context and not r.vehicle_applicability.is_applicable(vehicle_context):
                continue

            matches_conclusion = r.conclusion and r.conclusion.fault_id == goal
            matches_derived = any(df.fact == goal for df in r.derived_facts)

            if matches_conclusion or matches_derived:
                candidates.append(r)

        # Sort by priority/specificity
        return sorted(candidates, key=lambda r: (r.safety_critical, r.specificity, r.priority), reverse=True)

    def _generate_questions_for_facts(
        self,
        missing_facts: List[str],
        vehicle_context: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Maps missing fact keys to clean user-facing interview questions."""
        questions = []
        fact_to_question_catalog = {
            "engine_starts": {
                "question": "Does the engine start when attempting to crank or start?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "engine_cranks": {
                "question": "Does the engine crank (turn over) when the starter is engaged?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "starter_clicks": {
                "question": "Do you hear a rapid clicking sound when pressing the starter or turning the key?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "headlights_dim": {
                "question": "Are the headlights visibly dim or flickering when attempting to start?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "battery_voltage_low": {
                "question": "Is the measured battery resting voltage below 12.4V?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "coolant_level_low": {
                "question": "Is the coolant level in the expansion tank below the minimum mark?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "engine_overheating": {
                "question": "Is the temperature gauge reading into the red/high zone or is an overheating light on?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "radiator_fan_runs": {
                "question": "Does the radiator cooling fan spin when the engine reaches operating temperature?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "air_filter_dirty": {
                "question": "Upon physical inspection, is the air filter element heavily clogged with dirt or debris?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "reduced_engine_power": {
                "question": "Is there a noticeable loss of engine acceleration or power under load?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "rpm_rises_without_speed": {
                "question": "When accelerating in gear, do engine RPMs shoot up without a matching increase in road speed?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "clutch_slipping": {
                "question": "Does the clutch feel like it is slipping during acceleration or hill climbing?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "brake_pad_thickness_mm": {
                "question": "What is the measured remaining thickness of the brake friction pads (in mm)?",
                "type": "numeric",
                "unit": "mm",
                "safe_range": ">= 3.0 mm",
            },
            "brake_grinding_noise": {
                "question": "Do you hear a metallic grinding noise when applying the brakes?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "brake_pedal_spongy": {
                "question": "Does the brake pedal or lever feel unusually spongy or travel almost to the floor?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "oil_pressure_warning_light": {
                "question": "Is the red oil pressure warning light illuminated on the instrument cluster?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "visible_oil_leak": {
                "question": "Are there fresh oil puddles under the vehicle or wet oil residue on the engine casing?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "steering_vibration_at_speed": {
                "question": "Does the steering wheel or handlebars vibrate excessively at highway speeds (80-100 km/h)?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "tyre_wear_uneven": {
                "question": "Is there uneven tread wear across the tyre surface (e.g., inner or outer shoulder worn)?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "fuel_smell_present": {
                "question": "Can you smell raw fuel around the vehicle or inside the cabin?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "engine_stalls_at_idle": {
                "question": "Does the engine stall or die when idling or coming to a stop?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "battery_warning_light_on": {
                "question": "Is the battery/charging system warning light illuminated on the dashboard while driving?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "alternator_charging_voltage": {
                "question": "What is the battery terminal voltage while the engine is running at 2000 RPM?",
                "type": "numeric",
                "unit": "Volts",
                "safe_range": "13.8V - 14.5V",
            },
            "engine_mount_cracked": {
                "question": "Are the rubber engine mounts cracked, torn, or saturated with oil upon inspection?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
            "excessive_engine_vibration": {
                "question": "Is there severe shaking or vibration felt through the chassis while idling?",
                "type": "boolean",
                "options": ["Yes", "No", "Unknown"],
            },
        }

        # Filter questions based on vehicle applicability
        is_car = vehicle_context and vehicle_context.get("vehicle_type") == "car"
        is_motorcycle = vehicle_context and vehicle_context.get("vehicle_type") == "motorcycle"
        is_air_cooled = vehicle_context and vehicle_context.get("cooling_type") == "air_cooled"

        for fact in missing_facts:
            # Exclude liquid cooling questions for air-cooled engines
            if is_air_cooled and "coolant" in fact:
                continue

            q_data = fact_to_question_catalog.get(
                fact,
                {
                    "question": f"Is '{fact.replace('_', ' ')}' currently present or observed?",
                    "type": "boolean",
                    "options": ["Yes", "No", "Unknown"],
                },
            )

            questions.append({
                "fact_key": fact,
                "question_text": q_data["question"],
                "input_type": q_data.get("type", "boolean"),
                "options": q_data.get("options", ["Yes", "No", "Unknown"]),
                "unit": q_data.get("unit"),
            })

        return questions
