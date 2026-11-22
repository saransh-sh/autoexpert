# AutoExpert — Project Context Transfer

## Purpose of this file
This file transfers the decisions and requirements from the prior ChatGPT conversation to a development agent (e.g., Google Antigravity). Treat it as the project's source-of-context document. Do not ask the user to repeat these decisions.

---

## 1. Project Identity

**Project name:** AutoExpert  
**Full name:** AutoExpert — Intelligent Vehicle Diagnosis & Mechanic Expert System  
**Academic subject:** Expert Systems  
**Project type:** Rule-based / knowledge-based expert system, presented as a web application with a Google Colab academic notebook.

The project simulates the reasoning of an experienced mechanic. Users enter vehicle information and symptoms; the system evaluates expert-defined IF–THEN rules and returns possible faults, severity, reasoning, and recommended next steps.

### Core constraint
This must be a **genuine traditional expert system**. Do not replace it with an LLM chatbot, an API-powered AI assistant, machine learning, or static hardcoded diagnosis screens. Diagnostic conclusions must be traceable to the knowledge base and the implemented inference algorithms. No paid AI services or external LLM APIs.

## 2. Key Decisions Already Made

- Build a complete local web application using Google Antigravity as the development agent/IDE.
- Include **Google Colab** as an academic experimentation, demonstration, testing, and evaluation environment.
- The live application must run locally and must **not depend on a Colab session staying online**.
- Colab and the web backend must use the **same reusable expert-system Python package**, not duplicate separate implementations.
- Support both **motorcycles and cars**, while allowing vehicle-specific applicability (e.g., hide coolant questions for air-cooled motorcycles).
- Aim for a polished, university-project quality deliverable suitable for instructor demonstration and viva.
- Prioritize correctness and transparency of expert-system logic over cosmetic UI polish.
- Do not fabricate manufacturer vehicle specifications or pretend uncertain diagnoses are confirmed.

## 3. Proposed Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React icons
- Recharts
- React Router

### Backend
- Python
- Flask or FastAPI (agent may choose one and explain briefly)
- REST API

### Database
- SQLite
- SQLAlchemy ORM

### Expert-system engine
- Custom Python implementation
- JSON-based knowledge representation / knowledge base
- Forward chaining
- Backward chaining
- Working memory
- Conflict resolution
- Explanation facility

### Academic environment
- Google Colab notebook (`.ipynb`)

## 4. Expert System Concepts Required

The project must visibly demonstrate these concepts:

- Knowledge representation
- Knowledge base
- Rule-based reasoning
- Inference engine
- Forward chaining (data-driven, iterative)
- Backward chaining (goal-driven, recursively verify target diagnosis)
- Working memory / fact management
- Conflict resolution
- Explanation facility / reasoning trace
- Knowledge acquisition (rules documented and structured)
- Expert-system evaluation and test scenarios

The inference engine must be modular, independently testable, and separate from UI and API code.

### Forward chaining requirements
- Start with initial user facts.
- Evaluate rules against working memory.
- Trigger applicable rules.
- Derive new facts/conclusions and add them to working memory.
- Iterate until no new facts are derived (fixed point).
- Keep an execution log.
- Handle conflict resolution when multiple rules are eligible.
- Demonstrate chained inference, not only one-pass condition checking.

### Backward chaining requirements
- Start from a target diagnosis/goal.
- Find rule(s) that can establish the goal.
- Check required conditions against working memory.
- Recursively evaluate subgoals where applicable.
- Identify missing facts and surface questions to obtain them.
- Explain the proof/verification path.
- Avoid infinite recursion through cycle detection.

### Working memory must distinguish
- Initial user facts
- User-reported symptoms
- Observations
- Measured values
- Unknown/missing information
- Derived facts
- Triggered rules
- Conclusions

Do not treat Unknown or unanswered as False.

### Explanation facility
For every diagnostic conclusion, expose:
- Starting facts
- Rules evaluated
- Triggered rule IDs and conditions satisfied
- Newly derived facts
- Inference sequence
- Why conclusion follows
- Recommended action

