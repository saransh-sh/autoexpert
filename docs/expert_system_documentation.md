# AutoExpert — Expert System Formal Documentation

## 1. Theoretical Foundations & Symbolic Knowledge Engineering

AutoExpert is constructed strictly as a classical symbolic expert system. It rejects probabilistic heuristics, large language model (LLM) APIs, and hardcoded diagnosis screens in favor of deterministic, mathematically verifiable rule evaluation.

### Core Paradigms
- **Formal Knowledge Representation:** Production rules formulated as $Premise \rightarrow Conclusion \land DerivedFacts$.
- **Three-Valued Logic (3VL):** Truth values span $\{ \text{TRUE}, \text{FALSE}, \text{UNKNOWN} \}$.
- **Conflict Set Resolution:** Multi-tiered deterministic arbitration of competing production rules.
- **Cycle-Guarded Goal Proofs:** Depth-first recursive backward chaining with call-stack cycle detection.

---

## 2. Three-Valued Logic (3VL) Working Memory

In medical and mechanical diagnosis, assuming that an unobserved symptom is absent (Closed-World Assumption) introduces dangerous false negatives. AutoExpert implements strict Three-Valued Logic:

$$
\begin{array}{c|c c c}
\land & \text{T} & \text{F} & \text{U} \\
\hline
\text{T} & \text{T} & \text{F} & \text{U} \\
\text{F} & \text{F} & \text{F} & \text{F} \\
\text{U} & \text{U} & \text{F} & \text{U}
\end{array}
\quad
\begin{array}{c|c c c}
\lor & \text{T} & \text{F} & \text{U} \\
\hline
\text{T} & \text{T} & \text{T} & \text{T} \\
\text{F} & \text{T} & \text{F} & \text{U} \\
\text{U} & \text{T} & \text{U} & \text{U}
\end{array}
\quad
\begin{array}{c|c}
\neg & \\
\hline
\text{T} & \text{F} \\
\text{F} & \text{T} \\
\text{U} & \text{U}
\end{array}
$$

### Fact Provenance Tracking
Every asserted fact in `WorkingMemory` retains an immutable provenance metadata tag:
- `initial_fact`: Given prior to the interview.
- `symptom`: Reported by user as an initial concern.
- `observation`: Qualitative visual/auditory check (e.g., clicking noise, dim lights).
- `measurement`: Quantified physical reading (e.g., multimeter voltage, brake pad mm).
- `derived`: Inferred by the engine through rule firing.

---

## 3. Multi-Pass Forward Chaining Algorithm

Forward chaining operates as a data-driven, deductive inference engine:

```
Algorithm MultiPassForwardChaining(WM, Rules, Vehicle):
    RefractionSet ← ∅
    PassNumber ← 1
    
    Loop:
        ConflictSet ← ∅
        For Rule in FilterApplicable(Rules, Vehicle):
            If Rule.ID ∉ RefractionSet:
                If EvaluatePremise(WM, Rule.Conditions) == TRUE:
                    ConflictSet ← ConflictSet ∪ { Rule }
                    
        If ConflictSet is Empty:
            Return "Fixed Point Reached"
            
        WinningRule, Log ← ConflictResolver.Resolve(ConflictSet, PassNumber)
        RefractionSet ← RefractionSet ∪ { WinningRule.ID }
        
        For DerivedFact in WinningRule.DerivedFacts:
            WM.AssertFact(DerivedFact.Key, DerivedFact.Value, provenance=DERIVED)
            
        If WinningRule.Conclusion is not Null:
            RecordConclusion(WinningRule.Conclusion)
            
        PassNumber ← PassNumber + 1
```

---

## 4. 5-Tier Conflict Resolution Strategy

When multiple rules are eligible in a pass, AutoExpert deterministically resolves competition in strict order:

1. **Tier 1 — Refraction:** Fired rule instances are excluded to prevent infinite looping on identical facts.
2. **Tier 2 — Safety Criticality:** Rules marked `safety_critical: true` always fire before routine maintenance rules.
3. **Tier 3 — Specificity:** Rules with more preconditions (greater symptom specificity) take precedence over general rules:
   $$\text{Specificity}(R) = |\text{Conditions}(R)|$$
4. **Tier 4 — Explicit Priority:** High-priority domain rules ($0 \le P \le 100$) fire before lower priority rules.
5. **Tier 5 — Lexicographical Rule ID:** Alphabetical ordering on `rule_id` guarantees 100% deterministic tiebreaking across all runs and platforms.

---

## 5. Goal-Driven Recursive Backward Chaining & Cycle Detection

Backward chaining recursively evaluates whether a target hypothesis is supported by evidence:

```
Algorithm ProveGoal(Goal, WM, VisitedGoals):
    If Goal ∈ VisitedGoals:
        RecordCyclePrevented(Goal)
        Return INCONCLUSIVE_MISSING_FACTS
        
    If WM.Contains(Goal):
        Return (WM.Get(Goal) == TRUE) ? PROVEN : DISPROVEN
        
    VisitedGoals ← VisitedGoals ∪ { Goal }
    Candidates ← FindRulesProducing(Goal)
    
    If Candidates is Empty:
        MarkMissingObservable(Goal)
        VisitedGoals ← VisitedGoals \ { Goal }
        Return INCONCLUSIVE_MISSING_FACTS
        
    For Rule in Candidates:
        RuleStatus ← PROVEN
        For Condition in Rule.Conditions:
            SubStatus ← ProveGoal(Condition.Fact, WM, VisitedGoals)
            If SubStatus != PROVEN:
                RuleStatus ← SubStatus
                Break
        If RuleStatus == PROVEN:
            VisitedGoals ← VisitedGoals \ { Goal }
            Return PROVEN
            
    VisitedGoals ← VisitedGoals \ { Goal }
    Return (AnyInconclusive) ? INCONCLUSIVE_MISSING_FACTS : DISPROVEN
```

---

## 6. Multi-Hop Chaining Demonstrations

### Multi-Hop Chain: Motorcycle Stator / Rectifier Failure
1. **Pass 1 (`MOTO_ELEC_001`):** `engine_starts == False` $\land$ `starter_clicks == True` $\land$ `headlights_dim == True`  
   $\rightarrow$ Concludes: `FAULT_WEAK_BATTERY`  
   $\rightarrow$ Asserts Derived Fact: `power_supply_insufficient = True`
2. **Pass 2 (`MOTO_ELEC_002`):** `power_supply_insufficient == True` $\land$ `battery_recharged_recently == True`  
   $\rightarrow$ Asserts Derived Fact: `charging_system_suspect = True`
3. **Pass 3 (`MOTO_ELEC_003`):** `charging_system_suspect == True` $\land$ `stator_ac_voltage_low == True`  
   $\rightarrow$ Concludes Final Fault: `FAULT_STATOR_REGULATOR_FAILURE`

### Multi-Hop Chain: Car Blown Cylinder Head Gasket
1. **Pass 1 (`CAR_COOL_001`):** `engine_overheating == True` $\land$ `coolant_level_low == True`  
   $\rightarrow$ Asserts Derived Fact: `coolant_loss_detected = True`
2. **Pass 2 (`CAR_COOL_003`):** `coolant_loss_detected == True` $\land$ `white_exhaust_smoke == True` $\land$ `oil_milky_color == True`  
   $\rightarrow$ Asserts Derived Fact: `engine_temperature_critical = True` (Safety Critical)  
   $\rightarrow$ Concludes Final Fault: `FAULT_BLOWN_HEAD_GASKET` (Critical Severity)
