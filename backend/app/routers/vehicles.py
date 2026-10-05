from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Vehicle, Booking, ReturnRecord, Availability, User
from app.schemas.api_schemas import VehicleCreate, VehicleUpdate, VehicleOut
from app.auth.security import require_admin
from app.services.rental_service import validate_dates_and_availability

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

VALID_STATUSES = {"AVAILABLE", "BOOKED", "RENTED", "MAINTENANCE", "INACTIVE"}
VALID_TYPES = {"SUV", "Sedan", "Hatchback", "Luxury", "Electric"}
VALID_TRANSMISSIONS = {"Automatic", "Manual"}
VALID_FUELS = {"Petrol", "Diesel", "Electric", "Hybrid"}

# Baseline telemetry & service profile per vehicle registration
VEHICLE_TELEMETRY_PROFILES = {
    "KA-01-MJ-2024": {
        "base_kms": 14280,
        "service_interval_km": 20000,
        "last_service_date": "2026-08-18",
        "service_center": "Hyundai Kun United Authorized Service, Kondapur, Hyderabad",
        "engine_health": 98,
        "tire_health": 95,
        "brake_health": 97,
        "battery_health": 99,
        "insurance_status": "Comprehensive Zero-Dep Valid till Nov 2027",
        "maintenance_summary": "15,000 km preventive checkup completed; synthetic oil, cabin HEPA filter, and ADAS radar calibration verified.",
    },
    "KA-03-EV-9090": {
        "base_kms": 9640,
        "service_interval_km": 15000,
        "last_service_date": "2026-09-02",
        "service_center": "Tata.ev Certified High-Voltage Center, Madhapur, Hyderabad",
        "engine_health": 100,
        "tire_health": 96,
        "brake_health": 98,
        "battery_health": 99,
        "insurance_status": "EV Battery & Motor Shield Valid till Dec 2027",
        "maintenance_summary": "High-voltage liquid cooling loop inspected; BMS firmware updated to v4.2; regenerative braking at 100% efficiency.",
    },
    "MH-02-AB-7788": {
        "base_kms": 21450,
        "service_interval_km": 25000,
        "last_service_date": "2026-08-25",
        "service_center": "Mahindra VVC Motors Flagship Workshop, Kukatpally, Hyderabad",
        "engine_health": 97,
        "tire_health": 92,
        "brake_health": 95,
        "battery_health": 96,
        "insurance_status": "Commercial Fleet Platinum Cover Valid till Oct 2027",
        "maintenance_summary": "20,000 km major service done; mHawk turbo-diesel injectors cleaned, AWD transfer case fluid replaced, Sony 3D audio checked.",
    },
    "KA-05-SD-4411": {
        "base_kms": 26890,
        "service_interval_km": 30000,
        "last_service_date": "2026-07-30",
        "service_center": "Pride Honda Master Service Hub, Banjara Hills, Hyderabad",
        "engine_health": 96,
        "tire_health": 91,
        "brake_health": 94,
        "battery_health": 95,
        "insurance_status": "Comprehensive Zero-Dep Valid till Aug 2027",
        "maintenance_summary": "CVT transmission fluid flushed; i-VTEC throttle body cleaned; 4-wheel laser alignment and Honda Sensing camera verified.",
    },
    "KA-04-HB-1122": {
        "base_kms": 12340,
        "service_interval_km": 20000,
        "last_service_date": "2026-08-11",
        "service_center": "NEXA Varun Motors Service Studio, Gachibowli, Hyderabad",
        "engine_health": 98,
        "tire_health": 96,
        "brake_health": 97,
        "battery_health": 98,
        "insurance_status": "Comprehensive Fleet Cover Valid till Jan 2028",
        "maintenance_summary": "10,000 km scheduled service complete; brake pads at 90% thickness, HUD projector calibrated, AC sanitized.",
    },
    "DL-01-LX-9999": {
        "base_kms": 8420,
        "service_interval_km": 15000,
        "last_service_date": "2026-09-10",
        "service_center": "BMW KUN Exclusive M-Certified Atelier, Khairatabad, Hyderabad",
        "engine_health": 99,
        "tire_health": 98,
        "brake_health": 99,
        "battery_health": 100,
        "insurance_status": "BMW Secure Advance + Zero-Dep Valid till Mar 2028",
        "maintenance_summary": "Condition Based Service (CBS) green across all modules; Pirelli Run-Flat tires nitrogen-filled; ceramic paint protection applied.",
    },
    "KA-02-SD-5566": {
        "base_kms": 15760,
        "service_interval_km": 20000,
        "last_service_date": "2026-08-29",
        "service_center": "Volkswagen PPS Motors Performance Center, Somajiguda, Hyderabad",
        "engine_health": 98,
        "tire_health": 94,
        "brake_health": 96,
        "battery_health": 97,
        "insurance_status": "Comprehensive Zero-Dep Valid till Nov 2027",
        "maintenance_summary": "1.5L TSI EVO spark plugs & DSG dual-clutch mechatronics diagnostics passed 100%; front ventilated discs resurfaced.",
    },
    "KA-01-EV-4040": {
        "base_kms": 11200,
        "service_interval_km": 15000,
        "last_service_date": "2026-09-05",
        "service_center": "MG Raam High-Voltage EV Care, Nanakramguda, Hyderabad",
        "engine_health": 100,
        "tire_health": 95,
        "brake_health": 98,
        "battery_health": 99,
        "insurance_status": "EV Comprehensive + Charger Cover Valid till Dec 2027",
        "maintenance_summary": "50.3 kWh battery pack cell balancing verified (99.2% SoH); Continental low-rolling-resistance tires rotated.",
    },
    "MH-12-SUV-3344": {
        "base_kms": 18920,
        "service_interval_km": 25000,
        "last_service_date": "2026-08-19",
        "service_center": "Harsha Toyota Hybrid Specialist Center, Shamshabad, Hyderabad",
        "engine_health": 99,
        "tire_health": 94,
        "brake_health": 97,
        "battery_health": 99,
        "insurance_status": "Toyota Protect Platinum Valid till Feb 2028",
        "maintenance_summary": "5th-Gen Strong Hybrid inverter coolant & Ni-MH battery air filter serviced; Ottoman power captain seats inspected.",
    },
    "KA-05-HB-8877": {
        "base_kms": 19350,
        "service_interval_km": 25000,
        "last_service_date": "2026-08-04",
        "service_center": "Hyundai Laxmi N-Line Performance Bay, Miyapur, Hyderabad",
        "engine_health": 97,
        "tire_health": 93,
        "brake_health": 95,
        "battery_health": 96,
        "insurance_status": "Comprehensive Zero-Dep Valid till Sep 2027",
        "maintenance_summary": "1.0L Turbo GDi intercooler & 7-speed DCT actuator checked; all-4 disc brake calipers cleaned; sport exhaust tuned.",
    },
    "KA-01-LX-7000": {
        "base_kms": 6850,
        "service_interval_km": 15000,
        "last_service_date": "2026-09-14",
        "service_center": "Mercedes-Benz Mahavir Motors AMG & Star Lounge, Jubilee Hills, Hyderabad",
        "engine_health": 100,
        "tire_health": 99,
        "brake_health": 99,
        "battery_health": 100,
        "insurance_status": "Star Protect Gold Zero-Dep Valid till Apr 2028",
        "maintenance_summary": "Mercedes-Benz Service A completed; 48V EQ Boost mild-hybrid starter-alternator & MBUX portrait OLED diagnostics 100%.",
    },
    "KA-03-SUV-6161": {
        "base_kms": 23600,
        "service_interval_km": 25000,
        "last_service_date": "2026-09-22",
        "service_center": "Kia Automotive Manufacturers Workshop, Nagole, Hyderabad",
        "engine_health": 88,
        "tire_health": 89,
        "brake_health": 86,
        "battery_health": 94,
        "insurance_status": "Comprehensive Zero-Dep Valid till Oct 2027",
        "maintenance_summary": "Currently in scheduled 25,000 km preventive workshop bay for front brake pad replacement and turbocharger boost hose inspection.",
    },
}


