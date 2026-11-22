"""Unit tests for KnowledgeBase loading, indexing, and JSON schema validation."""

import pytest
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.schemas import RuleCategory


@pytest.fixture
def kb():
    return KnowledgeBase()


def test_kb_load_and_validation(kb):
    """KB must load and validate at least 50 rules against rule_schema.json."""
    assert kb.total_count() >= 50
    stats = kb.stats()
    assert stats["total_rules"] >= 50
    assert len(stats["by_category"]) >= 7


def test_rule_uniqueness(kb):
    """Every rule must have a unique rule_id."""
    ids = [r.rule_id for r in kb.rules]
    assert len(ids) == len(set(ids)), "Duplicate rule_id found in knowledge base"


def test_vehicle_applicability(kb):
    """Rules should filter correctly by vehicle type."""
    moto_vehicle = {"vehicle_type": "motorcycle", "cooling_type": "air_cooled", "fuel_type": "petrol"}
    car_vehicle = {"vehicle_type": "car", "cooling_type": "liquid_cooled", "fuel_type": "petrol"}

    moto_rules = kb.get_rules_for_vehicle(moto_vehicle)
    car_rules = kb.get_rules_for_vehicle(car_vehicle)

    assert len(moto_rules) > 0
    assert len(car_rules) > 0
    # Car rules should not include motorcycle-only rules
    for r in car_rules:
        assert "motorcycle" not in r.vehicle_applicability.vehicle_types or "car" in r.vehicle_applicability.vehicle_types or "any" in r.vehicle_applicability.vehicle_types


def test_rule_indexing(kb):
    """Rules should be indexed by category, conclusion, and derived facts."""
    elec_rules = kb.get_rules_by_category("electrical")
    assert len(elec_rules) >= 4

    candidate_rules = kb.get_rules_establishing_goal("FAULT_WEAK_BATTERY")
    assert len(candidate_rules) >= 1
    assert any(r.rule_id == "MOTO_ELEC_001" for r in candidate_rules)
