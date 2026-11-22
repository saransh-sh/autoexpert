# AutoExpert — Product Requirements Document (PRD)

**Product Name:** AutoExpert — Intelligent Vehicle Diagnosis & Mechanic Expert System  
**Project Type:** Rule-Based / Knowledge-Based Expert System (Local Web Application + Google Colab Academic Notebook)  
**Academic Domain:** Expert Systems  
**Core Constraint:** Strictly a traditional symbolic expert system—no LLMs, no external AI APIs, no machine learning black boxes, and no hardcoded diagnosis screens. Every conclusion must be deterministically traceable to the JSON knowledge base and inference algorithms.

---

## 1. Executive Summary & Architectural Refinements

AutoExpert simulates the diagnostic reasoning of an experienced mechanic for both **motorcycles and cars**. Users register vehicles, report symptoms through an adaptive interview, and receive transparent, rule-backed diagnostic conclusions, severity ratings, reasoning traces, and recommended actions. The system runs completely locally without requiring a live Google Colab runtime, while sharing a single reusable Python inference package (`autoexpert_engine`) between the web backend and the Colab evaluation notebook.

### Key Engineering Refinements
To eliminate ambiguities and ensure viva-ready academic rigor, this PRD locks in the following architectural decisions:

1. **Backend Framework Selection — FastAPI:** Selected over Flask for automatic Pydantic v2 request/response validation, native OpenAPI/Swagger interactive documentation (ideal for live API demos), strict typing for rule/fact schemas, and clean dependency injection.
2. **Installable Shared Engine Package:** `autoexpert_engine` will be packaged via `pyproject.toml` (editable local install `pip install -e .`) so the FastAPI backend, Pytest suite, and Google Colab notebook import identical engine code with zero duplication.
3. **Three-Valued Logic (3VL) in Working Memory:** Every fact explicitly carries a state (`TRUE`, `FALSE`, `UNKNOWN`, or a typed numeric/categorical value) and provenance metadata (`initial_fact`, `symptom`, `observation`, `measurement`, `derived`). `UNKNOWN` is never coerced to `FALSE`.
4. **Deterministic Conflict Resolution Pipeline:** When multiple rules are eligible in the conflict set, selection follows a strict, logged 5-tier hierarchy:
   - **(1) Refraction** (no rule fires twice on identical fact bindings)
   - **(2) Safety Criticality** (`safety_critical == true` always wins)
   - **(3) Specificity** (highest number of conditions)
   - **(4) Explicit Rule Priority** (numeric priority value)
   - **(5) Lexicographical Rule ID** (deterministic tie-breaker)
5. **Safety-First Interrupt Loop:** Before selecting the next interview question on every turn, the engine evaluates safety-critical rules (brakes, steering, fuel leaks, severe overheating, oil-pressure warnings, tyre damage). Any triggered safety condition immediately surfaces a high-priority stop/inspection warning that takes precedence over continuing the questionnaire.
6. **Evidence-Match Score Formula:** Calculated transparently as `satisfied_conditions / total_conditions` adjusted for multi-hop derived support, and strictly labeled as an **Evidence-Match Score** (never statistical confidence or confirmed diagnosis).
7. **Pure-Python PDF Generation:** Uses **ReportLab** to generate downloadable diagnostic reports locally without OS-level headless browser or Cairo/Pango installation dependencies.

---

## 2. Target Users & Use Cases

| Persona | Primary Goal | Key Interactions |
| :--- | :--- | :--- |
| **Vehicle Owner / Rider** | Identify potential faults in a motorcycle or car, track maintenance, and understand urgency. | Manage vehicle profiles, run guided diagnostic interviews, view health dashboard, export PDF reports, track service reminders. |
| **Academic Evaluator / Instructor** | Verify genuine expert-system architecture during demonstration and viva. | Inspect the Expert System Monitor, step through forward/backward chaining traces, run the 10 predefined Academic Demo scenarios, and review the Colab notebook. |
| **Developer / Researcher** | Test, benchmark, and extend the rule base and inference engine. | Run the Google Colab notebook, inspect rule activation charts, add/validate JSON rules, and execute automated test suites. |