## 5. Vehicle Information Module

Allow users to register and manage vehicle profiles for motorcycles and cars. Fields may include:
- Vehicle type (motorcycle/car)
- Manufacturer
- Model
- Model/manufacturing year
- Fuel type (petrol/diesel/electric/hybrid as appropriate)
- Engine displacement (CC, where applicable)
- Transmission type
- Odometer reading
- Last service date
- Last engine-oil replacement date
- Optional registration identifier

Vehicle profile should display information, engine/fuel/transmission details, mileage, service history, maintenance history, and upcoming recommendations.

**Specification accuracy:** Clearly distinguish user-entered, verified, and estimated data. Do not invent manufacturer specifications. If verified information is not available, label it as needing confirmation.

## 6. Diagnostic Categories and Symptoms

### Engine
- Engine will not start
- Hard starting
- Overheating
- Engine knocking
- Excessive vibration
- Stalling
- Reduced power
- Excessive smoke
- Unusual engine noise
- Rough idle
- Irregular acceleration

### Electrical
- Battery not charging
- Battery drains quickly
- Weak battery
- Headlights not working/dim
- Starter/self-start not working
- Ignition issue
- Fuse-related issue
- Electrical malfunction

### Transmission
- Difficult gear changes
- Gear slipping
- Clutch slipping
- Clutch not engaging correctly
- Unusual transmission noise

### Brakes
- Reduced braking effectiveness
- Brake noise
- Spongy lever/pedal
- Brake vibration
- Excessive wear
- Brake-fluid leakage

### Cooling and lubrication
- Overheating
- Coolant leak (only applicable vehicles)
- Engine oil leak
- Low oil
- Oil-pressure warning
- Possible lubrication problems

### Suspension and tyres
- Suspension noise
- Excessive bouncing
- Steering vibration
- Uneven tyre wear
- Low tyre pressure
- Poor handling

### Fuel system
- Fuel-delivery problem
- Fuel leak
- Poor fuel economy
- Difficulty accelerating
- Irregular fuel supply

## 7. Interactive Diagnostic Interview

The diagnostic workflow should be an intelligent question-driven interview, not a static symptom-to-result lookup. Follow-up questions should be selected based on prior answers where appropriate.


Use question types such as:
- Yes/No
- Multiple choice
- Numeric measurements
- Observational choices

Examples of prompts for starting issues:
- Does the engine crank when the starter is pressed?
- Are the headlights dim?
- Is battery voltage within the appropriate vehicle-specific range?
- Is fuel present?
- Is a clicking sound heard?
- Does kick-start work, if equipped?

Allow **Unknown / Not sure** answers. Preserve fact provenance and never interpret unknown as false.

## 8. Knowledge Base Requirements

Create **at least 50 meaningful diagnostic rules** across engine, electrical, transmission, braking, cooling, lubrication, suspension, tyres, and fuel-system categories. Rules should be distinct, technically plausible, non-duplicative, and vehicle-aware.

Each rule should include:
- Unique rule ID
- Name
- Conditions
- Conclusion
- Severity
- Recommended action/solution
- Explanation
- Vehicle applicability (motorcycle/car/both or relevant subtype)
- Diagnostic category
- Priority and/or specificity metadata for conflict resolution

Store rules in structured JSON files (or another clearly documented structured format). Suggested files:
- `knowledge_base/motorcycle_rules.json`
- `knowledge_base/car_rules.json`
- `knowledge_base/maintenance_rules.json`

Illustrative rule ideas (not a complete knowledge base):
- Weak battery: engine does not start + dim headlights + measured low battery voltage.
- Low coolant: overheating + low coolant level (applicable liquid-cooled vehicles).
- Restricted air filter: reduced power + filter observed dirty/blocked.
- Clutch slippage: engine RPM rises without proportional speed increase + slipping observed.
- Worn brake pads: braking noise + pads confirmed visibly worn.
- Charging system fault: recurring battery discharge + charging voltage outside the vehicle-specific range.
- Low tyre pressure: measured pressure below vehicle-specific recommended range plus related symptoms.

