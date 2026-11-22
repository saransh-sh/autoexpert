"""Unit tests for Multi-Pass Forward Chaining and Multi-Hop Inference."""

import pytest
from autoexpert_engine.diagnostic_engine import DiagnosticEngine
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.working_memory import WorkingMemory


@pytest.fixture
def engine():
    return DiagnosticEngine()


def test_multihop_chained_inference(engine):
    """Demonstrate genuine multi-hop chained inference across multiple passes."""
    # Scenario: Stator/Rectifier Failure requires 3 passes
    # Pass 1: MOTO_ELEC_001 fires -> derives power_supply_insufficient
    # Pass 2: MOTO_ELEC_002 fires -> derives charging_system_suspect
    # Pass 3: MOTO_ELEC_003 fires -> concludes FAULT_STATOR_REGULATOR_FAILURE
    facts = {
        "engine_starts": False,
        "starter_clicks": True,
        "headlights_dim": True,
        "battery_recharged_recently": True,
        "stator_ac_voltage_low": True,
    }
    moto_ctx = {"vehicle_type": "motorcycle", "cooling_type": "liquid_cooled", "fuel_type": "petrol"}

    result = engine.run_forward_chaining(facts, vehicle_context=moto_ctx)

    assert result.fixed_point_reached is True
    assert result.total_passes >= 3
    assert "MOTO_ELEC_001" in result.triggered_rules
    assert "MOTO_ELEC_002" in result.triggered_rules
    assert "MOTO_ELEC_003" in result.triggered_rules

    fault_ids = [c["fault_id"] for c in result.conclusions]
    assert "FAULT_WEAK_BATTERY" in fault_ids
    assert "FAULT_STATOR_REGULATOR_FAILURE" in fault_ids

    derived_keys = [d["fact"] for d in result.derived_facts]
    assert "power_supply_insufficient" in derived_keys
    assert "charging_system_suspect" in derived_keys


def test_refraction_enforcement(engine):
    """Refraction must prevent rules from firing repeatedly."""
    facts = {
        "engine_starts": False,
        "starter_clicks": True,
        "headlights_dim": True,
    }
    moto_ctx = {"vehicle_type": "motorcycle", "cooling_type": "liquid_cooled", "fuel_type": "petrol"}

    result = engine.run_forward_chaining(facts, vehicle_context=moto_ctx)
    
    # MOTO_ELEC_001 should only fire once
    m001_activations = [r for r in result.triggered_rules if r == "MOTO_ELEC_001"]
    assert len(m001_activations) == 1
    assert result.fixed_point_reached is True