---

## 3. Complete Technology Stack

| Layer | Technology | Purpose & Justification |
| :--- | :--- | :--- |
| **Frontend Core** | **React 18 + Vite** | Fast SPA development and optimized local production builds. |
| **Styling & UI** | **Tailwind CSS** | Dark navy/charcoal theme with subtle blue accents, responsive cards, and clean typography. |
| **Icons & Charts** | **Lucide React, Recharts** | Automotive-inspired iconography and interactive charts for health overview, rule firing stats, and report trends. |
| **Routing & HTTP** | **React Router v6**, Axios/Fetch | 9-view dashboard navigation and typed REST API communication. |
| **Backend API** | **Python 3.11+, FastAPI, Uvicorn** | High-performance REST API with Pydantic v2 validation and auto-generated `/docs` OpenAPI spec. |
| **Database & ORM** | **SQLite + SQLAlchemy 2.0** | Zero-config local persistence for vehicles, sessions, reports, maintenance, and user settings. |
| **PDF Export** | **ReportLab** | Pure-Python generation of structured diagnostic PDF reports. |
| **Expert System Engine** | **Custom `autoexpert_engine` (Python)** | Pure-Python modular package implementing KB loader, working memory, forward/backward chaining, conflict resolution, and explanation facility. |
| **Knowledge Base** | **JSON + JSON Schema** | Human-readable, version-controlled rule files validated on startup against a strict schema. |
| **Academic Environment** | **Google Colab (`.ipynb`), Pandas, Matplotlib** | End-to-end demonstration, 10-scenario evaluation, test-set metrics, and visualizations importing `autoexpert_engine`. |
| **Testing** | **Pytest, HTTPX (TestClient), Vitest** | Unit tests for inference logic, API integration tests, and parity verification between backend and Colab. |

---

## 4. Refined System Architecture & Directory Structure

```text
AutoExpert/
├── pyproject.toml                       # Makes autoexpert_engine installable locally & in Colab
├── autoexpert_engine/                   # Shared, UI-independent expert system package
│   ├── __init__.py
│   ├── schemas.py                       # Dataclasses/Pydantic models for Rules, Facts, Traces
│   ├── knowledge_base.py                # JSON loader, schema validator, vehicle applicability filter
│   ├── working_memory.py                # 3VL fact store with provenance & mutation history
│   ├── conflict_resolution.py           # Refraction, safety, specificity, priority resolver
│   ├── forward_chaining.py              # Iterative fixed-point engine with execution log
│   ├── backward_chaining.py             # Goal-driven recursive prover with cycle detection
│   ├── explanation_engine.py            # "How" & "Why" natural-language + structured trace builder
│   ├── interview_manager.py             # Next-best-question selector & safety-interrupt checker
│   └── diagnostic_engine.py             # Facade orchestrating sessions, scoring, & demo scenarios
├── knowledge_base/
│   ├── rule_schema.json                 # JSON Schema for automated rule validation
│   ├── motorcycle_rules.json            # Motorcycle-specific & air/liquid-cooled rules
│   ├── car_rules.json                   # Car-specific & shared automotive rules
│   ├── maintenance_rules.json           # Odometer/date-based maintenance rules
│   └── demo_scenarios.json              # 10+ predefined academic evaluation scenarios
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI app entrypoint, CORS, startup KB load
│   │   ├── database.py                  # SQLite + SQLAlchemy engine/session setup
│   │   ├── models/                      # SQLAlchemy ORM models
│   │   ├── schemas/                     # FastAPI Pydantic request/response DTOs
│   │   ├── routes/                      # Modular API routers
│   │   └── services/                    # PDF generator, health aggregator, session manager
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   └── src/
│       ├── components/                  # Reusable UI, safety banners, trace viewers
│       ├── pages/                       # 9 main views (Overview through Settings)
│       ├── layouts/                     # Dark automotive sidebar + topbar shell
│       ├── services/                    # Typed API client
│       └── assets/
├── notebooks/
│   └── AutoExpert_Expert_System_Development.ipynb
├── tests/
│   ├── test_knowledge_base.py
│   ├── test_working_memory.py
│   ├── test_forward_chaining.py
│   ├── test_backward_chaining.py
│   ├── test_conflict_resolution.py
│   ├── test_safety_escalation.py
│   ├── test_api_integration.py
│   └── test_demo_scenarios.py
├── docs/
│   ├── system_architecture.md
│   ├── expert_system_documentation.md
│   └── user_guide.md
└── README.md
```

