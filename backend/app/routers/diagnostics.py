"""AutoExpert — Diagnostics & Inference API Router."""

import json
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from autoexpert_engine.diagnostic_engine import DiagnosticEngine
from autoexpert_engine.interview_manager import InterviewManager
from autoexpert_engine.schemas import FactProvenance
from autoexpert_engine.working_memory import WorkingMemory
from backend.app.database import get_db
from backend.app.models.db_models import DiagnosticReport, DiagnosticSession, SessionFact, Vehicle
from backend.app.schemas.api_schemas import (
    BackwardChainRequest,
    DiagnosticAnswerRequest,
    DiagnosticStartRequest,
    ForwardChainRawRequest,
)

router = APIRouter(prefix="/api/diagnostics", tags=["Diagnostics & Inference"])

# Engine singleton
diagnostic_engine = DiagnosticEngine()


@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_diagnostic_session(payload: DiagnosticStartRequest, db: Session = Depends(get_db)):
    vehicle = None
    vehicle_context = None
    if payload.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
        if vehicle:
            vehicle_context = vehicle.to_dict()

    wm, safety_alert, next_q = diagnostic_engine.interview_manager.initialize_session(
        category=payload.category,
        initial_symptoms=payload.initial_symptoms,
        vehicle_context=vehicle_context,
    )

    db_session = DiagnosticSession(
        vehicle_id=payload.vehicle_id,
        category=payload.category,
        mode="interview",
        status="safety_escalated" if safety_alert else "in_progress",
        working_memory_json=json.dumps(wm.to_dict()),
        trace_json="[]",
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Persist facts
    for key, f in wm.all_facts().items():
        s_fact = SessionFact(
            session_id=db_session.id,
            fact_key=key,
            fact_value=str(f.value),
            provenance=f.provenance.value,
            source_rule_id=f.source_rule_id,
            pass_number=f.pass_number,
        )
        db.add(s_fact)
    db.commit()

    return {
        "session_id": db_session.id,
        "category": payload.category,
        "status": db_session.status,
        "safety_alert": safety_alert,
        "next_question": next_q,
        "working_memory": wm.to_dict(),
    }


@router.post("/answer")
def submit_answer(payload: DiagnosticAnswerRequest, db: Session = Depends(get_db)):
    db_session = db.query(DiagnosticSession).filter(DiagnosticSession.id == payload.session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    vehicle = None
    vehicle_context = None
    if db_session.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == db_session.vehicle_id).first()
        if vehicle:
            vehicle_context = vehicle.to_dict()

    wm = WorkingMemory.from_dict(json.loads(db_session.working_memory_json or "{}"))

    safety_alert, next_q, completed = diagnostic_engine.interview_manager.process_answer(
        working_memory=wm,
        fact_key=payload.fact_key,
        value=payload.value,
        provenance=payload.provenance,
        category=db_session.category,
        vehicle_context=vehicle_context,
    )

    report_id = None
    # If completed or safety alert, generate final DiagnosticReport
    if completed or safety_alert:
        rep_data = diagnostic_engine.generate_report(
            working_memory=wm,
            category=db_session.category,
            vehicle_id=db_session.vehicle_id,
            odometer=vehicle.odometer_km if vehicle else None,
            vehicle_context=vehicle_context,
        )

        db_report = DiagnosticReport(
            report_code=rep_data.report_code,
            session_id=db_session.id,
            vehicle_id=db_session.vehicle_id,
            odometer_at_diagnosis=rep_data.odometer_at_diagnosis,
            category=rep_data.category,
            conclusions_json=json.dumps(rep_data.conclusions),
            highest_severity=rep_data.highest_severity,
            safety_warning_triggered=rep_data.safety_warning_triggered,
            explanation_json=json.dumps(rep_data.explanation),
        )
        db.add(db_report)
        db_session.status = "safety_escalated" if safety_alert else "completed"
        db.commit()
        db.refresh(db_report)
        report_id = db_report.id

    db_session.working_memory_json = json.dumps(wm.to_dict())
    db.commit()

    return {
        "session_id": db_session.id,
        "status": db_session.status,
        "safety_alert": safety_alert,
        "next_question": next_q,
        "completed": completed,
        "report_id": report_id,
        "working_memory": wm.to_dict(),
    }


@router.post("/forward-chain")
def run_forward_chaining(payload: ForwardChainRawRequest, db: Session = Depends(get_db)):
    vehicle_context = payload.vehicle_context
    facts = payload.facts or {}

    if payload.session_id:
        db_session = db.query(DiagnosticSession).filter(DiagnosticSession.id == payload.session_id).first()
        if db_session:
            session_wm = json.loads(db_session.working_memory_json or "{}")
            for k, v in session_wm.items():
                if isinstance(v, dict):
                    facts[k] = v.get("value")
                else:
                    facts[k] = v
            if not vehicle_context and db_session.vehicle_id:
                veh = db.query(Vehicle).filter(Vehicle.id == db_session.vehicle_id).first()
                if veh:
                    vehicle_context = veh.to_dict()

    result = diagnostic_engine.run_forward_chaining(facts=facts, vehicle_context=vehicle_context)
    return result.model_dump()


@router.post("/backward-chain")
def run_backward_chaining(payload: BackwardChainRequest, db: Session = Depends(get_db)):
    vehicle_context = payload.vehicle_context
    facts = payload.facts or {}

    if payload.session_id:
        db_session = db.query(DiagnosticSession).filter(DiagnosticSession.id == payload.session_id).first()
        if db_session:
            session_wm = json.loads(db_session.working_memory_json or "{}")
            for k, v in session_wm.items():
                if isinstance(v, dict):
                    facts[k] = v.get("value")
                else:
                    facts[k] = v
            if not vehicle_context and db_session.vehicle_id:
                veh = db.query(Vehicle).filter(Vehicle.id == db_session.vehicle_id).first()
                if veh:
                    vehicle_context = veh.to_dict()

    tree = diagnostic_engine.run_backward_chaining(
        target_goal=payload.target_goal,
        facts=facts,
        vehicle_context=vehicle_context,
    )
    return tree.model_dump()


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(DiagnosticSession).filter(DiagnosticSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    wm = json.loads(db_session.working_memory_json or "{}")
    report = db.query(DiagnosticReport).filter(DiagnosticReport.session_id == session_id).first()

    return {
        "id": db_session.id,
        "vehicle_id": db_session.vehicle_id,
        "category": db_session.category,
        "mode": db_session.mode,
        "status": db_session.status,
        "working_memory": wm,
        "report": report.to_dict() if report else None,
        "created_at": db_session.created_at.isoformat() if db_session.created_at else None,
        "updated_at": db_session.updated_at.isoformat() if db_session.updated_at else None,
    }


@router.get("/{session_id}/explanation")
def get_session_explanation(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(DiagnosticSession).filter(DiagnosticSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    report = db.query(DiagnosticReport).filter(DiagnosticReport.session_id == session_id).first()
    if report and report.explanation_json:
        return json.loads(report.explanation_json)

    wm = WorkingMemory.from_dict(json.loads(db_session.working_memory_json or "{}"))
    res = diagnostic_engine.forward_engine.run(wm)
    return diagnostic_engine.explanation_engine.explain_forward_chaining(res, wm)
