"""AutoExpert — Academic Demonstration Scenarios API Router."""

import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException

from autoexpert_engine.diagnostic_engine import DiagnosticEngine
from backend.app.schemas.api_schemas import DemoRunRequest

router = APIRouter(prefix="/api/demo", tags=["Academic Demo"])
diagnostic_engine = DiagnosticEngine()

SCENARIOS_FILE = Path(__file__).resolve().parent.parent.parent.parent / "knowledge_base" / "demo_scenarios.json"


def load_scenarios():
    if SCENARIOS_FILE.exists():
        with open(SCENARIOS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


@router.get("/scenarios")
def list_demo_scenarios():
    return load_scenarios()


@router.post("/run")
def run_demo_scenario(payload: DemoRunRequest):
    scenarios = load_scenarios()
    scenario = next((s for s in scenarios if s["scenario_id"] == payload.scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{payload.scenario_id}' not found")

    facts = scenario["initial_facts"]
    vehicle_context = scenario["vehicle_profile"]

    if payload.mode == "forward":
        result = diagnostic_engine.run_forward_chaining(facts=facts, vehicle_context=vehicle_context)

        actual_faults = [c["fault_id"] for c in result.conclusions]
        expected_faults = scenario["expected_conclusions"]
        faults_matched = all(ef in actual_faults for ef in expected_faults)

        actual_safety = any(c.get("safety_critical") for c in result.conclusions)
        safety_matched = (actual_safety == scenario["expected_safety_escalation"])

        all_matched = faults_matched and safety_matched

        return {
            "scenario": scenario,
            "mode": "forward",
            "runtime_ms": result.runtime_ms,
            "total_passes": result.total_passes,
            "fixed_point_reached": result.fixed_point_reached,
            "triggered_rules": result.triggered_rules,
            "derived_facts": result.derived_facts,
            "conclusions": result.conclusions,
            "conflict_log": [cl.model_dump() for cl in result.conflict_log],
            "execution_steps": [s.model_dump() for s in result.execution_steps],
            "expected_vs_actual": {
                "expected_conclusions": expected_faults,
                "actual_conclusions": actual_faults,
                "expected_safety_escalation": scenario["expected_safety_escalation"],
                "actual_safety_escalation": actual_safety,
                "conclusions_matched": faults_matched,
                "safety_matched": safety_matched,
                "verdict": "MATCH (PASS)" if all_matched else "MISMATCH (FAIL)",
            },
        }
    else:
        # Backward chaining mode
        target_goal = payload.target_goal or (
            scenario["expected_conclusions"][0] if scenario["expected_conclusions"] else "FAULT_WEAK_BATTERY"
        )
        tree = diagnostic_engine.run_backward_chaining(
            target_goal=target_goal,
            facts=facts,
            vehicle_context=vehicle_context,
        )
        return {
            "scenario": scenario,
            "mode": "backward",
            "target_goal": target_goal,
            "proof_tree": tree.model_dump(),
        }
