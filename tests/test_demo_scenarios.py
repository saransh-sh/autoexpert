"""Unit tests verifying all 10+ academic demo scenarios in knowledge_base/demo_scenarios.json."""

import json
from pathlib import Path
import pytest
from autoexpert_engine.diagnostic_engine import DiagnosticEngine


@pytest.fixture
def scenarios():
    scenario_path = Path(__file__).resolve().parent.parent / "knowledge_base" / "demo_scenarios.json"
    with open(scenario_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def engine():
    return DiagnosticEngine()


def test_all_10_scenarios_pass(engine, scenarios):
    """Ensure all 10+ academic scenarios pass expected conclusions and safety escalation parity."""
    assert len(scenarios) >= 10

    for sc in scenarios:
        res = engine.run_forward_chaining(
            facts=sc["initial_facts"],
            vehicle_context=sc["vehicle_profile"],
        )

        concluded_fault_ids = [c["fault_id"] for c in res.conclusions]
        for expected_fault in sc["expected_conclusions"]:
            assert expected_fault in concluded_fault_ids, (
                f"Scenario '{sc['scenario_id']}' failed: expected conclusion '{expected_fault}' "
                f"not found in {concluded_fault_ids}"
            )

        for expected_rule in sc["expected_triggered_rules"]:
            assert expected_rule in res.triggered_rules, (
                f"Scenario '{sc['scenario_id']}' failed: expected rule '{expected_rule}' "
                f"not triggered in {res.triggered_rules}"
            )

        is_safety = any(c.get("safety_critical") for c in res.conclusions)
        assert is_safety == sc["expected_safety_escalation"], (
            f"Scenario '{sc['scenario_id']}' safety escalation mismatch: "
            f"expected {sc['expected_safety_escalation']} but got {is_safety}"
        )
