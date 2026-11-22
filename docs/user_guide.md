# AutoExpert — User & Evaluator Guide

## 1. Quick Start & Local Setup

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### Starting the Backend Server
```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -e .

# Launch FastAPI backend server (Runs on http://127.0.0.1:8000)
python backend/run.py
```
*API documentation and interactive Swagger UI are available at: `http://127.0.0.1:8000/docs`*

### Starting the React Frontend
```bash
cd frontend
npm run dev
```
*Web dashboard opens at: `http://localhost:5173`*

---

## 2. Navigating the AutoExpert Web Dashboard

AutoExpert features 9 integrated modules designed for vehicle diagnosis, academic inspection, and fleet maintenance:

### 1. Overview (Vehicle Health Dashboard)
- **Subsystem Health Status:** Displays the operational status of all 7 vehicle subsystems (`Engine`, `Electrical`, `Transmission`, `Brakes`, `Cooling & Lubrication`, `Suspension & Tyres`, `Fuel System`).
- **Honest "Not Assessed" Defaults:** Subsystems default to `Not Assessed` until validated by physical diagnostic evidence.
- **Evidence-Match Scores:** Displays numeric confidence strictly reflecting rule premise fulfillment percentage.

### 2. My Vehicles
- Register motorcycles and cars with engine displacement (cc), transmission, cooling type, and odometer readings.
- **Data Provenance Badges:** Tag each specification as `User-Entered`, `Verified from Manual`, or `Estimated / Needs Confirmation`.

### 3. Diagnose Vehicle (Interactive Interview)
- Select vehicle profile and affected category.
- Answer adaptive diagnostic questions (Yes/No, numeric measurements, observational choices, and "Unknown / Not sure").
- **Safety-First Escalation:** If safety-critical faults trigger (brake failure, low oil pressure, fuel leaks), the questionnaire immediately halts with an unmissable red warning banner advising stopping the vehicle safely.
- On completion, review derived conclusions, evidence-match scores, and download a PDF report.

### 4. Diagnostic Reports
- Review past diagnostic audits.
- **Side-by-Side Comparison:** Select baseline Report A and target Report B to view resolved faults, persistent issues, new faults, and odometer delta.
- **One-Click PDF Export:** Download official ReportLab-generated diagnostic certificates.

### 5. Maintenance Tracker
- Log completed oil changes, brake pads, and timing belt services.
- Set custom inspection intervals in kilometers or days.
- View automated service-due alerts.

### 6. Knowledge Base Inspector
- Search and filter all 55+ production rules.
- View full IF-THEN premises, priority, specificity, and multi-hop derived facts.

### 7. Expert System Monitor
- **Forward Chaining Engine:** Input custom raw fact JSONs and watch the engine iterate across passes until a fixed point is reached.
- **Step-by-Step Playback Controls:** Use Play, Pause, Step Forward, and Step Backward buttons to watch working memory mutations and conflict resolution decisions.
- **Backward Chaining Prover:** Test hypothetical goals with recursive cycle detection and missing-fact question generation.

### 8. Academic Demo Mode
- Choose from 10 predefined academic scenarios matching ground-truth mechanical problems.
- Execute single-scenario tests or click **"Run All 10 Scenarios (Batch Eval)"** to view an automated Expected vs. Actual parity report.

### 9. Settings
- Toggle distance units (`km` vs `mi`), tyre pressure units (`psi` vs `bar`), and playback speeds.