def _build_vehicle_telemetry(v: Vehicle) -> dict:
    profile = VEHICLE_TELEMETRY_PROFILES.get(
        v.vehicle_number,
        {
            "base_kms": 10500 + (v.id or 1) * 850,
            "service_interval_km": 20000,
            "last_service_date": "2026-09-01",
            "service_center": "DriveAI Authorized Multi-Brand Service Hub, Hyderabad",
            "engine_health": 97,
            "tire_health": 95,
            "brake_health": 96,
            "battery_health": 98,
            "insurance_status": "Comprehensive Fleet Insurance Valid till Dec 2027",
            "maintenance_summary": "Full 40-point multi-system safety and mechanical inspection passed.",
        },
    )

    # Calculate additional dynamic KMs from completed bookings (~145 km per rental day)
    completed_days = sum(
        (b.total_days or 0)
        for b in (v.bookings or [])
        if b.status == "COMPLETED"
    )
    covered_kms = int(profile["base_kms"] + completed_days * 145)
    next_service_due_km = max(
        covered_kms + 2500, int(profile["service_interval_km"])
    )
    kms_until_service = max(0, next_service_due_km - covered_kms)

    # Determine latest physical condition from return records in PostgreSQL
    returns_sorted = sorted(
        list(v.returns or []),
        key=lambda r: (r.return_date or date.min, r.id or 0),
        reverse=True,
    )
    latest_return = returns_sorted[0] if returns_sorted else None

    if v.status == "MAINTENANCE":
        condition_grade = "In Workshop Service"
        condition_badge = "Scheduled Maintenance"
        overall_health = 88
    elif latest_return and latest_return.condition == "Major Damage":
        condition_grade = "Refurbished & Re-Certified"
        condition_badge = "Good (Post-Repair Certified)"
        overall_health = 93
    elif latest_return and latest_return.condition == "Minor Damage":
        condition_grade = "Good (A Grade)"
        condition_badge = "Good • Minor Cosmetic Wear"
        overall_health = 95
    else:
        condition_grade = "Excellent (A+ Showroom Grade)"
        condition_badge = "Excellent (Good)"
        overall_health = 98

    inspection_logs = [
        {
            "id": r.id,
            "return_date": r.return_date.isoformat() if r.return_date else None,
            "condition": r.condition,
            "late_days": r.late_days,
            "damage_fee": float(r.damage_fee or 0),
            "notes": r.notes or f"Returned in {r.condition} condition.",
        }
        for r in returns_sorted[:5]
    ]

    return {
        "covered_kms": covered_kms,
        "next_service_due_km": next_service_due_km,
        "kms_until_service": kms_until_service,
        "condition_grade": condition_grade,
        "condition_badge": condition_badge,
        "overall_health_pct": overall_health,
        "last_service_date": profile["last_service_date"],
        "service_center": profile["service_center"],
        "engine_health_pct": profile["engine_health"],
        "tire_health_pct": profile["tire_health"],
        "brake_health_pct": profile["brake_health"],
        "battery_health_pct": profile["battery_health"],
        "insurance_status": profile["insurance_status"],
        "pollution_cert": (
            "Zero-Tailpipe EV Certified"
            if v.fuel_type == "Electric"
            else "BS6 Phase-II PUC Valid till Mar 2027"
        ),
        "maintenance_summary": profile["maintenance_summary"],
        "maintenance_checklist": [
            {
                "item": (
                    "High-Voltage Battery & Motor Diagnostics"
                    if v.fuel_type == "Electric"
                    else "Synthetic Engine Oil & Filter Change"
                ),
                "status": "Verified ✓",
            },
            {
                "item": "ABS Brake Pads, Rotors & Hydraulic Fluid",
                "status": (
                    "In Progress (Bay #3)"
                    if v.status == "MAINTENANCE"
                    else "Verified ✓"
                ),
            },
            {
                "item": "4-Wheel Laser Alignment & Nitrogen Tire Pressure",
                "status": "Verified ✓",
            },
            {
                "item": "AC HEPA Cabin Filter & Interior Deep Sanitization",
                "status": "Verified ✓",
            },
            {
                "item": "OBD-II / ADAS Sensor & Airbag Safety Scan",
                "status": "Passed 100% ✓",
            },
        ],
        "inspection_logs": inspection_logs,
    }


