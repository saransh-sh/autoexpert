"""AutoExpert — Three-Valued Logic (3VL) Working Memory.

Manages active facts, truth values (TRUE, FALSE, UNKNOWN), fact provenance,
source rules, mutation history, and condition evaluation.
"""

from __future__ import annotations

import copy
import time
from typing import Any, Dict, List, Optional, Tuple, Union
from autoexpert_engine.schemas import Condition, Fact, FactProvenance


class WorkingMemory:
    """Three-Valued Logic Working Memory for AutoExpert.

    Tracks:
    - Facts: canonical key -> Fact object (value: bool | float | str | "UNKNOWN")
    - Provenance: initial_fact, symptom, observation, measurement, derived
    - Source rule ID: None for user facts, rule_id for derived facts
    - Mutation history: chronological log of assertions, modifications, and pass numbers
    """

    def __init__(self, initial_facts: Optional[Dict[str, Any]] = None):
        self._facts: Dict[str, Fact] = {}
        self._mutation_history: List[Dict[str, Any]] = []
        self._current_pass: int = 0

        if initial_facts:
            for key, val in initial_facts.items():
                self.assert_fact(
                    key=key,
                    value=val,
                    provenance=FactProvenance.INITIAL_FACT,
                    source_rule_id=None,
                    pass_number=0,
                )

    def set_pass_number(self, pass_num: int) -> None:
        self._current_pass = pass_num

    def assert_fact(
        self,
        key: str,
        value: Any,
        provenance: Union[FactProvenance, str] = FactProvenance.DERIVED,
        source_rule_id: Optional[str] = None,
        pass_number: Optional[int] = None,
    ) -> bool:
        """Assert or update a fact in working memory.

        Returns True if the fact was newly asserted or its value changed, False if identical.
        """
        if isinstance(provenance, str):
            try:
                provenance = FactProvenance(provenance)
            except ValueError:
                provenance = FactProvenance.INITIAL_FACT

        pass_num = self._current_pass if pass_number is None else pass_number
        now = time.time()

        if key in self._facts:
            existing = self._facts[key]
            if existing.value == value and existing.is_unknown() == (value == "UNKNOWN"):
                return False  # No change
            
            # Value mutated
            old_value = existing.value
            existing.value = value
            existing.provenance = provenance
            existing.source_rule_id = source_rule_id
            existing.pass_number = pass_num
            existing.timestamp = now

            self._mutation_history.append({
                "type": "UPDATE",
                "key": key,
                "old_value": old_value,
                "new_value": value,
                "provenance": provenance.value,
                "source_rule_id": source_rule_id,
                "pass_number": pass_num,
                "timestamp": now,
            })
            return True

        # New fact
        fact_obj = Fact(
            key=key,
            value=value,
            provenance=provenance,
            source_rule_id=source_rule_id,
            pass_number=pass_num,
            timestamp=now,
        )
        self._facts[key] = fact_obj
        self._mutation_history.append({
            "type": "ASSERT",
            "key": key,
            "value": value,
            "provenance": provenance.value,
            "source_rule_id": source_rule_id,
            "pass_number": pass_num,
            "timestamp": now,
        })
        return True

    def get_fact(self, key: str) -> Optional[Fact]:
        return self._facts.get(key)

    def get_value(self, key: str, default: Any = "UNKNOWN") -> Any:
        fact = self._facts.get(key)
        if fact is None:
            return default
        return fact.value

    def has_fact(self, key: str) -> bool:
        return key in self._facts

    def is_known(self, key: str) -> bool:
        fact = self._facts.get(key)
        if fact is None:
            return False
        return not fact.is_unknown()

    def is_true(self, key: str) -> bool:
        fact = self._facts.get(key)
        return fact is not None and fact.value is True

    def is_false(self, key: str) -> bool:
        fact = self._facts.get(key)
        return fact is not None and fact.value is False

    def is_unknown(self, key: str) -> bool:
        fact = self._facts.get(key)
        return fact is None or fact.is_unknown()

    def evaluate_condition(self, condition: Condition) -> Tuple[bool, str]:
        """Evaluate a condition under 3-Valued Logic.

        Returns:
            (satisfied: bool, reason: str)
        Never coerces UNKNOWN to False in a way that falsifies negative logic.
        """
        key = condition.fact
        op = condition.operator
        expected = condition.value

        fact = self._facts.get(key)
        if fact is None or fact.is_unknown():
            return False, f"Fact '{key}' is UNKNOWN or missing"

        actual = fact.value

        try:
            if op == "==":
                sat = (actual == expected)
                return sat, f"'{key}' ({actual}) == {expected} -> {sat}"
            elif op == "!=":
                sat = (actual != expected)
                return sat, f"'{key}' ({actual}) != {expected} -> {sat}"
            elif op == "<":
                sat = (float(actual) < float(expected))
                return sat, f"'{key}' ({actual}) < {expected} -> {sat}"
            elif op == "<=":
                sat = (float(actual) <= float(expected))
                return sat, f"'{key}' ({actual}) <= {expected} -> {sat}"
            elif op == ">":
                sat = (float(actual) > float(expected))
                return sat, f"'{key}' ({actual}) > {expected} -> {sat}"
            elif op == ">=":
                sat = (float(actual) >= float(expected))
                return sat, f"'{key}' ({actual}) >= {expected} -> {sat}"
            elif op == "in":
                sat = (actual in expected)
                return sat, f"'{key}' ({actual}) in {expected} -> {sat}"
            elif op == "not_in":
                sat = (actual not in expected)
                return sat, f"'{key}' ({actual}) not in {expected} -> {sat}"
            else:
                return False, f"Unsupported operator '{op}'"
        except (ValueError, TypeError) as e:
            return False, f"Comparison error on '{key}' ({actual} {op} {expected}): {str(e)}"

    def evaluate_all_conditions(self, conditions: List[Condition]) -> Tuple[bool, List[Dict[str, Any]]]:
        """Evaluates all conditions. Returns (all_satisfied, list_of_eval_details)."""
        details = []
        all_sat = True
        for cond in conditions:
            sat, reason = self.evaluate_condition(cond)
            details.append({
                "fact": cond.fact,
                "operator": cond.operator,
                "expected": cond.value,
                "actual": self.get_value(cond.fact, "UNKNOWN"),
                "satisfied": sat,
                "reason": reason,
            })
            if not sat:
                all_sat = False
        return all_sat, details

    def all_facts(self) -> Dict[str, Fact]:
        return dict(self._facts)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize working memory for JSON export or persistence."""
        return {
            key: {
                "key": f.key,
                "value": f.value,
                "provenance": f.provenance.value,
                "source_rule_id": f.source_rule_id,
                "pass_number": f.pass_number,
                "timestamp": f.timestamp,
            }
            for key, f in self._facts.items()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> WorkingMemory:
        wm = cls()
        for key, f_data in data.items():
            if isinstance(f_data, dict):
                wm.assert_fact(
                    key=f_data.get("key", key),
                    value=f_data.get("value"),
                    provenance=f_data.get("provenance", FactProvenance.INITIAL_FACT),
                    source_rule_id=f_data.get("source_rule_id"),
                    pass_number=f_data.get("pass_number", 0),
                )
            else:
                wm.assert_fact(key=key, value=f_data)
        return wm

    def get_mutation_history(self) -> List[Dict[str, Any]]:
        return list(self._mutation_history)

    def clone(self) -> WorkingMemory:
        cloned = WorkingMemory()
        cloned._facts = {k: copy.deepcopy(v) for k, v in self._facts.items()}
        cloned._mutation_history = copy.deepcopy(self._mutation_history)
        cloned._current_pass = self._current_pass
        return cloned
