"""AutoExpert — Explanation Engine.

Generates human-readable "Why" and "How" reasoning explanations,
traces derivation sequences, and formats diagnostic summaries with
actionable repair recommendations and safety disclaimers.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from autoexpert_engine.schemas import ForwardChainingResult, ProofTree
from autoexpert_engine.working_memory import WorkingMemory


class ExplanationEngine:
    """Provides transparent introspection into symbolic inference processes."""

    @staticmethod
    def explain_forward_chaining(
        result: ForwardChainingResult,
        working_memory: WorkingMemory,
    ) -> Dict[str, Any]:
        """Synthesizes a comprehensive structured explanation of a forward chaining run."""
        facts_summary = []
        for key, fact in working_memory.all_facts().items():
            facts_summary.append({
                "key": key,
                "value": fact.value,
                "provenance": fact.provenance.value,
                "source_rule_id": fact.source_rule_id,
                "pass_number": fact.pass_number,
            })

        # Multi-hop derivation chains
        chains = []
        for step in result.execution_steps:
            condition_texts = [
                f"{c['fact']} {c['operator']} {c['expected']}" for c in step.satisfied_conditions
            ]
            derived_names = [d["fact"] for d in step.derived_facts_added]
            conclusion_text = step.conclusion_reached["title"] if step.conclusion_reached else None

            chains.append({
                "pass_number": step.pass_number,
                "rule_id": step.rule_id,
                "rule_name": step.rule_name,
                "premise": " AND ".join(condition_texts),
                "derived_facts": derived_names,
                "conclusion": conclusion_text,
                "rationale": step.explanation,
            })

        # How explanations for each conclusion
        how_explanations = []
        for conc in result.conclusions:
            rule_id = conc["rule_id"]
            matched_step = next((s for s in result.execution_steps if s.rule_id == rule_id), None)
            if matched_step:
                cond_bullets = [
                    f"- Fact '{c['fact']}' was verified as {c['actual']} (required {c['operator']} {c['expected']})"
                    for c in matched_step.satisfied_conditions
                ]
                explanation_str = (
                    f"Fault '{conc['title']}' was concluded in Pass {matched_step.pass_number} by rule '{matched_step.rule_name}' ({rule_id}).\n"
                    f"Satisfied conditions:\n" + "\n".join(cond_bullets) + "\n"
                    f"Diagnostic deduction: {matched_step.explanation}"
                )
                how_explanations.append({
                    "fault_id": conc["fault_id"],
                    "title": conc["title"],
                    "rule_id": rule_id,
                    "explanation": explanation_str,
                    "recommended_action": conc["recommended_action"],
                    "severity": conc["severity"],
                    "safety_critical": conc["safety_critical"],
                })

        return {
            "total_rules_triggered": len(result.triggered_rules),
            "triggered_rule_ids": result.triggered_rules,
            "runtime_ms": result.runtime_ms,
            "total_passes": result.total_passes,
            "initial_and_derived_facts": facts_summary,
            "inference_chain": chains,
            "conflict_resolutions": [log.model_dump() for log in result.conflict_log],
            "how_explanations": how_explanations,
            "safety_escalation": any(c.get("safety_critical") for c in result.conclusions),
            "disclaimer": (
                "DISCLAIMER: AutoExpert is an educational expert system. Diagnostic conclusions are "
                "preliminary possibilities derived from reported symptoms and expert rules. Always "
                "confirm diagnoses with a qualified professional mechanic before performing major repairs."
            ),
        }

    @staticmethod
    def explain_backward_proof(proof_tree: ProofTree) -> Dict[str, Any]:
        """Provides human-readable summary of a backward chaining proof."""
        return {
            "target_goal": proof_tree.target_goal,
            "proof_status": proof_tree.status.value,
            "missing_facts": proof_tree.missing_facts,
            "suggested_questions": proof_tree.suggested_questions,
            "cycles_prevented": proof_tree.cycles_prevented,
            "root_details": [node.details for node in proof_tree.root_nodes],
        }
