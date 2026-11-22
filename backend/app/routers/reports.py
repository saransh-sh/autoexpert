"""AutoExpert — Diagnostic Reports & PDF API Router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.db_models import DiagnosticReport, Vehicle
from backend.app.services.pdf_report import generate_diagnostic_pdf

router = APIRouter(prefix="/api/reports", tags=["Diagnostic Reports"])


@router.get("")
def list_reports(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(DiagnosticReport)
    if vehicle_id:
        query = query.filter(DiagnosticReport.vehicle_id == vehicle_id)
    if category:
        query = query.filter(DiagnosticReport.category == category)
    if severity:
        query = query.filter(DiagnosticReport.highest_severity == severity)

    reports = query.order_by(DiagnosticReport.created_at.desc()).limit(limit).all()
    return [r.to_dict() for r in reports]


@router.get("/compare")
def compare_reports(
    report_a: int = Query(..., description="First report ID"),
    report_b: int = Query(..., description="Second report ID"),
    db: Session = Depends(get_db),
):
    ra = db.query(DiagnosticReport).filter(DiagnosticReport.id == report_a).first()
    rb = db.query(DiagnosticReport).filter(DiagnosticReport.id == report_b).first()

    if not ra or not rb:
        raise HTTPException(status_code=404, detail="One or both reports not found")

    dict_a = ra.to_dict()
    dict_b = rb.to_dict()

    faults_a = {c["fault_id"] for c in dict_a["conclusions"]}
    faults_b = {c["fault_id"] for c in dict_b["conclusions"]}

    return {
        "report_a": dict_a,
        "report_b": dict_b,
        "comparison": {
            "common_faults": list(faults_a.intersection(faults_b)),
            "resolved_or_absent_in_b": list(faults_a - faults_b),
            "new_faults_in_b": list(faults_b - faults_a),
            "odometer_delta_km": (
                (dict_b["odometer_at_diagnosis"] or 0) - (dict_a["odometer_at_diagnosis"] or 0)
            ),
            "severity_change": f"{dict_a['highest_severity']} -> {dict_b['highest_severity']}",
        },
    }


@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(DiagnosticReport).filter(DiagnosticReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Diagnostic report not found")
    return report.to_dict()


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db)):
    report = db.query(DiagnosticReport).filter(DiagnosticReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Diagnostic report not found")

    vehicle_data = None
    if report.vehicle_id:
        veh = db.query(Vehicle).filter(Vehicle.id == report.vehicle_id).first()
        if veh:
            vehicle_data = veh.to_dict()

    pdf_bytes = generate_diagnostic_pdf(report.to_dict(), vehicle_data=vehicle_data)

    filename = f"AutoExpert_Report_{report.report_code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