Use vehicle-specific thresholds when needed. Never invent universal voltage, pressure, temperature, or service thresholds without suitable grounding. If thresholds cannot be verified, require the user to enter the applicable specification or label the rule as qualitative.

## 9. Diagnostic Results and Reports

The diagnostic report should include:
- Unique report ID
- Date/time
- Vehicle profile and odometer
- Diagnostic category
- User symptoms and observations
- Possible faults (allow multiple)
- Severity
- Evidence-match score (if implemented)
- Triggered rule IDs
- Explanation/reasoning trace
- Suggested corrective action
- Preventive-maintenance suggestions

Reports should be saved, viewable, comparable over time, and downloadable as PDF.

**Score labeling:** Any numeric score must be described as an evidence/rule-match score, not statistically validated diagnostic confidence. Clearly state diagnoses are possibilities and require professional confirmation.

## 10. Vehicle Health Dashboard

Display overall overview and subsystem status for engine, electrical, transmission, brakes, cooling, suspension, etc. Use status labels such as:
- Healthy (only when evidence supports a checked condition)
- Attention required
- Warning
- Critical
- Not assessed

Do **not** claim a system is healthy merely because no rule fired. Use Not Assessed when evidence is insufficient.

## 11. Maintenance Recommendations

Provide reminders/recommendations based on odometer, service dates, oil change date, vehicle type, and manufacturer intervals where verified. Potential items:
- Engine oil
- Air filter
- Brake pads
- Brake fluid
- Coolant (if applicable)
- Tyre pressure
- Motorcycle chain lubrication (if applicable)
- Battery checks
- General servicing

Do not assume one interval fits all vehicles. Allow user-configurable intervals when authoritative vehicle-specific intervals are unavailable and label them accordingly.

## 12. Expert System Monitor (High Priority Academic Feature)

Create a dedicated **Expert System Monitor** showing the internals of the expert system:
- Number of knowledge-base rules
- Rules evaluated
- Rules triggered
- Initial facts
- Derived facts
- Working memory
- Inference execution history
- Conflict-resolution decisions
- Final conclusions
- Explanation trace

Provide views for forward chaining, backward chaining, knowledge-base inspection, and working-memory inspection. Ideally allow step-by-step reasoning playback for an academic demonstration. This must make the actual expert-system process visible to evaluators.

## 13. Academic Demonstration Mode

Provide at least **10 predefined scenarios**, each with:
- Vehicle information
- Initial symptoms
- Known observations
- Expected diagnostic outcome
- Relevant rules

Evaluator can load a scenario, run forward chaining, run backward chaining, inspect execution steps, working memory, and compare actual output against expected outcome.

Example scenarios:
1. Motorcycle starting issue / weak battery
2. Overheating / low coolant
3. Reduced performance / obstructed air filter
4. Clutch slipping / possible wear
5. Brake noise / worn pads
6. Battery discharge / charging-system fault
7. Engine stalling / fuel-delivery problem
8. Uneven tyre wear / pressure or alignment-related possibility
9. Engine oil leakage
10. Excessive vibration / possible mount or mechanical issue

The demo should be independent of physical vehicle hardware.

## 14. Google Colab Notebook

Create this notebook in the project:
`notebooks/AutoExpert_Expert_System_Development.ipynb`

Notebook contents:
1. Introduction: expert systems, why vehicle diagnosis, project goals, architecture.
2. Knowledge representation: inspect and explain rules (50+ rules).
3. Working memory: add, update, retrieve initial and derived facts.
4. Forward chaining: algorithm explanation, execution, logs, multiple scenarios.
5. Backward chaining: goal-driven evaluation, missing facts/questions, examples.
6. Explanation facility: inspect rule trace and generated reasoning.
7. Diagnostic scenarios: at least 10 scenarios and outputs.
8. Evaluation: rules fired, rule evaluation count, expected vs actual result, inference runtime, unresolved facts, multiple conclusions; calculate accuracy only against this defined test set and do not claim real-world accuracy.
9. Visualizations: useful charts (e.g. scenario results, rule activation statistics).
10. Conclusion, limitations, future work.

