"""Unit tests for Recursive Backward Chaining, Cycle Detection, and Missing Fact Identification."""

import pytest
from autoexpert_engine.backward_chaining import BackwardChainingEngine
from autoexpert_engine.schemas import (
    Condition,
    DerivedFact,
    ProofStatus,
    Rule,
    RuleCategory,
    SeverityLevel,
    VehicleApplicability,
)
from autoexpert_engine.working_memory import WorkingMemory


@pytest.fixture
def sample_rules():
    app = VehicleApplicability(vehicle_types=["motorcycle"], cooling_types=["any"], fuel_types=["any"])
    
    r1 = Rule(
        rule_id="TEST_R1",
        name="Test Starter Rule",
        category=RuleCategory.ELECTRICAL,
        vehicle_applicability=app,
        conditions=[
            Condition(fact="starter_clicks", operator="==", value=True),
            Condition(fact="battery_low", operator="==", value=True),
        ],
        derived_facts=[DerivedFact(fact="subgoal_power", value=True)],
        severity=SeverityLevel.MEDIUM,
        explanation_template="Starter clicks with low battery",
        recommended_action="Charge battery",
    )

    r2 = Rule(
        rule_id="TEST_R2",
        name="Test Final Fault Rule",
        category=RuleCategory.ELECTRICAL,
        vehicle_applicability=app,
        conditions=[
            Condition(fact="subgoal_power", operator="==", value=True),
            Condition(fact="headlights_dim", operator="==", value=True),
        ],
        derived_facts=[],
        conclusion={"fault_id": "FAULT_TEST_BATTERY", "title": "Test Battery Fault", "is_final_diagnosis": True},
        severity=SeverityLevel.MEDIUM,
        explanation_template="Power issue with dim lights",
        recommended_action="Replace battery",
    )

    return [r1, r2]


def test_backward_chaining_proven(sample_rules):
    """When all prerequisite facts are known, goal must be PROVEN."""
    engine = BackwardChainingEngine(sample_rules)
    wm = WorkingMemory({
        "starter_clicks": True,
        "battery_low": True,
        "headlights_dim": True,
    })

    tree = engine.prove_goal("FAULT_TEST_BATTERY", wm)
    assert tree.status == ProofStatus.PROVEN
    assert len(tree.missing_facts) == 0


def test_backward_chaining_inconclusive_missing_facts(sample_rules):
    """When facts are missing, engine must return INCONCLUSIVE and list missing facts."""
    engine = BackwardChainingEngine(sample_rules)
    wm = WorkingMemory({
        "starter_clicks": True,
        # battery_low and headlights_dim are missing!
    })

    tree = engine.prove_goal("FAULT_TEST_BATTERY", wm)
    assert tree.status == ProofStatus.INCONCLUSIVE_MISSING_FACTS
    assert "battery_low" in tree.missing_facts
    assert "headlights_dim" in tree.missing_facts
    assert len(tree.suggested_questions) >= 1


def test_backward_chaining_cycle_detection():
    """Engine must detect recursive rule cycles and prevent infinite loops."""
    app = VehicleApplicability(vehicle_types=["any"], cooling_types=["any"], fuel_types=["any"])

    # Cycle: Rule A requires Goal B, Rule B requires Goal A
    cycle_r1 = Rule(
        rule_id="CYCLE_R1",
        name="Cycle Rule 1",
        category=RuleCategory.ENGINE,
        vehicle_applicability=app,
        conditions=[Condition(fact="goal_b", operator="==", value=True)],
        derived_facts=[DerivedFact(fact="goal_a", value=True)],
        severity=SeverityLevel.LOW,
        explanation_template="A derives from B",
        recommended_action="None",
    )
    cycle_r2 = Rule(
        rule_id="CYCLE_R2",
        name="Cycle Rule 2",
        category=RuleCategory.ENGINE,
        vehicle_applicability=app,
        conditions=[Condition(fact="goal_a", operator="==", value=True)],
        derived_facts=[DerivedFact(fact="goal_b", value=True)],
        severity=SeverityLevel.LOW,
        explanation_template="B derives from A",
        recommended_action="None",
    )

    engine = BackwardChainingEngine([cycle_r1, cycle_r2])
    wm = WorkingMemory()  # Neither A nor B is known

    # Proving goal_a should not crash with RecursionError
    tree = engine.prove_goal("goal_a", wm)
    assert len(tree.cycles_prevented) >= 1
    assert "Cycle prevented on goal 'goal_a'" in tree.cycles_prevented[0]