---

## 5. Expert System Core Specifications

### 5.1 Knowledge Base & Rule Schema (50+ Rules)
The knowledge base contains **at least 50 distinct, non-duplicative diagnostic and maintenance rules** distributed across Engine, Electrical, Transmission, Brakes, Cooling & Lubrication, Suspension & Tyres, Fuel System, and Maintenance.

**Standardized JSON Rule Structure:**
```json
{
  "rule_id": "ELEC_001",
  "name": "Weak or Depleted Battery (Starting Failure)",
  "category": "electrical",
  "vehicle_applicability": {
    "vehicle_types": ["motorcycle", "car"],
    "cooling_types": ["any"],
    "fuel_types": ["petrol", "diesel", "hybrid"]
  },
  "conditions": [
    { "fact": "engine_starts", "operator": "==", "value": false },
    { "fact": "headlights_dim", "operator": "==", "value": true },
    { "fact": "battery_voltage_low", "operator": "==", "value": true }
  ],
  "derived_facts": [
    { "fact": "power_supply_insufficient", "value": true }
  ],
  "conclusion": {
    "fault_id": "FAULT_WEAK_BATTERY",
    "title": "Possible Weak or Discharged Battery",
    "is_final_diagnosis": true
  },
  "severity": "medium",
  "safety_critical": false,
  "priority": 80,
  "explanation_template": "The engine fails to start while headlights are dim and battery voltage is below the vehicle-specific operating range, indicating insufficient cranking power.",
  "recommended_action": "Test battery resting and cranking voltage with a multimeter, inspect terminals for corrosion, and recharge or replace the battery if it fails a load test.",
  "preventive_maintenance": "Check battery terminals and voltage every 6 months."
}
```

**Threshold Integrity Rule:** Rules requiring numeric thresholds (e.g., battery voltage, tyre pressure) either compare against user-entered vehicle specifications or prompt qualitative observation (`below_recommended_range`)—never fabricating universal manufacturer specs.

### 5.2 Working Memory Specification
Working memory stores structured `Fact` objects:
- `key`: Canonical fact name (e.g., `engine_cranks`, `coolant_level_low`).
- `value`: `bool | float | str | "UNKNOWN"`.
- `provenance`: `initial_fact | symptom | observation | measurement | derived`.
- `source_rule_id`: `null` for user inputs, or the triggering `rule_id` for derived facts.
- `timestamp` & `pass_number`: Tracks exactly when the fact entered memory for playback in the Expert System Monitor.

### 5.3 Forward Chaining (Data-Driven, Multi-Pass)
1. Load vehicle profile facts (e.g., `vehicle_type = "motorcycle"`, `cooling_type = "air_cooled"`) and initial user symptoms into Working Memory.
2. Filter the Knowledge Base to applicable rules (e.g., exclude liquid-coolant rules for air-cooled motorcycles).
3. **Iteration Loop (until fixed point):**
   - Scan all applicable rules not yet fired on current bindings (refraction).
   - Identify eligible rules whose conditions are all satisfied (treating `UNKNOWN` as unsatisfied, never `FALSE`).
   - If the conflict set has more than 1 rule, invoke **Conflict Resolution** and log all competing rules and why the winner was chosen.
   - Fire the selected rule, assert its `derived_facts` and/or `conclusion` into Working Memory, and append a structured entry to the execution trace.
   - Repeat until no new facts or conclusions can be derived.
