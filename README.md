# AutoExpert — Intelligent Vehicle Diagnosis & Mechanic Expert System

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-28%20Passed-success.svg)](#test-execution-results)
[![Architecture](https://img.shields.io/badge/Inference-Pure%20Symbolic%203VL-orange.svg)](#symbolic-expert-system-architecture)

AutoExpert is a **pure symbolic, rule-based expert system** that simulates the diagnostic reasoning of an experienced automotive and motorcycle technician. It runs locally as a full-stack web application with an accompanying Google Colab academic notebook, sharing a single installable Python inference package (`autoexpert_engine`) with zero duplicated algorithm code.

---

## Non-Negotiable Core Constraints Fulfilled

1. **Genuine Symbolic Expert System Only:** Zero LLM APIs, machine learning black boxes, or hardcoded diagnosis screens. Every diagnostic deduction is mathematically derived from validated JSON knowledge bases via forward and backward chaining inference.
2. **Single Shared Engine Package:** Built as `autoexpert_engine` and installable via `pyproject.toml` (`pip install -e .`). Both the FastAPI backend and Google Colab notebook import this exact package.
3. **Three-Valued Logic (3VL) Working Memory:** Facts track values (`TRUE`, `FALSE`, `UNKNOWN`), provenance (`initial_fact`, `symptom`, `observation`, `measurement`, `derived`), source rule ID, and pass number. `UNKNOWN` is never coerced to `FALSE`.
4. **Multi-Pass Forward Chaining:** Deductive inference iterates until a fixed point is reached, demonstrating multi-hop chained inference across intermediate derived facts.
5. **Recursive Backward Chaining:** Goal-driven hypothesis verification with call-stack cycle detection (`visited_goals`), missing observable fact identification, and automated question generation.
6. **5-Tier Deterministic Conflict Resolution:** Strict resolution hierarchy:
   $$\text{Refraction} \rightarrow \text{Safety Criticality} \rightarrow \text{Specificity} \rightarrow \text{Explicit Priority} \rightarrow \text{Lexicographical Rule ID}$$
7. **Safety-First Escalation:** Immediate halt and prominent warning banner upon detecting critical safety conditions (brake failure, low oil pressure, fuel leaks, severe overheating, tyre cord exposure).
8. **No Fabricated Specs or False Health:** Vehicle specifications require user/manual confirmation. The Vehicle Health Dashboard defaults strictly to **Not Assessed** unless validated by diagnostic evidence. Numeric scores are strictly labeled **Evidence-Match Scores**.

---

## Quick Start & Local Execution

### 1. Backend Server Setup & Launch
```bash
# Activate Python 3.11 virtual environment
.\.venv\Scripts\activate

# Install shared package in editable mode (if not already installed)
pip install -e .

# Launch FastAPI backend on http://127.0.0.1:8000
python backend/run.py
```
*Interactive Swagger API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

### 2. Frontend Web Dashboard Launch
```bash
cd frontend
npm run dev
```
*Frontend runs on [http://localhost:5173](http://localhost:5173)*

### 3. Running Test Suites
```bash
# Run all 28 engine unit tests and FastAPI integration tests
.\.venv\Scripts\pytest -v
```

---

## Knowledge Base Summary

The knowledge base contains **55 distinct, technically plausible, non-duplicative rules** validated against `knowledge_base/rule_schema.json`:

| File | Rules Count | Subsystems Covered | Multi-Hop Intermediate Chains |
| :--- | :--- | :--- | :--- |
| `motorcycle_rules.json` | 20 | Electrical, Engine, Transmission, Brakes, Cooling, Tyres | 3-Pass Stator Failure, Clutch Cable vs Plate Slip |
| `car_rules.json` | 20 | Cooling, Electrical, Brakes, Fuel, Suspension, Engine | Blown Head Gasket, Fuel Line Leak, Engine Mounts |
| `maintenance_rules.json` | 15 | Oil, Brake Fluid, Timing Belt, Coolant, Tyres | Timing Belt Valve Clash, Brake Vapour Lock |
| **Total Validated Rules** | **55** | **8 Categories (15 Safety Critical)** | **7 Dedicated Multi-Hop Pathways** |

### Predefined Academic Scenarios (`knowledge_base/demo_scenarios.json`)
AutoExpert ships with 10 ground-truth academic scenarios matching mechanical failure modes:
1. `SCENARIO_01_MOTO_BATTERY`: Motorcycle Weak Battery (Starting Failure)
2. `SCENARIO_02_CAR_OVERHEAT`: Car Overheating with Radiator Fan Inoperative
3. `SCENARIO_03_AIR_FILTER`: Restricted Air Intake Filter & Black Smoke
4. `SCENARIO_04_CLUTCH_SLIP`: Motorcycle Drivetrain Clutch Slippage (Multi-Hop)
5. `SCENARIO_05_WORN_BRAKES`: Severely Worn Brake Pads (Critical Safety Escalation)
6. `SCENARIO_06_CHARGING_STATOR`: Stator & Rectifier Charging Failure (Multi-Hop 3-Pass)
7. `SCENARIO_07_FUEL_FILTER_STALL`: Fuel Delivery Restriction & Clogged Fuel Filter
8. `SCENARIO_08_TYRE_MISALIGNMENT`: Highway Steering Shimmy & Wheel Misalignment
9. `SCENARIO_09_OIL_PRESSURE_LEAK`: Engine Oil Sump Leak & Red Oil Warning (Critical Safety)
10. `SCENARIO_10_ENGINE_MOUNTS`: Severe Idle Vibration from Torn Engine Mounts

---

## Google Colab Execution Instructions

The academic notebook is located at:
`notebooks/AutoExpert_Expert_System_Development.ipynb`

### To Run in Google Colab:
1. Upload or open `AutoExpert_Expert_System_Development.ipynb` in [Google Colab](https://colab.research.google.com).
2. The notebook includes a self-contained setup cell (Section 1) that installs `autoexpert_engine` via:
   ```python
   !git clone https://github.com/your-username/autoexpert.git
   %cd autoexpert
   !pip install -e .
   ```
3. Run all cells sequentially. The notebook covers all 10 required sections:
   - System introduction and mathematical foundations
   - Knowledge base validation (55 rules)
   - 3VL working memory inspection
   - Multi-pass forward chaining with multi-hop trace inspection
   - Recursive backward chaining with cycle prevention
   - Explanation facility ("Why" and "How" reasoning)
   - All 10 diagnostic scenarios execution (100% test-set parity)
   - Evaluation metrics table (runtime, passes, test-set accuracy)
   - Matplotlib charts of rule distribution and runtime
   - Academic conclusions and future work

---

## Test Execution Results

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\saransh\Desktop\autoexpert
configfile: pyproject.toml
collected 28 items

tests/test_api_integration.py::test_root_and_health PASSED               [  3%]
tests/test_api_integration.py::test_vehicle_crud_and_health_dashboard PASSED [  7%]
tests/test_api_integration.py::test_rules_endpoints PASSED               [ 10%]
tests/test_api_integration.py::test_diagnostic_interactive_session_flow_and_pdf PASSED [ 14%]
tests/test_api_integration.py::test_demo_scenarios_runner_endpoint PASSED [ 17%]
tests/test_api_integration.py::test_maintenance_and_settings PASSED      [ 21%]
tests/test_backward_chaining.py::test_backward_chaining_proven PASSED    [ 25%]
tests/test_backward_chaining.py::test_backward_chaining_inconclusive_missing_facts PASSED [ 28%]
tests/test_backward_chaining.py::test_backward_chaining_cycle_detection PASSED [ 32%]
tests/test_conflict_resolution.py::test_tier1_refraction PASSED          [ 35%]
tests/test_conflict_resolution.py::test_tier2_safety_criticality PASSED  [ 39%]
tests/test_conflict_resolution.py::test_tier3_specificity PASSED         [ 42%]
tests/test_conflict_resolution.py::test_tier4_priority PASSED            [ 46%]
tests/test_conflict_resolution.py::test_tier5_rule_id_tiebreaker PASSED  [ 50%]
tests/test_demo_scenarios.py::test_all_10_scenarios_pass PASSED          [ 53%]
tests/test_forward_chaining.py::test_multihop_chained_inference PASSED   [ 57%]
tests/test_forward_chaining.py::test_refraction_enforcement PASSED       [ 60%]
tests/test_knowledge_base.py::test_kb_load_and_validation PASSED         [ 64%]
tests/test_knowledge_base.py::test_rule_uniqueness PASSED                [ 67%]
tests/test_knowledge_base.py::test_vehicle_applicability PASSED          [ 71%]
tests/test_knowledge_base.py::test_rule_indexing PASSED                  [ 75%]
tests/test_safety_escalation.py::test_brake_failure_immediate_safety_escalation PASSED [ 78%]
tests/test_safety_escalation.py::test_oil_pressure_warning_safety_halt PASSED [ 82%]
tests/test_safety_escalation.py::test_fuel_leak_interview_process_answer_halt PASSED [ 85%]
tests/test_working_memory.py::test_working_memory_3vl_unknown_is_not_false PASSED [ 89%]
tests/test_working_memory.py::test_fact_assertion_and_provenance PASSED  [ 92%]
tests/test_working_memory.py::test_condition_operators PASSED            [ 96%]
tests/test_working_memory.py::test_serialization_roundtrip PASSED        [100%]

======================== 28 passed in 1.86s ========================
```

---

## Technical Documentation Directory

- [docs/system_architecture.md](docs/system_architecture.md): Architecture diagrams, module relationships, and SQLite schemas.
- [docs/expert_system_documentation.md](docs/expert_system_documentation.md): Formal inference algorithms, 3VL truth tables, and conflict resolution mathematical definitions.
- [docs/user_guide.md](docs/user_guide.md): Complete user walkthrough of all 9 web dashboard pages and report generation.

---

## Remaining Limitations & Notes

1. **Closed Ground Truth (55 Rules):** Mechanical faults not currently modeled in the 55 rules (e.g., complex CAN-bus electronic body control module wiring faults) return `INCONCLUSIVE`.
2. **Qualitative Sensor Checks:** Numeric thresholds compare against user-entered specifications or standard workshop ranges; universal manufacturer specifications are never fabricated.
3. **Educational / Preliminary Diagnosis Scope:** As clearly stated on the UI and PDF reports, AutoExpert is an educational system providing preliminary possibilities; critical repairs must always be verified by a certified mechanic.
