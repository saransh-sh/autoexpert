"""AutoExpert — Knowledge Base Loader and Validator.

Loads, validates, indexes, and queries rules from JSON knowledge base files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import jsonschema

from autoexpert_engine.schemas import Rule, RuleCategory, VehicleApplicability


class KnowledgeBase:
    """Manages rule loading, JSON Schema validation, and rule retrieval."""

    def __init__(self, kb_dir: Optional[Path | str] = None, schema_path: Optional[Path | str] = None):
        self.rules: List[Rule] = []
        self._rules_by_id: Dict[str, Rule] = {}
        self._rules_by_category: Dict[str, List[Rule]] = {}
        self._rules_by_conclusion_fault: Dict[str, List[Rule]] = {}
        self._rules_by_derived_fact: Dict[str, List[Rule]] = {}
        self._schema: Optional[Dict[str, Any]] = None

        default_base = Path(__file__).resolve().parent.parent / "knowledge_base"
        self.kb_dir = Path(kb_dir) if kb_dir else default_base
        self.schema_path = Path(schema_path) if schema_path else (self.kb_dir / "rule_schema.json")

        self.load_schema()
        self.load_rules()

    def load_schema(self) -> None:
        """Load and prepare JSON schema for rule validation."""
        if self.schema_path.exists():
            with open(self.schema_path, "r", encoding="utf-8") as f:
                self._schema = json.load(f)

    def validate_raw_rules(self, raw_rules: List[Dict[str, Any]]) -> None:
        """Validate list of raw rule dictionaries against rule_schema.json."""
        if self._schema:
            jsonschema.validate(instance=raw_rules, schema=self._schema)

    def load_rules(self) -> None:
        """Load and validate all rules from motorcycle, car, and maintenance rule files."""
        self.rules.clear()
        self._rules_by_id.clear()
        self._rules_by_category.clear()
        self._rules_by_conclusion_fault.clear()
        self._rules_by_derived_fact.clear()

        rule_files = [
            self.kb_dir / "motorcycle_rules.json",
            self.kb_dir / "car_rules.json",
            self.kb_dir / "maintenance_rules.json",
        ]

        all_raw_rules: List[Dict[str, Any]] = []

        for rf in rule_files:
            if rf.exists():
                with open(rf, "r", encoding="utf-8") as f:
                    file_rules = json.load(f)
                    if isinstance(file_rules, list):
                        all_raw_rules.extend(file_rules)

        if all_raw_rules:
            # Validate against schema
            self.validate_raw_rules(all_raw_rules)

            # Parse into Pydantic models
            for r_data in all_raw_rules:
                rule = Rule(**r_data)
                self.rules.append(rule)
                self._rules_by_id[rule.rule_id] = rule

                # Index by category
                cat_val = rule.category.value
                self._rules_by_category.setdefault(cat_val, []).append(rule)

                # Index by conclusion fault_id
                if rule.conclusion:
                    self._rules_by_conclusion_fault.setdefault(rule.conclusion.fault_id, []).append(rule)

                # Index by derived facts
                for df in rule.derived_facts:
                    self._rules_by_derived_fact.setdefault(df.fact, []).append(rule)

    def get_rule(self, rule_id: str) -> Optional[Rule]:
        return self._rules_by_id.get(rule_id)

    def get_rules_for_vehicle(self, vehicle: Dict[str, Any]) -> List[Rule]:
        """Return rules applicable to the given vehicle specification."""
        return [r for r in self.rules if r.vehicle_applicability.is_applicable(vehicle)]

    def get_rules_by_category(self, category: str, vehicle: Optional[Dict[str, Any]] = None) -> List[Rule]:
        rules = self._rules_by_category.get(category, [])
        if vehicle:
            return [r for r in rules if r.vehicle_applicability.is_applicable(vehicle)]
        return rules

    def get_rules_establishing_goal(self, goal: str, vehicle: Optional[Dict[str, Any]] = None) -> List[Rule]:
        """Find all candidate rules that can establish a target goal (as conclusion or derived fact)."""
        candidates: List[Rule] = []
        if goal in self._rules_by_conclusion_fault:
            candidates.extend(self._rules_by_conclusion_fault[goal])
        if goal in self._rules_by_derived_fact:
            candidates.extend(self._rules_by_derived_fact[goal])

        # Deduplicate while preserving order
        seen = set()
        unique_candidates = []
        for r in candidates:
            if r.rule_id not in seen:
                seen.add(r.rule_id)
                if not vehicle or r.vehicle_applicability.is_applicable(vehicle):
                    unique_candidates.append(r)
        return unique_candidates

    def total_count(self) -> int:
        return len(self.rules)

    def stats(self) -> Dict[str, Any]:
        """Return KB summary statistics."""
        categories = {}
        for cat, r_list in self._rules_by_category.items():
            categories[cat] = len(r_list)

        safety_critical_count = sum(1 for r in self.rules if r.safety_critical)

        return {
            "total_rules": len(self.rules),
            "by_category": categories,
            "safety_critical_rules": safety_critical_count,
            "files_loaded": [
                "motorcycle_rules.json",
                "car_rules.json",
                "maintenance_rules.json",
            ],
        }