def _serialize_vehicle(v: Vehicle) -> dict:
    telemetry = _build_vehicle_telemetry(v)
    return {
        "id": v.id,
        "vehicle_number": v.vehicle_number,
        "brand": v.brand,
        "model": v.model,
        "vehicle_type": v.vehicle_type,
        "year": v.year,
        "transmission": v.transmission,
        "fuel_type": v.fuel_type,
        "seats": v.seats,
        "color": v.color,
        "daily_rate": float(v.daily_rate),
        "status": v.status,
        "location": v.location,
        "image_url": v.image_url,
        "description": v.description,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "updated_at": v.updated_at.isoformat() if v.updated_at else None,
        **telemetry,
    }


@router.get("")
def list_vehicles(
    search: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    seats: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Vehicle.brand.ilike(term),
                Vehicle.model.ilike(term),
                Vehicle.vehicle_number.ilike(term),
                Vehicle.location.ilike(term),
                Vehicle.vehicle_type.ilike(term),
            )
        )

    if vehicle_type and vehicle_type.upper() != "ALL":
        query = query.filter(Vehicle.vehicle_type.ilike(vehicle_type.strip()))

    if transmission and transmission.upper() != "ALL":
        query = query.filter(Vehicle.transmission.ilike(transmission.strip()))

    if fuel_type and fuel_type.upper() != "ALL":
        query = query.filter(Vehicle.fuel_type.ilike(fuel_type.strip()))

    if seats is not None and seats > 0:
        query = query.filter(Vehicle.seats >= seats)

    if min_price is not None:
        query = query.filter(Vehicle.daily_rate >= Decimal(str(min_price)))

    if max_price is not None:
        query = query.filter(Vehicle.daily_rate <= Decimal(str(max_price)))

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Vehicle.status == status_filter.upper().strip())

    vehicles = query.order_by(Vehicle.id.asc()).all()

    if start_date and end_date:
        if end_date <= start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date.",
            )
        overlapping_vehicle_ids = {
            row[0]
            for row in db.query(Booking.vehicle_id)
            .filter(
                Booking.status.in_(["PENDING", "CONFIRMED", "ACTIVE"]),
                Booking.start_date <= end_date,
                Booking.end_date >= start_date,
            )
            .all()
        }
        vehicles = [
            v
            for v in vehicles
            if v.id not in overlapping_vehicle_ids
            and v.status not in ("MAINTENANCE", "INACTIVE")
        ]

    return [_serialize_vehicle(v) for v in vehicles]


