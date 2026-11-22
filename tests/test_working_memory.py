"""Unit tests for Three-Valued Logic (3VL) Working Memory."""

import pytest
from autoexpert_engine.schemas import Condition, FactProvenance
from autoexpert_engine.working_memory import WorkingMemory


def test_working_memory_3vl_unknown_is_not_false():
    """3VL Core Requirement: Missing or UNKNOWN facts must never evaluate to FALSE."""
    wm = WorkingMemory()
    
    # Check is_known, is_unknown, is_false
    assert wm.is_unknown("headlights_dim") is True
    assert wm.is_false("headlights_dim") is False
    assert wm.is_true("headlights_dim") is False

    # Condition checking headlights_dim == False should NOT be satisfied if unknown
    cond_false = Condition(fact="headlights_dim", operator="==", value=False)
    sat, reason = wm.evaluate_condition(cond_false)
    assert sat is False
    assert "UNKNOWN or missing" in reason

    # Condition checking headlights_dim == True should NOT be satisfied if unknown
    cond_true = Condition(fact="headlights_dim", operator="==", value=True)
    sat, reason = wm.evaluate_condition(cond_true)
    assert sat is False
    assert "UNKNOWN or missing" in reason


def test_fact_assertion_and_provenance():
    """Facts must preserve provenance, pass number, and source rule."""
    wm = WorkingMemory()
    wm.set_pass_number(1)

    changed = wm.assert_fact(
        key="coolant_level_low",
        value=True,
        provenance=FactProvenance.OBSERVATION,
        source_rule_id=None,
        pass_number=1,
    )
    assert changed is True

    fact = wm.get_fact("coolant_level_low")
    assert fact is not None
    assert fact.value is True
    assert fact.provenance == FactProvenance.OBSERVATION
    assert fact.pass_number == 1
    assert fact.source_rule_id is None

    # Asserting exact same fact should return False (no mutation)
    changed_again = wm.assert_fact(
        key="coolant_level_low",
        value=True,
        provenance=FactProvenance.OBSERVATION,
    )
    assert changed_again is False


def test_condition_operators():
    """All comparative operators must be supported."""
    wm = WorkingMemory({
        "temperature": 105.5,
        "speed": 90,
        "mode": "sport",
        "gear": 4,
    })

    assert wm.evaluate_condition(Condition(fact="temperature", operator=">", value=100.0))[0] is True
    assert wm.evaluate_condition(Condition(fact="temperature", operator="<=", value=100.0))[0] is False
    assert wm.evaluate_condition(Condition(fact="speed", operator=">=", value=90))[0] is True
    assert wm.evaluate_condition(Condition(fact="mode", operator="==", value="sport"))[0] is True
    assert wm.evaluate_condition(Condition(fact="mode", operator="!=", value="eco"))[0] is True
    assert wm.evaluate_condition(Condition(fact="mode", operator="in", value=["sport", "track"]))[0] is True
    assert wm.evaluate_condition(Condition(fact="mode", operator="not_in", value=["eco", "comfort"]))[0] is True


def test_serialization_roundtrip():
    """WorkingMemory should serialize to dict and restore accurately."""
    wm = WorkingMemory()
    wm.assert_fact("fact1", True, FactProvenance.SYMPTOM)
    wm.assert_fact("fact2", 42.0, FactProvenance.MEASUREMENT)

    data = wm.to_dict()
    restored = WorkingMemory.from_dict(data)

    assert restored.get_value("fact1") is True
    assert restored.get_value("fact2") == 42.0
    assert restored.get_fact("fact1").provenance == FactProvenance.SYMPTOM