4. Demonstrate genuine **multi-hop chaining** (e.g., Rule A derives `charging_system_suspect` -> Rule B combines `charging_system_suspect` + `recurring_battery_drain` -> concludes `Alternator/Stator Fault`).

### 5.4 Backward Chaining (Goal-Driven, Recursive)
1. Accept a target `goal` (e.g., `FAULT_WEAK_BATTERY` or `power_supply_insufficient`).
2. Maintain a `visited_goals` set on the call stack to **prevent infinite recursion / cycles**.
3. Check if `goal` is already established in Working Memory.
4. Locate all applicable rules whose `conclusion` or `derived_facts` establish `goal`.
5. For each candidate rule, evaluate each condition:
   - If satisfied in Working Memory -> mark proven.
   - If contradicted (`FALSE` when `TRUE` required) -> prune rule branch.
   - If missing or `UNKNOWN` -> recursively attempt to prove it as a subgoal via other rules; if no rule produces it, record it as a **missing observable fact** and generate a targeted follow-up question.
6. Return proof status (`PROVEN`, `DISPROVEN`, `INCONCLUSIVE_MISSING_FACTS`), full proof tree, and prioritized missing-fact questions.

### 5.5 Explanation Facility
Every diagnostic session and conclusion exposes:
- **Starting facts** (with provenance)
- **Rules evaluated vs. rules triggered**
- **Satisfied conditions per triggered rule**
- **Newly derived intermediate facts**
- **Step-by-step inference sequence & conflict-resolution decisions**
- **Human-readable "Why" & "How" rationale**
- **Recommended corrective action & safety disclaimer**

---

## 6. Functional Requirements by Module

### 6.1 Vehicle Information Module (`My Vehicles`)
- CRUD management for **motorcycles and cars**.
- Fields: Vehicle type, manufacturer, model, year, fuel type, engine displacement (CC), cooling type (`air_cooled` / `liquid_cooled` / `oil_cooled`), transmission type, odometer reading, last service date, last engine-oil replacement date, optional registration ID.
- **Data Provenance Badges:** Clearly label specifications as `User-Entered`, `Verified`, or `Estimated / Needs Confirmation`.

### 6.2 Interactive Diagnostic Interview (`Diagnose Vehicle`)
- Question-driven flow supporting **Yes/No**, **Multiple Choice**, **Numeric Measurements**, **Observational Choices**, and **`Unknown / Not sure`**.
- Dynamic follow-up selection driven by backward-chaining missing facts and vehicle applicability (e.g., hides kick-start questions for cars; hides coolant questions for air-cooled motorcycles).
- **Safety Escalation Banner:** If any safety-critical fact/rule triggers (brake failure, steering loss, fuel leak, severe overheating, oil-pressure warning, severe tyre damage), immediately halt/override normal flow with a high-visibility safety warning advising the user to stop safely and seek professional inspection.

### 6.3 Diagnostic Reports & PDF Export (`Diagnostic Reports`)
- Persists full report: unique Report ID, timestamp, vehicle profile & odometer, category, symptoms/observations, multiple possible faults, severity, **Evidence-Match Score**, triggered rule IDs, full reasoning trace, corrective actions, and preventive-maintenance suggestions.
- Supports viewing past reports, side-by-side comparison over time, and one-click **PDF download**.
- Mandatory disclaimer on UI and PDF stating results are preliminary possibilities requiring professional mechanic confirmation.

### 6.4 Vehicle Health Dashboard (`Overview`)
- Displays per-subsystem status across Engine, Electrical, Transmission, Brakes, Cooling & Lubrication, Suspension & Tyres, and Fuel System.
- Status enum: `Healthy` (only when recent checked evidence supports it), `Attention Required`, `Warning`, `Critical`, and `Not Assessed` (default when evidence is insufficient—never falsely showing `Healthy` simply because no rule fired).

### 6.5 Maintenance Recommendations (`Maintenance`)
- Tracks engine oil, air filter, brake pads, brake fluid, coolant (if applicable), tyre pressure, motorcycle chain lubrication (if applicable), battery checks, and general servicing.
- Supports user-configurable intervals clearly labeled as custom when authoritative manufacturer intervals are unavailable.