Notebook must run end-to-end in Google Colab.


**Shared engine requirement:** Notebook must import and use the same `autoexpert_engine` package as the local backend, rather than contain a second copied implementation. Provide a clear Colab setup/import procedure (e.g. clone the project repository or package/install path). Keep the notebook self-contained in explanations but not duplicate inference implementation. Do not require Colab to stay running for the local app.


## 15. UI / UX

Create a modern premium automotive diagnostic dashboard. Suggested aesthetic:
- Dark navy/charcoal theme
- Subtle blue accents
- Clear typography and spacing
- Polished cards and layouts
- Responsive design
- Smooth but restrained transitions
- Useful visualizations
- Automotive-inspired details

Avoid excessive gradients, clutter, and gratuitous animations. Implement good loading, empty, validation, error, and confirmation states. Ensure every control has working behavior.


### Suggested navigation
1. Overview
2. My Vehicles
3. Diagnose Vehicle
4. Diagnostic Reports
5. Maintenance
6. Knowledge Base
7. Expert System Monitor
8. Academic Demo
9. Settings

## 16. Database

Use SQLite and SQLAlchemy. Include appropriate models for:
- Vehicles
- Diagnostic sessions
- Diagnostic reports
- Symptoms / observations
- Knowledge-base rules (if persisted)
- Maintenance records
- Maintenance reminders
- User preferences

Persist report history across application restarts. Provide initialization/migration instructions.

## 17. REST API (Suggested)

Vehicles:
- `POST /api/vehicles`
- `GET /api/vehicles`
- `GET /api/vehicles/{id}`
- `PUT /api/vehicles/{id}`
- `DELETE /api/vehicles/{id}`

Diagnostics:
- `POST /api/diagnostics/start`
- `POST /api/diagnostics/answer`
- `POST /api/diagnostics/forward-chain`
- `POST /api/diagnostics/backward-chain`
- `GET /api/diagnostics/{id}`
- `GET /api/diagnostics/{id}/explanation`

Knowledge Base:
- `GET /api/rules`
- `GET /api/rules/{id}`

Reports:
- `GET /api/reports`
- `GET /api/reports/{id}`
- `GET /api/reports/{id}/pdf`

Maintenance:
- `GET /api/maintenance`
- `POST /api/maintenance`
- `PUT /api/maintenance/{id}`

Academic Demo:
- `GET /api/demo/scenarios`
- `POST /api/demo/run`

Agent may adapt endpoints to implementation needs, but keep API documented, validated, and consistent.

## 18. Safety

This is educational/preliminary diagnosis, not a professional mechanic or safety certification.
- Never guarantee a diagnosis.
- Separate possible causes from confirmed faults.
- Communicate uncertainty.
- Do not fabricate measurements or specs.
- Do not interpret missing facts as negative facts.
- Avoid unsafe repair instructions.
- For critical brakes, steering, fuel leaks, severe overheating, oil-pressure warnings, or tyre damage, show a clear safety warning; advise stopping the vehicle when safe and arranging professional inspection.
- Safety-critical warnings should take precedence over continuing the questionnaire.

## 19. Testing

Build unit and integration tests covering:
- Knowledge base loading and validation
- Working memory
- Forward chaining and multi-pass inference
- Backward chaining and recursive goals
- Cycle prevention
- Conflict resolution
- Explanation generation
- Unknown/missing facts
- Multiple diagnoses
- Safety escalation
- API endpoints
- Persistence
- Scenario results

Verify the notebook and backend produce consistent results because they use the same package. Include at least ten predefined test scenarios.

## 20. Suggested Project Structure

