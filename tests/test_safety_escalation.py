"""Unit tests for Safety-First Escalation and Warning Interruption."""

import pytest
from autoexpert_engine.interview_manager import InterviewManager
from autoexpert_engine.knowledge_base import KnowledgeBase
from autoexpert_engine.working_memory import WorkingMemory


@pytest.fixture
def interview_mgr():
    kb = KnowledgeBase()
    return InterviewManager(kb)


def test_brake_failure_immediate_safety_escalation(interview_mgr):
    """Brake grinding with <= 2mm pads must immediately trigger critical safety escalation."""
    wm = WorkingMemory({
        "brake_pad_thickness_mm": 1.5,
        "brake_grinding_noise": True,
    })

    alert = interview_mgr.check_safety_escalation(wm)
    # Forward chain to derive brake_failure_risk
    interview_mgr.forward_engine.run(wm)
    alert_after_inference = interview_mgr.check_safety_escalation(wm)

    assert alert_after_inference is not None
    assert alert_after_inference["triggered"] is True
    assert "CRITICAL BRAKE SYSTEM RISK" in alert_after_inference["message"]


def test_oil_pressure_warning_safety_halt(interview_mgr):
    """Oil pressure warning light must immediately halt the interview."""
    wm, alert, next_q = interview_mgr.initialize_session(
        category="cooling_lubrication",
        initial_symptoms=["oil_pressure_warning_light"],
        vehicle_context={"vehicle_type": "car", "cooling_type": "liquid_cooled", "fuel_type": "petrol"},
    )

    assert alert is not None
    assert alert["triggered"] is True
    assert "CRITICAL ENGINE RISK" in alert["message"]


def test_fuel_leak_interview_process_answer_halt(interview_mgr):
    """Submitting fuel leak observation must immediately halt the interview without further questions."""
    wm = WorkingMemory()
    alert, next_q, completed = interview_mgr.process_answer(
        working_memory=wm,
        fact_key="fuel_leak_detected",
        value=True,
        provenance="observation",
        category="fuel_system",
    )

    assert alert is not None
    assert alert["triggered"] is True
    assert next_q is None
    assert completed is True