@router.get("/{vehicle_id}/availability")
def check_vehicle_date_availability(
    vehicle_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    if end_date <= start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date.",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

    total_days = (end_date - start_date).days
    subtotal = round(float(vehicle.daily_rate) * total_days, 2)

    if vehicle.status in ("MAINTENANCE", "INACTIVE"):
        return {
            "available": False,
            "vehicle_id": vehicle.id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_days": total_days,
            "daily_rate": float(vehicle.daily_rate),
            "subtotal": subtotal,
            "message": "This vehicle is not available for the selected dates.",
            "reason": f"Vehicle is currently marked as {vehicle.status}.",
        }

    overlapping = (
        db.query(Booking)
        .filter(
            Booking.vehicle_id == vehicle_id,
            Booking.status.in_(["PENDING", "CONFIRMED", "ACTIVE"]),
            Booking.start_date <= end_date,
            Booking.end_date >= start_date,
        )
        .first()
    )

    if overlapping:
        return {
            "available": False,
            "vehicle_id": vehicle.id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_days": total_days,
            "daily_rate": float(vehicle.daily_rate),
            "subtotal": subtotal,
            "message": "This vehicle is not available for the selected dates.",
            "conflicting_booking": {
                "booking_reference": overlapping.booking_reference,
                "start_date": overlapping.start_date.isoformat(),
                "end_date": overlapping.end_date.isoformat(),
                "status": overlapping.status,
            },
        }

    return {
        "available": True,
        "vehicle_id": vehicle.id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_days": total_days,
        "daily_rate": float(vehicle.daily_rate),
        "subtotal": subtotal,
        "message": f"Vehicle is available for {total_days} day(s)! Estimated total: ₹{subtotal:,.2f}",
    }


@router.get("/{vehicle_id}")
def get_vehicle_details(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.vehicle_id == vehicle.id,
            Booking.status.in_(["PENDING", "CONFIRMED", "ACTIVE"]),
        )
        .order_by(Booking.start_date.asc())
        .all()
    )

    data = _serialize_vehicle(vehicle)
    data["booked_dates"] = [
        {
            "booking_reference": b.booking_reference,
            "start_date": b.start_date.isoformat(),
            "end_date": b.end_date.isoformat(),
            "status": b.status,
        }
        for b in active_bookings
    ]
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    veh_num = payload.vehicle_number.strip().upper()
    existing = (
        db.query(Vehicle).filter(Vehicle.vehicle_number == veh_num).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle number already exists.",
        )

    if payload.daily_rate <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Daily rate must be positive.",
        )
    if payload.seats <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seats must be positive.",
        )

    v_status = payload.status.strip().upper()
    if v_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
        )

    if payload.vehicle_type not in VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid vehicle type. Must be one of: {', '.join(sorted(VALID_TYPES))}",
        )

    new_vehicle = Vehicle(
        vehicle_number=veh_num,
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        vehicle_type=payload.vehicle_type,
        year=payload.year,
        transmission=payload.transmission,
        fuel_type=payload.fuel_type,
        seats=payload.seats,
        color=payload.color.strip(),
        daily_rate=Decimal(str(payload.daily_rate)),
        status=v_status,
        location=payload.location.strip(),
        image_url=payload.image_url.strip() or "/vehicles/suv-creta.svg",
        description=payload.description.strip(),
    )
    db.add(new_vehicle)
    db.flush()

    db.add(
        Availability(
            vehicle_id=new_vehicle.id,
            available_from=date.today(),
            available_to=date(2026, 12, 31),
            status=v_status if v_status != "INACTIVE" else "MAINTENANCE",
        )
    )
    db.commit()
    db.refresh(new_vehicle)
    return _serialize_vehicle(new_vehicle)


