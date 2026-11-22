"""Integration tests for all FastAPI REST API endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.app.database import Base, engine
from backend.app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "operational"

    res_h = client.get("/api/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"


def test_vehicle_crud_and_health_dashboard():
    # 1. Create a vehicle
    vehicle_payload = {
        "vehicle_type": "car",
        "manufacturer": "Subaru",
        "model": "Outback",
        "year": 2021,
        "fuel_type": "petrol",
        "cooling_type": "liquid_cooled",
        "displacement_cc": 2498,
        "transmission": "cvt",
        "odometer_km": 45000,
        "registration_no": "SUB-2021",
        "spec_source": {"displacement_cc": "Verified", "odometer_km": "User-Entered"},
    }
    create_res = client.post("/api/vehicles", json=vehicle_payload)
    assert create_res.status_code == 201
    v_data = create_res.json()
    v_id = v_data["id"]
    assert v_data["model"] == "Outback"
    assert v_data["spec_source"]["displacement_cc"] == "Verified"

    # 2. List vehicles
    list_res = client.get("/api/vehicles?vehicle_type=car")
    assert list_res.status_code == 200
    assert any(v["id"] == v_id for v in list_res.json())

    # 3. Get vehicle detail
    get_res = client.get(f"/api/vehicles/{v_id}")
    assert get_res.status_code == 200
    assert get_res.json()["manufacturer"] == "Subaru"

    # 4. Check Subsystem Health Dashboard
    # Must default to "Not Assessed" when no reports exist!
    health_res = client.get(f"/api/vehicles/{v_id}/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    for sub, info in h_data["subsystems"].items():
        assert info["status"] == "Not Assessed", f"Subsystem {sub} should default to 'Not Assessed'"

    # 5. Update vehicle
    update_res = client.put(f"/api/vehicles/{v_id}", json={"odometer_km": 46500})
    assert update_res.status_code == 200
    assert update_res.json()["odometer_km"] == 46500

    # 6. Delete vehicle
    del_res = client.delete(f"/api/vehicles/{v_id}")
    assert del_res.status_code == 200


def test_rules_endpoints():
    res = client.get("/api/rules")
    assert res.status_code == 200
    data = res.json()
    assert data["total_kb_rules"] >= 50

    stats_res = client.get("/api/rules/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_rules"] >= 50

    rule_res = client.get("/api/rules/MOTO_ELEC_001")
    assert rule_res.status_code == 200
    assert rule_res.json()["rule_id"] == "MOTO_ELEC_001"


def test_diagnostic_interactive_session_flow_and_pdf():
    # 1. Create a motorcycle
    v_res = client.post("/api/vehicles", json={
        "vehicle_type": "motorcycle",
        "manufacturer": "Yamaha",
        "model": "R3",
        "year": 2020,
        "fuel_type": "petrol",
        "cooling_type": "liquid_cooled",
        "odometer_km": 15000,
    })
    v_id = v_res.json()["id"]

    # 2. Start diagnostic session
    start_res = client.post("/api/diagnostics/start", json={
        "vehicle_id": v_id,
        "category": "electrical",
        "initial_symptoms": ["engine_starts", "starter_clicks"],
    })
    assert start_res.status_code == 201
    s_data = start_res.json()
    session_id = s_data["session_id"]
    assert s_data["status"] == "in_progress"

    # 3. Answer a question
    ans_res = client.post("/api/diagnostics/answer", json={
        "session_id": session_id,
        "fact_key": "headlights_dim",
        "value": True,
        "provenance": "observation",
    })
    assert ans_res.status_code == 200
    ans_data = ans_res.json()

    # 4. If report generated, download PDF
    report_id = ans_data.get("report_id")
    if not report_id:
        # Get reports for this vehicle
        reps = client.get(f"/api/reports?vehicle_id={v_id}").json()
        if reps:
            report_id = reps[0]["id"]

    if report_id:
        pdf_res = client.get(f"/api/reports/{report_id}/pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF")


def test_demo_scenarios_runner_endpoint():
    # 1. List scenarios
    list_res = client.get("/api/demo/scenarios")
    assert list_res.status_code == 200
    scenarios = list_res.json()
    assert len(scenarios) >= 10

    # 2. Run Scenario 1 in forward mode
    run_res = client.post("/api/demo/run", json={
        "scenario_id": "SCENARIO_01_MOTO_BATTERY",
        "mode": "forward",
    })
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["expected_vs_actual"]["verdict"] == "MATCH (PASS)"
    assert "FAULT_WEAK_BATTERY" in run_data["expected_vs_actual"]["actual_conclusions"]


def test_maintenance_and_settings():
    # 1. Settings
    set_res = client.get("/api/settings")
    assert set_res.status_code == 200

    up_res = client.put("/api/settings", json={"distance_unit": "km", "pressure_unit": "psi"})
    assert up_res.status_code == 200
    assert up_res.json()["distance_unit"] == "km"

    # 2. Maintenance overview
    maint_res = client.get("/api/maintenance")
    assert maint_res.status_code == 200
    assert "records" in maint_res.json()
    assert "reminders" in maint_res.json()