```text
AutoExpert/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       └── assets/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── config/
│   ├── requirements.txt
│   └── run.py
├── autoexpert_engine/
│   ├── __init__.py
│   ├── knowledge_base.py
│   ├── working_memory.py
│   ├── forward_chaining.py
│   ├── backward_chaining.py
│   ├── conflict_resolution.py
│   ├── explanation_engine.py
│   └── diagnostic_engine.py
├── knowledge_base/
│   ├── motorcycle_rules.json
│   ├── car_rules.json
│   └── maintenance_rules.json
├── notebooks/
│   └── AutoExpert_Expert_System_Development.ipynb
├── tests/
│   ├── test_forward_chaining.py
│   ├── test_backward_chaining.py
│   ├── test_diagnostics.py
│   └── test_knowledge_base.py
├── docs/
│   ├── system_architecture.md
│   ├── expert_system_documentation.md
│   └── user_guide.md
├── README.md
└── .gitignore
```

Agent may adjust this structure if justified but must retain clear separation between UI, API, engine, knowledge base, notebook, tests, and documentation.

## 21. Development Workflow

Use these phases, but work through implementation rather than stopping at planning or a UI mockup.

### Phase 1 — Foundation
- Inspect current workspace/environment before making assumptions.
- Set up project structure, frontend/backend, SQLite.
- Establish reusable expert-system package.

### Phase 2 — Engine
- Knowledge base
- Working memory
- Forward chaining
- Backward chaining
- Conflict resolution
- Explanation facility

### Phase 3 — Colab
- Create notebook importing the shared package
- Demonstrate algorithms and scenarios
- Evaluate outcomes and plot results

### Phase 4 — Core application
- Vehicle registration
- Diagnostic interview
- Engine integration
- Report generation

### Phase 5 — Additional modules
- Dashboard
- Maintenance
- Expert System Monitor
- Academic Demo

### Phase 6 — Integration and verification
- Integrate frontend/backend
- Test all workflows
- Fix defects
- Verify notebook end-to-end
- Document setup and use

Do not deliver a frontend-only prototype or leave core features as nonfunctional placeholders.

## 22. Final Deliverables

Required final project deliverables:
1. Functional React frontend
2. Functional Python backend
3. SQLite database
4. 50+ meaningful diagnostic rules
5. Genuine forward-chaining implementation
6. Genuine backward-chaining implementation
7. Working memory
8. Conflict resolution
9. Explanation facility
10. Interactive diagnostic interview
11. Vehicle dashboard
12. Diagnostic report creation
13. PDF export
14. Maintenance recommendations
15. Expert System Monitor
16. Academic Demo mode
17. Google Colab notebook
18. Shared expert-system package
19. Unit and integration tests
20. README
21. Technical documentation
22. Setup/run instructions

## 23. Instructions to the Receiving Agent

Read this context document in full before taking action. Treat it as the decisions and requirements already agreed upon.

- Inspect the existing workspace/repository first, if one exists. Do not overwrite unrelated work.
- Create a short implementation plan, then proceed to build.
- Prioritize accurate, transparent inference logic.
- Do not replace chaining algorithms with simplistic one-pass checks or hardcoded result pages.
- Keep the inference engine modular and independently testable.
- Ensure the Colab notebook imports the same package used by the backend.
- Keep conclusions traceable to rules.
- Support motorcycles and cars with applicable vehicle-specific logic.
- Be honest about any unfinished feature, limitation, or test that cannot be run.
- At completion, run tests and verify key workflows, including notebook execution where feasible.
- Report a concise implementation summary, how to launch the app, notebook usage, tests performed, and known limitations.

**Final goal:** A complete academic, rule-based Vehicle Mechanic Expert System called AutoExpert, combining a professional web application with Google Colab-based implementation demonstrations and evaluation.

---

## 24. First Message / Task for the Agent

After reading this file, inspect the workspace and start implementing AutoExpert according to this specification. Do not ask the user to restate requirements. If a technical decision is not explicitly fixed, choose a sensible option that preserves the project's goals and document that choice. Do not make scope reductions without explaining them.
