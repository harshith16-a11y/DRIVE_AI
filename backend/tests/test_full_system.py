from datetime import date
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.database import SessionLocal
from app.models.entities import Booking, Payment, Vehicle
from app.utils.seed import seed_database


@pytest.fixture(scope="module", autouse=True)
def setup_seeded_db():
    db = SessionLocal()
    try:
        seed_database(db, force_reset=True)
    finally:
        db.close()


client = TestClient(app)


def get_auth_headers(email: str, password: str) -> dict:
    res = client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_01_health_and_postgresql_connection():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "PostgreSQL" in data["postgres_version"]


def test_02_user_registration_and_login():
    # Register a new customer
    reg_payload = {
        "name": "Karan Kulkarni",
        "email": "karan.test@example.com",
        "phone": "+91-9900112233",
        "password": "TestPassword@123",
        "preferred_vehicle_type": "SUV",
        "preferred_transmission": "Automatic",
        "preferred_fuel": "Diesel",
        "preferred_seats": 5,
        "budget_per_day": 4200.0,
    }
    res = client.post("/auth/register", json=reg_payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert "access_token" in body
    assert body["user"]["email"] == "karan.test@example.com"
    assert body["user"]["role"] == "CUSTOMER"
    assert body["user"]["preferences"]["preferred_vehicle_type"] == "SUV"

    # Invalid login must return exact message
    bad_login = client.post(
        "/auth/login",
        json={"email": "karan.test@example.com", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["detail"] == "Invalid email or password"

    # Valid customer login
    good_login = client.post(
        "/auth/login",
        json={
            "email": "karan.test@example.com",
            "password": "TestPassword@123",
        },
    )
    assert good_login.status_code == 200
    assert good_login.json()["user"]["role"] == "CUSTOMER"

    # Valid admin login
    admin_login = client.post(
        "/auth/login",
        json={"email": "admin@rental.com", "password": "Admin@123"},
    )
    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["role"] == "ADMIN"


def test_03_jwt_and_role_based_access_control():
    cust_headers = get_auth_headers("rahul@example.com", "Customer@123")

    # Customer attempting admin-only endpoint (/reports/summary) must get 403 "Admin access required."
    res = client.get("/reports/summary", headers=cust_headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Admin access required."

    # Customer attempting to create a vehicle must get 403
    res_veh = client.post(
        "/vehicles",
        headers=cust_headers,
        json={
            "vehicle_number": "KA-99-XX-0001",
            "brand": "Test",
            "model": "Car",
            "vehicle_type": "Sedan",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "White",
            "daily_rate": 2500,
            "status": "AVAILABLE",
            "location": "Hub",
            "image_url": "/vehicles/sedan-city.svg",
            "description": "Test description",
        },
    )
    assert res_veh.status_code == 403
    assert res_veh.json()["detail"] == "Admin access required."


def test_04_vehicle_crud_and_duplicate_validation():
    admin_headers = get_auth_headers("admin@rental.com", "Admin@123")

    # Create a new vehicle
    new_v = {
        "vehicle_number": "KA-01-TEST-8888",
        "brand": "Skoda",
        "model": "Slavia Monte Carlo",
        "vehicle_type": "Sedan",
        "year": 2024,
        "transmission": "Automatic",
        "fuel_type": "Petrol",
        "seats": 5,
        "color": "Tornado Red",
        "daily_rate": 2950.0,
        "status": "AVAILABLE",
        "location": "Bengaluru - Indiranagar Hub",
        "image_url": "/vehicles/sedan-virtus.svg",
        "description": "Sporty German-engineered turbo sedan with virtual cockpit and sunroof.",
    }
    res = client.post("/vehicles", headers=admin_headers, json=new_v)
    assert res.status_code == 201, res.text
    created = res.json()
    vid = created["id"]
    assert created["vehicle_number"] == "KA-01-TEST-8888"

    # Duplicate vehicle number must be rejected with exact error
    dup_res = client.post("/vehicles", headers=admin_headers, json=new_v)
    assert dup_res.status_code == 400
    assert dup_res.json()["detail"] == "Vehicle number already exists."

    # Update vehicle
    upd_res = client.put(
        f"/vehicles/{vid}",
        headers=admin_headers,
        json={"daily_rate": 3050.0, "color": "Crystal Black"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["daily_rate"] == 3050.0
    assert upd_res.json()["color"] == "Crystal Black"

    # Delete newly created vehicle (no bookings yet, so hard-deleted)
    del_res = client.delete(f"/vehicles/{vid}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True


def test_05_customer_crud_and_preferences():
    cust_headers = get_auth_headers("rahul@example.com", "Customer@123")
    admin_headers = get_auth_headers("admin@rental.com", "Admin@123")

    me_res = client.get("/customers/me", headers=cust_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "rahul@example.com"

    upd_res = client.put(
        "/customers/me",
        headers=cust_headers,
        json={"budget_per_day": 4600.0, "preferred_vehicle_type": "SUV"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["budget_per_day"] == 4600.0

    list_res = client.get(
        "/customers?search=rahul", headers=admin_headers
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_06_vehicle_search_filters_and_availability_check():
    # Filter by SUV + Automatic + max_price 4500
    res = client.get(
        "/vehicles?vehicle_type=SUV&transmission=Automatic&max_price=4500"
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    for v in items:
        assert v["vehicle_type"] == "SUV"
        assert v["transmission"] == "Automatic"
        assert v["daily_rate"] <= 4500.0

    # Invalid date order validation
    bad_avail = client.get(
        "/vehicles/1/availability?start_date=2026-11-10&end_date=2026-11-05"
    )
    assert bad_avail.status_code == 400
    assert bad_avail.json()["detail"] == "End date must be after start date."

    # Valid availability check
    good_avail = client.get(
        "/vehicles/1/availability?start_date=2026-11-10&end_date=2026-11-14"
    )
    assert good_avail.status_code == 200
    avail_data = good_avail.json()
    assert avail_data["available"] is True
    assert avail_data["total_days"] == 4
    assert avail_data["subtotal"] == 4 * avail_data["daily_rate"]


def test_07_booking_creation_payment_and_double_booking_prevention():
    cust_headers = get_auth_headers("rahul@example.com", "Customer@123")

    # 1. Create booking for Vehicle 1 from 2026-11-15 to 2026-11-18 (3 days)
    b_res = client.post(
        "/bookings",
        headers=cust_headers,
        json={
            "vehicle_id": 1,
            "start_date": "2026-11-15",
            "end_date": "2026-11-18",
        },
    )
    assert b_res.status_code == 201, b_res.text
    booking = b_res.json()
    booking_id = booking["id"]
    assert booking["total_days"] == 3
    assert booking["subtotal"] == 3 * 3800.0
    assert booking["status"] == "PENDING"

    # 2. Attempt double-booking on overlapping dates (2026-11-16 to 2026-11-19) -> MUST FAIL
    double_res = client.post(
        "/bookings",
        headers=cust_headers,
        json={
            "vehicle_id": 1,
            "start_date": "2026-11-16",
            "end_date": "2026-11-19",
        },
    )
    assert double_res.status_code == 400
    assert (
        double_res.json()["detail"]
        == "This vehicle is not available for the selected dates."
    )

    # 3. Complete DEMO payment for booking_id
    pay_res = client.post(
        "/payments",
        headers=cust_headers,
        json={"booking_id": booking_id, "payment_method": "DEMO"},
    )
    assert pay_res.status_code == 201, pay_res.text
    pay_data = pay_res.json()
    assert pay_data["transaction_status"] == "COMMITTED"
    assert pay_data["payment"]["payment_status"] == "PAID"
    assert pay_data["booking"]["status"] in ("CONFIRMED", "ACTIVE")


def test_08_transaction_rollback_on_failure():
    cust_headers = get_auth_headers("priya@example.com", "Customer@123")

    db = SessionLocal()
    try:
        bookings_before = db.query(Booking).count()
        payments_before = db.query(Payment).count()
        veh2_before = db.query(Vehicle).filter(Vehicle.id == 2).first().status
    finally:
        db.close()

    # Trigger atomic checkout with simulate_failure=True
    fail_res = client.post(
        "/bookings/transactional",
        headers=cust_headers,
        json={
            "vehicle_id": 2,
            "start_date": "2026-12-01",
            "end_date": "2026-12-04",
            "payment_method": "DEMO",
            "simulate_failure": True,
        },
    )
    assert fail_res.status_code == 400
    assert "Transaction rolled back" in fail_res.json()["detail"]

    # Verify PostgreSQL rolled back all changes (no orphan booking, no orphan payment, status unchanged)
    db = SessionLocal()
    try:
        bookings_after = db.query(Booking).count()
        payments_after = db.query(Payment).count()
        veh2_after = db.query(Vehicle).filter(Vehicle.id == 2).first().status
        assert bookings_after == bookings_before
        assert payments_after == payments_before
        assert veh2_after == veh2_before
    finally:
        db.close()


def test_09_vehicle_return_late_and_damage_fee_and_rental_history():
    cust_headers = get_auth_headers("rahul@example.com", "Customer@123")

    # Find the booking created in test_07 (2026-11-15 to 2026-11-18 on Vehicle 1)
    my_bookings = client.get("/bookings", headers=cust_headers).json()
    target = next(
        b
        for b in my_bookings
        if b["start_date"] == "2026-11-15" and b["vehicle_id"] == 1
    )

    # Return 2 days late (2026-11-20) with Minor Damage (₹2,500)
    ret_res = client.post(
        "/returns",
        headers=cust_headers,
        json={
            "booking_id": target["id"],
            "return_date": "2026-11-20",
            "condition": "Minor Damage",
            "notes": "Minor bumper scuff during parking.",
        },
    )
    assert ret_res.status_code == 201, ret_res.text
    ret_data = ret_res.json()["return_record"]
    assert ret_data["late_days"] == 2
    # Late fee = 2 * 3800 * 1.20 = 9120.0
    assert ret_data["late_fee"] == 9120.0
    assert ret_data["damage_fee"] == 2500.0
    # Final amount = 11400 + 9120 + 2500 = 23020.0
    assert ret_data["final_amount"] == 23020.0
    assert ret_res.json()["booking"]["status"] == "COMPLETED"

    # Check rental history contains this completed record
    hist_res = client.get("/history", headers=cust_headers)
    assert hist_res.status_code == 200
    hist_items = hist_res.json()
    matched_hist = next(
        h for h in hist_items if h["booking_id"] == target["id"]
    )
    assert matched_hist["amount"] == 23020.0
    assert matched_hist["booking_status"] == "COMPLETED"


def test_10_ai_recommendations_and_demand_analysis_and_reports():
    cust_headers = get_auth_headers("rahul@example.com", "Customer@123")
    admin_headers = get_auth_headers("admin@rental.com", "Admin@123")

    # 1. AI Recommendations for Customer 1
    rec_res = client.get("/recommendations/1", headers=cust_headers)
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert len(recs) >= 5
    # Verify sorted descending by score and explainable reason present
    assert recs[0]["score"] >= recs[1]["score"]
    assert "match —" in recs[0]["reason"]
    assert len(recs[0]["matching_factors"]) > 0

    # 2. Demand Analysis
    dem_res = client.get("/demand/analysis", headers=admin_headers)
    assert dem_res.status_code == 200
    dem = dem_res.json()
    assert dem["label"] == "Demand-oriented prediction"
    assert len(dem["demand_by_type"]) >= 5
    assert "predicted_demand" in dem["demand_by_type"][0]

    # 3. Reports Summary, Revenue, and Utilization
    rep_sum = client.get("/reports/summary", headers=admin_headers)
    assert rep_sum.status_code == 200
    assert rep_sum.json()["kpis"]["total_revenue"] > 0

    rep_rev = client.get("/reports/revenue", headers=admin_headers)
    assert rep_rev.status_code == 200
    assert rep_rev.json()["total_revenue"] > 0

    rep_util = client.get("/reports/utilization", headers=admin_headers)
    assert rep_util.status_code == 200
    assert "vehicle_utilization" in rep_util.json()

    # 4. Notifications
    notif_res = client.get("/notifications", headers=cust_headers)
    assert notif_res.status_code == 200
    assert len(notif_res.json()["notifications"]) >= 1