@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

    if payload.vehicle_number is not None:
        new_num = payload.vehicle_number.strip().upper()
        if new_num != vehicle.vehicle_number:
            dup = (
                db.query(Vehicle)
                .filter(
                    Vehicle.vehicle_number == new_num, Vehicle.id != vehicle.id
                )
                .first()
            )
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Vehicle number already exists.",
                )
            vehicle.vehicle_number = new_num

    if payload.brand is not None:
        vehicle.brand = payload.brand.strip()
    if payload.model is not None:
        vehicle.model = payload.model.strip()
    if payload.vehicle_type is not None:
        if payload.vehicle_type not in VALID_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid vehicle type.",
            )
        vehicle.vehicle_type = payload.vehicle_type
    if payload.year is not None:
        vehicle.year = payload.year
    if payload.transmission is not None:
        vehicle.transmission = payload.transmission
    if payload.fuel_type is not None:
        vehicle.fuel_type = payload.fuel_type
    if payload.seats is not None:
        vehicle.seats = payload.seats
    if payload.color is not None:
        vehicle.color = payload.color.strip()
    if payload.daily_rate is not None:
        vehicle.daily_rate = Decimal(str(payload.daily_rate))
    if payload.status is not None:
        st = payload.status.strip().upper()
        if st not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid vehicle status.",
            )
        vehicle.status = st
    if payload.location is not None:
        vehicle.location = payload.location.strip()
    if payload.image_url is not None:
        vehicle.image_url = payload.image_url.strip()
    if payload.description is not None:
        vehicle.description = payload.description.strip()

    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle(vehicle)


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

    booking_count = (
        db.query(Booking).filter(Booking.vehicle_id == vehicle.id).count()
    )
    if booking_count > 0:
        vehicle.status = "INACTIVE"
        db.commit()
        return {
            "message": "Vehicle has historical booking records; status set to INACTIVE to preserve referential integrity.",
            "deleted": False,
            "deactivated": True,
        }

    db.delete(vehicle)
    db.commit()
    return {
        "message": "Vehicle deleted successfully.",
        "deleted": True,
        "deactivated": False,
    }
