# AutoExpert — System Architecture

## 1. High-Level Architecture Overview

AutoExpert is designed as a **pure symbolic, knowledge-based expert system** that unifies diagnostic inference for motorcycles and cars. The system strictly separates knowledge representation and inference logic from UI rendering and API endpoints through a shared, UI-independent Python engine package: `autoexpert_engine`.

```mermaid
flowchart TD
    subgraph UI_Clients ["Client Layer"]
        ReactApp["React 18 + Tailwind SPA<br/>(Port 5173)"]
        ColabNB["Google Colab Notebook<br/>(AutoExpert_Expert_System_Development.ipynb)"]
    end

    subgraph Backend_Layer ["FastAPI Service Layer (Port 8000)"]
        FastAPI["FastAPI REST Endpoints<br/>(Vehicles, Diagnostics, Reports, Rules)"]
        PDFGen["ReportLab PDF Engine<br/>(Binary Report Generation)"]
        SQLiteDB[(SQLite Database<br/>autoexpert.db)]
    end

    subgraph Shared_Engine ["Shared Reusable Engine (autoexpert_engine)"]
        WM["Three-Valued Logic (3VL)<br/>Working Memory"]
        KB["Knowledge Base Loader<br/>(55+ Validated Rules)"]
        CR["5-Tier Conflict Resolver<br/>(Refraction, Safety, Specificity, Priority, ID)"]
        FC["Multi-Pass Forward Chaining<br/>(Fixed-Point Iteration)"]
        BC["Recursive Backward Chaining<br/>(Cycle Detection & Proof Tree)"]
        IM["Interactive Interview Manager<br/>(Safety Escalation Guardrails)"]
        EE["Explanation Facility<br/>(Why & How Rationale)"]
    end

    subgraph Knowledge_Files ["Knowledge Base Files (JSON Schema Draft-07)"]
        MR["motorcycle_rules.json (20 rules)"]
        CRRules["car_rules.json (20 rules)"]
        MaintR["maintenance_rules.json (15 rules)"]
        Scenarios["demo_scenarios.json (10 scenarios)"]
    end

    ReactApp -->|REST API Calls| FastAPI
    FastAPI -->|Imports| Shared_Engine
    FastAPI -->|ORM Persistence| SQLiteDB
    FastAPI -->|Generates PDFs| PDFGen
    ColabNB -->|Direct pip install -e .| Shared_Engine
    Shared_Engine -->|Loads & Validates| Knowledge_Files
    FC --> CR
    FC --> WM
    BC --> WM
    IM --> BC
    IM --> FC
```

---

## 2. Shared Engine Package (`autoexpert_engine`)

The core inference logic is packaged via `pyproject.toml` into `autoexpert_engine`.
- **Zero inference code duplication:** Both the FastAPI backend and the academic Colab notebook import the exact same modules.
- **UI-independent:** Operates entirely in pure Python with no web or display dependencies.
- **Strict schema validation:** All rules loaded into memory are verified at runtime using `jsonschema` against `knowledge_base/rule_schema.json`.

---

## 3. Data & Memory Flow

```mermaid
sequenceDiagram
    participant User as Technician / User
    participant Interview as InterviewManager
    participant WM as 3VL Working Memory
    participant Engine as Forward/Backward Engine
    participant Resolver as 5-Tier ConflictResolver
    participant Report as DiagnosticReport

    User->>Interview: Submit Observation / Measurement / "Unknown"
    Interview->>WM: Assert Fact (provenance, timestamp, pass)
    Interview->>Engine: Run Forward Chaining Pass
    Engine->>Resolver: Resolve Eligible Rules (Conflict Set)
    Resolver-->>Engine: Winning Rule (Refraction / Safety / Specificity)
    Engine->>WM: Assert Derived Facts & Final Conclusion
    Interview->>Interview: Check Safety Escalation Guardrails
    alt Safety Critical Triggered
        Interview-->>User: CRITICAL SAFETY HALT & Warning Banner
    else Normal Progression
        Interview->>Engine: Backward Chain for Missing Observable Facts
        Engine-->>Interview: Prioritized Next Question
        Interview-->>User: Present Follow-up Question
    end
    User->>Report: Conclude & Export PDF Report
```

---

## 4. Database Schema (SQLAlchemy 2.0 + SQLite)

1. `vehicles`: Persistent motorcycle & car profiles with data provenance flags (`User-Entered`, `Verified`, `Estimated`).
2. `diagnostic_sessions`: In-progress and completed interactive interviews.
3. `session_facts`: Historical audit log of every asserted fact, symptom, and measurement.
4. `diagnostic_reports`: Immutable diagnostic snapshots storing evidence scores, triggered rule IDs, and full inference chains.
5. `maintenance_records`: Completed service logs.
6. `maintenance_reminders`: Upcoming service milestones and custom inspection intervals.
7. `user_preferences`: Local settings (distance units, pressure units, playback speeds).