### 6.6 Expert System Monitor (`Expert System Monitor` — High-Priority Academic View)
- Real-time & post-hoc inspection of: total KB rules, rules evaluated, rules triggered, initial facts, derived facts, complete Working Memory table, conflict-resolution log, final conclusions, and full explanation trace.
- Dedicated tabs for **Forward Chaining**, **Backward Chaining**, **Knowledge Base Inspector**, and **Working Memory Inspector**, plus **Step-by-Step Reasoning Playback** controls (Play, Pause, Step Forward, Step Back, Reset).

### 6.7 Academic Demonstration Mode (`Academic Demo`)
- Ships with **10+ predefined scenarios** (motorcycle weak battery, low coolant overheating, restricted air filter, clutch slippage, worn brake pads, charging-system fault, fuel-delivery stalling, uneven tyre wear, engine oil leak, excessive vibration).
- Evaluators select a scenario, execute Forward Chaining or Backward Chaining, inspect step-by-step memory mutations, and view an automated **Expected vs. Actual Comparison** card.

### 6.8 Google Colab Notebook (`notebooks/AutoExpert_Expert_System_Development.ipynb`)
- Imports `autoexpert_engine` directly (via repo clone + `pip install -e .`) with zero duplicated algorithm code.
- Covers all 10 required sections: Introduction, Knowledge Representation (50+ rules), Working Memory, Forward Chaining, Backward Chaining, Explanation Facility, 10+ Diagnostic Scenarios, Evaluation Metrics (rules fired, evaluation counts, runtime, expected vs. actual accuracy strictly scoped to the test set), Visualizations (charts of rule activation & scenario outcomes), and Conclusion/Limitations.

---

## 7. Database Schema (SQLite + SQLAlchemy)

| Table | Key Columns | Purpose |
| :--- | :--- | :--- |
| `vehicles` | `id`, `vehicle_type`, `manufacturer`, `model`, `year`, `fuel_type`, `cooling_type`, `displacement_cc`, `transmission`, `odometer_km`, `last_service_date`, `last_oil_change_date`, `registration_no`, `spec_source_json`, `created_at` | Stores motorcycle & car profiles with specification provenance. |
| `diagnostic_sessions` | `id`, `vehicle_id` (FK), `category`, `mode` (`forward`/`backward`/`interview`), `status` (`in_progress`/`completed`/`safety_escalated`), `working_memory_json`, `trace_json`, `created_at`, `updated_at` | Tracks active and completed interactive diagnostic sessions. |
| `session_facts` | `id`, `session_id` (FK), `fact_key`, `fact_value`, `provenance`, `source_rule_id`, `pass_number` | Normalized fact & symptom history per session. |
| `diagnostic_reports` | `id`, `report_code`, `session_id` (FK), `vehicle_id` (FK), `odometer_at_diagnosis`, `category`, `conclusions_json`, `highest_severity`, `safety_warning_triggered`, `explanation_json`, `created_at` | Immutable saved diagnostic reports for history comparison & PDF export. |
| `maintenance_records` | `id`, `vehicle_id` (FK), `item_type`, `service_date`, `odometer_km`, `notes`, `created_at` | Historical service logs per vehicle. |
| `maintenance_reminders` | `id`, `vehicle_id` (FK), `item_type`, `interval_km`, `interval_days`, `interval_source` (`verified`/`user_custom`), `next_due_km`, `next_due_date`, `status` | Tracks upcoming and overdue maintenance recommendations. |
| `user_preferences` | `id`, `distance_unit` (`km`/`mi`), `pressure_unit` (`psi`/`bar`), `default_demo_playback_ms`, `updated_at` | Persists Settings page preferences. |

---

## 8. Complete REST API Specification

All endpoints return JSON (except PDF download), use standard HTTP status codes (`200`, `201`, `400`, `404`, `422`), and are documented interactively at `/docs`.

