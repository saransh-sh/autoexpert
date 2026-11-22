"""AutoExpert — 5-Tier Deterministic Conflict Resolution.

Resolves competing eligible rules in strict priority order:
1. Refraction: Already fired rules are excluded.
2. Safety Criticality: safety_critical == True takes precedence.
3. Specificity: More conditions (preconditions count) take precedence.
4. Explicit Priority: Higher numeric priority (0-100) takes precedence.
5. Rule ID: Lexicographical order on rule_id as the final deterministic tiebreaker.
"""

from __future__ import annotations

from typing import List, Optional, Set, Tuple
from autoexpert_engine.schemas import ConflictResolutionLog, ConflictSetEntry, Rule


class ConflictResolver:
    """Deterministic 5-tier conflict resolution engine."""

    def __init__(self):
        self.fired_rule_ids: Set[str] = set()

    def reset_refraction(self) -> None:
        self.fired_rule_ids.clear()

    def record_fired(self, rule_id: str) -> None:
        self.fired_rule_ids.add(rule_id)

    def is_refracted(self, rule_id: str) -> bool:
        return rule_id in self.fired_rule_ids

    def resolve(
        self,
        candidate_rules: List[Rule],
        pass_number: int,
    ) -> Tuple[Optional[Rule], Optional[ConflictResolutionLog]]:
        """Selects the single winning rule from the conflict set according to the 5 tiers.

        Returns:
            (winning_rule, conflict_resolution_log)
        """
        # Tier 1: Refraction filter
        eligible_rules = [r for r in candidate_rules if not self.is_refracted(r.rule_id)]

        if not eligible_rules:
            return None, None

        if len(eligible_rules) == 1:
            winner = eligible_rules[0]
            log = ConflictResolutionLog(
                pass_number=pass_number,
                competing_rules=[
                    ConflictSetEntry(
                        rule_id=winner.rule_id,
                        rule_name=winner.name,
                        safety_critical=winner.safety_critical,
                        specificity=winner.specificity,
                        priority=winner.priority,
                    )
                ],
                chosen_rule_id=winner.rule_id,
                rationale=f"Sole eligible candidate after refraction in pass {pass_number}.",
            )
            return winner, log

        # Multiple eligible candidates: build conflict set entries
        conflict_set_entries = [
            ConflictSetEntry(
                rule_id=r.rule_id,
                rule_name=r.name,
                safety_critical=r.safety_critical,
                specificity=r.specificity,
                priority=r.priority,
            )
            for r in eligible_rules
        ]

        # Sorting key for 5-tier resolution (highest first):
        # - Safety Criticality (True > False, i.e., 1 > 0)
        # - Specificity (higher len(conditions) > lower)
        # - Explicit Priority (higher priority > lower)
        # - Lexicographical Rule ID (for ascending alphabetical, we invert or sort carefully)
        
        # Sort using Python's sort with custom tuple:
        def sort_key(rule: Rule):
            return (
                1 if rule.safety_critical else 0,
                rule.specificity,
                rule.priority,
                # For ascending rule_id, we can compare rule.rule_id in second pass or use a custom comparator
            )

        # First sort by rule_id ascending (to guarantee tiebreaker order)
        sorted_by_id = sorted(eligible_rules, key=lambda r: r.rule_id)
        # Then stable sort descending by priority, specificity, safety_critical
        winning_candidates = sorted(
            sorted_by_id,
            key=lambda r: (1 if r.safety_critical else 0, r.specificity, r.priority),
            reverse=True,
        )

        winner = winning_candidates[0]

        # Determine rationale for log
        reasons = []
        runner_up = winning_candidates[1]

        if winner.safety_critical and not runner_up.safety_critical:
            reasons.append("Safety-Criticality Precedence (Tier 2)")
        elif winner.specificity > runner_up.specificity:
            reasons.append(f"Higher Specificity (Tier 3: {winner.specificity} conditions vs {runner_up.specificity})")
        elif winner.priority > runner_up.priority:
            reasons.append(f"Higher Explicit Priority (Tier 4: {winner.priority} vs {runner_up.priority})")
        else:
            reasons.append(f"Deterministic Rule ID Tiebreaker (Tier 5: '{winner.rule_id}' precedes '{runner_up.rule_id}')")

        rationale = f"Selected '{winner.rule_id}' over {len(eligible_rules) - 1} competing rule(s) via: " + "; ".join(reasons)

        log = ConflictResolutionLog(
            pass_number=pass_number,
            competing_rules=conflict_set_entries,
            chosen_rule_id=winner.rule_id,
            rationale=rationale,
        )

        return winner, log
