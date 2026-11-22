"""Unit tests for 5-Tier Deterministic Conflict Resolution."""

import pytest
from autoexpert_engine.conflict_resolution import ConflictResolver
from autoexpert_engine.schemas import (
    Condition,
    Rule,
    RuleCategory,
    SeverityLevel,
    VehicleApplicability,
)


@pytest.fixture
def resolver():
    return ConflictResolver()


def create_mock_rule(
    rule_id: str,
    safety_critical: bool = False,
    num_conditions: int = 2,
    priority: int = 50,
) -> Rule:
    app = VehicleApplicability(vehicle_types=["any"], cooling_types=["any"], fuel_types=["any"])
    conditions = [
        Condition(fact=f"cond_{i}", operator="==", value=True)
        for i in range(num_conditions)
    ]
    return Rule(
        rule_id=rule_id,
        name=f"Rule {rule_id}",
        category=RuleCategory.ENGINE,
        vehicle_applicability=app,
        conditions=conditions,
        derived_facts=[],
        severity=SeverityLevel.HIGH if safety_critical else SeverityLevel.MEDIUM,
        safety_critical=safety_critical,
        priority=priority,
        explanation_template=f"Mock explanation for {rule_id}",
        recommended_action="Inspect",
    )


def test_tier1_refraction(resolver):
    """Refracted rules must be excluded from conflict set."""
    r1 = create_mock_rule("R1")
    r2 = create_mock_rule("R2")

    resolver.record_fired("R1")
    winner, log = resolver.resolve([r1, r2], pass_number=1)

    assert winner.rule_id == "R2"
    assert "Sole eligible candidate after refraction" in log.rationale


def test_tier2_safety_criticality(resolver):
    """Safety-critical rule must win over non-safety rule regardless of priority/specificity."""
    r_normal = create_mock_rule("R_NORMAL", safety_critical=False, num_conditions=5, priority=95)
    r_safety = create_mock_rule("R_SAFETY", safety_critical=True, num_conditions=1, priority=10)

    winner, log = resolver.resolve([r_normal, r_safety], pass_number=1)

    assert winner.rule_id == "R_SAFETY"
    assert "Safety-Criticality Precedence" in log.rationale


def test_tier3_specificity(resolver):
    """More specific rule (more conditions) must win over broader rule when safety matches."""
    r_broad = create_mock_rule("R_BROAD", safety_critical=False, num_conditions=2, priority=90)
    r_specific = create_mock_rule("R_SPECIFIC", safety_critical=False, num_conditions=4, priority=50)

    winner, log = resolver.resolve([r_broad, r_specific], pass_number=1)

    assert winner.rule_id == "R_SPECIFIC"
    assert "Higher Specificity" in log.rationale


def test_tier4_priority(resolver):
    """Higher explicit priority wins when safety and condition counts match."""
    r_low_prio = create_mock_rule("R_LOW", safety_critical=False, num_conditions=3, priority=40)
    r_high_prio = create_mock_rule("R_HIGH", safety_critical=False, num_conditions=3, priority=80)

    winner, log = resolver.resolve([r_low_prio, r_high_prio], pass_number=1)

    assert winner.rule_id == "R_HIGH"
    assert "Higher Explicit Priority" in log.rationale


def test_tier5_rule_id_tiebreaker(resolver):
    """Deterministic alphabetical sort on rule_id breaks ties."""
    r_b = create_mock_rule("R_B", safety_critical=False, num_conditions=3, priority=50)
    r_a = create_mock_rule("R_A", safety_critical=False, num_conditions=3, priority=50)

    winner, log = resolver.resolve([r_b, r_a], pass_number=1)

    assert winner.rule_id == "R_A"
    assert "Deterministic Rule ID Tiebreaker" in log.rationale