### 8.1 Vehicles API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vehicles` | Register a new motorcycle or car. | Body: vehicle attributes + `spec_source` tags -> `201 Created` with vehicle object. |
| `GET` | `/api/vehicles` | List all registered vehicles. | Query: `?vehicle_type=motorcycle\|car` -> Array of vehicle summaries. |
| `GET` | `/api/vehicles/{id}` | Get full vehicle profile, service summary, & subsystem health. | Returns vehicle profile + latest health snapshot. |
| `PUT` | `/api/vehicles/{id}` | Update vehicle details or odometer. | Body: partial/full vehicle fields -> Updated vehicle object. |
| `DELETE` | `/api/vehicles/{id}` | Delete a vehicle and associated records. | Returns `200 OK` deletion confirmation. |
| `GET` | `/api/vehicles/{id}/health` | Get subsystem health dashboard status. | Returns status per subsystem (`Healthy`, `Attention Required`, `Warning`, `Critical`, `Not Assessed`) with last-assessed timestamp. |

### 8.2 Diagnostics & Inference API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/diagnostics/start` | Initialize a new interactive diagnostic session. | Body: `{ vehicle_id, category, initial_symptoms: [...] }` -> Returns `session_id`, `safety_alert` (if any), `next_question`, and initial working memory. |
| `POST` | `/api/diagnostics/answer` | Submit an answer (Yes/No, MCQ, numeric, or `UNKNOWN`). | Body: `{ session_id, fact_key, value, provenance }` -> Runs safety check + inference step; returns updated `working_memory`, `safety_alert`, `next_question` (or `completed: true` + `report_id`). |
| `POST` | `/api/diagnostics/forward-chain` | Run full iterative forward chaining on a session or raw fact set. | Body: `{ session_id }` or `{ vehicle_context, facts }` -> Returns `conclusions`, `derived_facts`, `triggered_rules`, `conflict_log`, `execution_steps`, `runtime_ms`. |
| `POST` | `/api/diagnostics/backward-chain` | Run goal-driven backward chaining for a target fault/goal. | Body: `{ session_id, target_goal }` -> Returns `proof_status`, `proof_tree`, `missing_facts`, `suggested_questions`, `cycles_prevented`. |
| `GET` | `/api/diagnostics/{id}` | Retrieve full state of a diagnostic session. | Returns session metadata, full Working Memory, and step-by-step execution history. |
| `GET` | `/api/diagnostics/{id}/explanation` | Retrieve structured & natural-language explanation trace. | Returns starting facts, rules evaluated/triggered, derived facts, conflict-resolution log, and "How/Why" reasoning. |

### 8.3 Knowledge Base API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rules` | List and filter all knowledge-base rules. | Query: `?category=&vehicle_type=&severity=&search=` -> Returns rule list + KB metadata (total count, categories). |
| `GET` | `/api/rules/{id}` | Inspect a single rule's full definition. | Returns complete JSON rule object, conditions, priority, applicability, and explanation template. |
| `GET` | `/api/rules/stats` | Get KB statistics for the Expert System Monitor. | Returns counts by category, vehicle applicability, and safety-critical flags. |

### 8.4 Diagnostic Reports & PDF API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | List saved diagnostic reports. | Query: `?vehicle_id=&category=&severity=` -> Paginated report summaries. |
| `GET` | `/api/reports/{id}` | Fetch complete report details. | Returns full diagnostic report, evidence-match scores, triggered rules, and reasoning trace. |
| `GET` | `/api/reports/compare` | Compare two historical reports for a vehicle. | Query: `?report_a={id}&report_b={id}` -> Returns diff of symptoms, faults, odometer, and severity. |
| `GET` | `/api/reports/{id}/pdf` | Download formatted PDF report. | Returns `application/pdf` binary stream with `Content-Disposition: attachment`. |

### 8.5 Maintenance API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | List maintenance records & upcoming reminders. | Query: `?vehicle_id=` -> Returns `{ records: [...], reminders: [...], due_alerts: [...] }`. |
| `POST` | `/api/maintenance` | Log a completed service or create a custom reminder. | Body: `{ vehicle_id, record_type, item_type, service_date, odometer_km, interval_km, interval_days }` -> `201 Created`. |
| `PUT` | `/api/maintenance/{id}` | Update a maintenance record or custom interval. | Body: updated fields -> Returns updated record/reminder. |

