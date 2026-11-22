"""AutoExpert — ReportLab PDF Report Generator.

Compiles complete diagnostic reports into professionally styled PDF documents.
"""

from io import BytesIO
from typing import Any, Dict, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_diagnostic_pdf(report_data: Dict[str, Any], vehicle_data: Dict[str, Any] = None) -> bytes:
    """Generates a complete PDF diagnostic report and returns raw bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1E3A8A")  # Deep blue
    accent_color = colors.HexColor("#3B82F6")   # Bright blue
    dark_text = colors.HexColor("#0F172A")
    muted_text = colors.HexColor("#475569")
    danger_color = colors.HexColor("#DC2626")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=muted_text,
    )
    h2_style = ParagraphStyle(
        "Heading2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_text,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748B"),
    )

    elements = []

    # Header Title
    elements.append(Paragraph("AUTOEXPERT — VEHICLE DIAGNOSTIC REPORT", title_style))
    elements.append(Paragraph("Deterministic Symbolic Expert System Diagnostic Record", subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=2, color=accent_color, spaceAfter=12))

    # Meta Info Table
    v_info = "Vehicle Not Registered"
    if vehicle_data:
        v_info = f"{vehicle_data.get('year')} {vehicle_data.get('manufacturer')} {vehicle_data.get('model')} ({vehicle_data.get('vehicle_type', '').title()})"

    meta_table_data = [
        [
            Paragraph(f"<b>Report Code:</b> {report_data.get('report_code')}", body_style),
            Paragraph(f"<b>Date:</b> {report_data.get('created_at', 'N/A')[:19] if report_data.get('created_at') else 'Recent'}", body_style),
        ],
        [
            Paragraph(f"<b>Vehicle:</b> {v_info}", body_style),
            Paragraph(f"<b>Odometer:</b> {report_data.get('odometer_at_diagnosis') or (vehicle_data.get('odometer_km') if vehicle_data else 'N/A')} km", body_style),
        ],
        [
            Paragraph(f"<b>Diagnostic Category:</b> {report_data.get('category', '').replace('_', ' ').title()}", body_style),
            Paragraph(f"<b>Highest Severity:</b> <font color='{danger_color if report_data.get('highest_severity') == 'critical' else accent_color}'><b>{report_data.get('highest_severity', '').upper()}</b></font>", body_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # Safety Alert Banner if triggered
    if report_data.get("safety_warning_triggered"):
        alert_data = [
            [Paragraph("<b>CRITICAL SAFETY WARNING:</b> Immediate mechanical inspection required. Safety-critical faults were triggered during this diagnosis. Operating this vehicle without repair risks mechanical failure or severe collision.", ParagraphStyle("Alert", parent=body_style, textColor=colors.white))]
        ]
        alert_table = Table(alert_data, colWidths=[540])
        alert_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#991B1B")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#7F1D1D")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ]))
        elements.append(alert_table)
        elements.append(Spacer(1, 10))

    # Concluded Faults Section
    elements.append(Paragraph("1. Diagnostic Conclusions & Recommended Actions", h2_style))
    conclusions = report_data.get("conclusions", [])

    if not conclusions:
        elements.append(Paragraph("No specific diagnostic faults were derived from the reported symptoms.", body_style))
    else:
        for i, c in enumerate(conclusions, start=1):
            score = c.get("evidence_match_score", 100.0)
            fault_title = f"{i}. {c.get('title')} ({c.get('fault_id')})"
            sev = c.get("severity", "medium").upper()

            fault_table_data = [
                [
                    Paragraph(f"<b>{fault_title}</b>", ParagraphStyle("FT", parent=body_style, fontName="Helvetica-Bold", fontSize=10, textColor=primary_color)),
                    Paragraph(f"<b>Severity:</b> {sev} | <b>Evidence-Match Score:</b> {score}%", ParagraphStyle("FR", parent=body_style, alignment=2)),
                ],
                [
                    Paragraph(f"<b>Explanation:</b> {c.get('explanation', '')}", body_style),
                    "",
                ],
                [
                    Paragraph(f"<b>Recommended Action:</b> {c.get('recommended_action', '')}", body_style),
                    "",
                ],
            ]
            if c.get("preventive_maintenance"):
                fault_table_data.append([
                    Paragraph(f"<b>Preventative Maintenance:</b> {c.get('preventive_maintenance')}", body_style),
                    "",
                ])

            ft = Table(fault_table_data, colWidths=[380, 160])
            ft.setStyle(TableStyle([
                ("SPAN", (0, 1), (1, 1)),
                ("SPAN", (0, 2), (1, 2)),
                ("SPAN", (0, 3), (1, 3)) if len(fault_table_data) > 3 else ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(ft)
            elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 6))

    # Inference Trace Summary Section
    elements.append(Paragraph("2. Expert System Symbolic Reasoning Trace", h2_style))
    explanation = report_data.get("explanation", {})
    chains = explanation.get("inference_chain", [])

    if chains:
        trace_rows = [["Pass", "Rule ID", "Rule Name", "Premise Satisfied", "Outcome"]]
        for ch in chains:
            outcome = ch.get("conclusion") or (f"Derived: {', '.join(ch.get('derived_facts', []))}")
            trace_rows.append([
                str(ch.get("pass_number", 1)),
                ch.get("rule_id", ""),
                ch.get("rule_name", "")[:28],
                ch.get("premise", "")[:35],
                outcome[:30],
            ])

        trace_table = Table(trace_rows, colWidths=[35, 75, 130, 150, 150])
        trace_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("FONTSIZE", (0, 1), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(trace_table)
    else:
        elements.append(Paragraph("Direct diagnostic deduction with no intermediate chained passes.", body_style))

    elements.append(Spacer(1, 14))

    # Mandatory Legal / Academic Disclaimer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=8))
    elements.append(Paragraph(
        "<b>LEGAL & ACADEMIC DISCLAIMER:</b> AutoExpert is an educational knowledge-based expert system designed to demonstrate "
        "symbolic forward and backward chaining inference. Diagnostic conclusions and evidence-match scores represent preliminary "
        "possibilities deterministically derived from user-reported symptoms. AutoExpert is not a licensed mechanic or vehicle safety certification. "
        "Always seek physical inspection by a certified automotive technician before performing vehicle maintenance or repairs.",
        disclaimer_style,
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
