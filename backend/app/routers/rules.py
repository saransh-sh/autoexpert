"""AutoExpert — Knowledge Base Rules API Router."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from autoexpert_engine.knowledge_base import KnowledgeBase

router = APIRouter(prefix="/api/rules", tags=["Knowledge Base"])
kb = KnowledgeBase()


@router.get("")
def list_rules(
    category: Optional[str] = Query(None, description="Filter by diagnostic category"),
    vehicle_type: Optional[str] = Query(None, description="Filter by motorcycle or car"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    search: Optional[str] = Query(None, description="Search term in rule name or ID"),
):
    results = kb.rules

    if category:
        results = [r for r in results if r.category.value == category]
    if vehicle_type:
        results = [
            r for r in results
            if "any" in r.vehicle_applicability.vehicle_types or vehicle_type in r.vehicle_applicability.vehicle_types
        ]
    if severity:
        results = [r for r in results if r.severity.value == severity]
    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in r.rule_id.lower() or s in r.name.lower() or s in r.explanation_template.lower()
        ]

    return {
        "total_matches": len(results),
        "total_kb_rules": kb.total_count(),
        "rules": [r.model_dump() for r in results],
    }


@router.get("/stats")
def get_rule_stats():
    return kb.stats()


@router.get("/{rule_id}")
def get_rule_detail(rule_id: str):
    rule = kb.get_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_id}' not found in knowledge base")
    return rule.model_dump()