### 8.6 Academic Demo & Settings API
| Method | Endpoint | Description | Key Payload / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/demo/scenarios` | List all 10+ predefined academic scenarios. | Returns scenario IDs, titles, vehicle profiles, initial symptoms, and expected outcomes. |
| `POST` | `/api/demo/run` | Execute a scenario in forward or backward mode. | Body: `{ scenario_id, mode: "forward" \| "backward", target_goal? }` -> Returns full inference trace, working memory, runtime, and `expected_vs_actual` match verdict. |
| `GET` / `PUT` | `/api/settings` | Read or update local user preferences. | Body: `{ distance_unit, pressure_unit, default_demo_playback_ms }`. |

---

## 9. UI/UX, Safety & Testing Requirements

### 9.1 UI/UX Design Standards
- **Visual System:** Dark navy/charcoal palette (`#0B1120` canvas, `#111827` cards, `#1E293B` borders, `#3B82F6` subtle blue primary accents, semantic amber/red badges reserved strictly for warnings/critical faults).
- **Navigation (9 Sections):** Overview, My Vehicles, Diagnose Vehicle, Diagnostic Reports, Maintenance, Knowledge Base, Expert System Monitor, Academic Demo, Settings.
- **Component States:** Every view must handle loading skeletons, empty states, form validation, API error banners, and destructive-action confirmations.

### 9.2 Mandatory Safety Guardrails
- Never claim a diagnosis is confirmed; always separate **possible causes** from **confirmed faults**.
- Never provide dangerous DIY repair instructions (e.g., opening pressurized hot radiators, bypassing brake/airbag circuits).
- Safety-critical symptoms (brake failure, steering vibration/loss, fuel leaks, severe overheating, oil-pressure warning, tyre structural damage) must trigger an immediate, unmissable warning advising stopping safely and consulting a certified mechanic.

### 9.3 Verification & Testing Matrix
- **Engine Unit Tests (`pytest`):** KB schema validation (50+ rules), 3VL working memory (`UNKNOWN != FALSE`), multi-pass forward chaining, recursive backward chaining, cycle detection, 5-tier conflict resolution, explanation trace completeness, safety escalation precedence.
- **API & Persistence Tests:** Full CRUD for vehicles/maintenance, interview session progression, SQLite persistence across restarts, and valid PDF byte generation.
- **Parity & Scenario Tests:** Automated test verifying all 10+ predefined scenarios pass expected outcomes and that the Colab notebook produces identical outputs to the FastAPI backend.

---

## 10. Phased Implementation Roadmap

1. **Phase 1 — Foundation:** Initialize repository, `pyproject.toml`, SQLite/SQLAlchemy models, FastAPI skeleton, and React + Vite + Tailwind shell.
2. **Phase 2 — Expert System Engine & KB:** Author 50+ validated JSON rules across motorcycle, car, and maintenance files; implement Working Memory, Forward Chaining, Backward Chaining, Conflict Resolution, Explanation Engine, and Interview Manager with unit tests.
3. **Phase 3 — Google Colab Notebook:** Build `AutoExpert_Expert_System_Development.ipynb` importing `autoexpert_engine`, running all 10+ scenarios, computing test-set evaluation metrics, and plotting rule-activation visualizations.
4. **Phase 4 — Core Web Workflows:** Implement Vehicles API/UI, Interactive Diagnostic Interview with safety interrupts, Diagnostic Reports, and ReportLab PDF export.
5. **Phase 5 — Academic & Dashboard Modules:** Build Vehicle Health Dashboard, Maintenance Tracker, Expert System Monitor (with step-by-step playback), Knowledge Base browser, and Academic Demo runner.
6. **Phase 6 — Integration & Verification:** End-to-end testing across frontend, backend, database, and Colab notebook; finalize `README.md`, architecture docs, and setup instructions.