from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.entities import (
    User,
    Customer,
    Vehicle,
    Booking,
    Payment,
    ReturnRecord,
    RentalHistory,
    Recommendation,
    Availability,
    Notification,
)
from app.auth.security import hash_password
from app.ai.recommender import generate_recommendations_for_customer


def seed_database(db: Session, force_reset: bool = False) -> dict:
    """
    Idempotently initializes schema and populates seed data in PostgreSQL.
    If force_reset=True, drops and recreates all tables before seeding.
    """
    if force_reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    existing_admin = (
        db.query(User).filter(User.email == "admin@rental.com").first()
    )
    if existing_admin and not force_reset:
        return {
            "seeded": False,
            "message": "Database already contains seeded records.",
            "users": db.query(User).count(),
            "vehicles": db.query(Vehicle).count(),
            "bookings": db.query(Booking).count(),
        }

    # Clear existing rows in dependency order if partial state
    db.query(Notification).delete()
    db.query(Availability).delete()
    db.query(Recommendation).delete()
    db.query(RentalHistory).delete()
    db.query(ReturnRecord).delete()
    db.query(Payment).delete()
    db.query(Booking).delete()
    db.query(Vehicle).delete()
    db.query(Customer).delete()
    db.query(User).delete()
    db.commit()

    admin_hash = hash_password("Admin@123")
    customer_hash = hash_password("Customer@123")

    # 1. Create Admin User
    admin_user = User(
        name="System Administrator",
        email="admin@rental.com",
        phone="+91-9876543210",
        password_hash=admin_hash,
        role="ADMIN",
        is_active=True,
    )
    db.add(admin_user)
    db.flush()

    # 2. Create 6 Customers with diverse preferences
    customer_specs = [
        {
            "name": "Rahul Sharma",
            "email": "rahul@example.com",
            "phone": "+91-9845012345",
            "type": "SUV",
            "trans": "Automatic",
            "fuel": "Diesel",
            "seats": 5,
            "budget": Decimal("4500.00"),
        },
        {
            "name": "Priya Nair",
            "email": "priya@example.com",
            "phone": "+91-9845023456",
            "type": "Electric",
            "trans": "Automatic",
            "fuel": "Electric",
            "seats": 5,
            "budget": Decimal("3800.00"),
        },
        {
            "name": "Arjun Mehta",
            "email": "arjun@example.com",
            "phone": "+91-9845034567",
            "type": "Sedan",
            "trans": "Automatic",
            "fuel": "Petrol",
            "seats": 5,
            "budget": Decimal("3200.00"),
        },
        {
            "name": "Sneha Reddy",
            "email": "sneha@example.com",
            "phone": "+91-9845045678",
            "type": "Hatchback",
            "trans": "Manual",
            "fuel": "Petrol",
            "seats": 5,
            "budget": Decimal("2200.00"),
        },
        {
            "name": "Vikram Singh",
            "email": "vikram@example.com",
            "phone": "+91-9845056789",
            "type": "Luxury",
            "trans": "Automatic",
            "fuel": "Petrol",
            "seats": 5,
            "budget": Decimal("9500.00"),
        },
        {
            "name": "Ananya Verma",
            "email": "ananya@example.com",
            "phone": "+91-9845067890",
            "type": "SUV",
            "trans": "Automatic",
            "fuel": "Petrol",
            "seats": 7,
            "budget": Decimal("5200.00"),
        },
    ]

    customers_list = []
    for spec in customer_specs:
        u = User(
            name=spec["name"],
            email=spec["email"],
            phone=spec["phone"],
            password_hash=customer_hash,
            role="CUSTOMER",
            is_active=True,
        )
        db.add(u)
        db.flush()
        c = Customer(
            user_id=u.id,
            preferred_vehicle_type=spec["type"],
            preferred_transmission=spec["trans"],
            preferred_fuel=spec["fuel"],
            preferred_seats=spec["seats"],
            budget_per_day=spec["budget"],
        )
        db.add(c)
        db.flush()
        customers_list.append(c)

    # 3. Create 12 Vehicles across SUV, Sedan, Hatchback, Luxury, Electric
    vehicle_specs = [
        {
            "vehicle_number": "KA-01-MJ-2024",
            "brand": "Hyundai",
            "model": "Creta SX(O)",
            "vehicle_type": "SUV",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Diesel",
            "seats": 5,
            "color": "Titan Grey",
            "daily_rate": Decimal("3800.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - HITEC City Hub",
            "image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=85",
            "description": "Premium 5-seater urban SUV featuring panoramic sunroof, ADAS Level 2 safety suite, ventilated seats, and Bose 8-speaker audio.",
        },
        {
            "vehicle_number": "KA-03-EV-9090",
            "brand": "Tata",
            "model": "Nexon EV Empowered+",
            "vehicle_type": "Electric",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Electric",
            "seats": 5,
            "color": "Empowered Oxide",
            "daily_rate": Decimal("3200.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Madhapur Hub",
            "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=85",
            "description": "Zero-emission long-range electric SUV with 465 km certified range, V2L charging, 360-degree camera, and arcade.ev infotainment.",
        },
        {
            "vehicle_number": "MH-02-AB-7788",
            "brand": "Mahindra",
            "model": "XUV700 AX7L",
            "vehicle_type": "SUV",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Diesel",
            "seats": 7,
            "color": "Midnight Black",
            "daily_rate": Decimal("4800.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - RGIA Shamshabad Airport",
            "image_url": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=85",
            "description": "Flagship 7-seater highway cruiser with twin HD superscreens, Skyroof, Sony 3D sound, and turbo-diesel automatic powertrain.",
        },
        {
            "vehicle_number": "KA-05-SD-4411",
            "brand": "Honda",
            "model": "City ZX CVT",
            "vehicle_type": "Sedan",
            "year": 2023,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Obsidian Blue",
            "daily_rate": Decimal("2700.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Banjara Hills Hub",
            "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=85",
            "description": "Executive compact sedan offering class-leading rear legroom, Honda Sensing ADAS, lane-watch camera, and refined i-VTEC engine.",
        },
        {
            "vehicle_number": "KA-04-HB-1122",
            "brand": "Maruti Suzuki",
            "model": "Baleno Alpha",
            "vehicle_type": "Hatchback",
            "year": 2024,
            "transmission": "Manual",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Nexa Blue",
            "daily_rate": Decimal("1800.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Gachibowli Hub",
            "image_url": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=85",
            "description": "Fuel-efficient premium hatchback with Heads-Up Display (HUD), 360-view camera, 6 airbags, and agile city handling.",
        },
        {
            "vehicle_number": "DL-01-LX-9999",
            "brand": "BMW",
            "model": "3 Series Gran Limousine",
            "vehicle_type": "Luxury",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Mineral White",
            "daily_rate": Decimal("8500.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Jubilee Hills Luxury Lounge",
            "image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=85",
            "description": "Chauffeur-grade luxury sports sedan with extended wheelbase, BMW Curved Display, Harman Kardon surround, and TwinPower Turbo.",
        },
        {
            "vehicle_number": "KA-02-SD-5566",
            "brand": "Volkswagen",
            "model": "Virtus GT Plus",
            "vehicle_type": "Sedan",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Wild Cherry Red",
            "daily_rate": Decimal("3100.00"),
            "status": "RENTED",
            "location": "Hyderabad - HITEC City Hub",
            "image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=900&q=85",
            "description": "Enthusiast 1.5L TSI EVO performance sedan with 7-speed DSG dual-clutch transmission, 5-star Global NCAP safety, and ventilated leather seats.",
        },
        {
            "vehicle_number": "KA-01-EV-4040",
            "brand": "MG",
            "model": "ZS EV Exclusive Pro",
            "vehicle_type": "Electric",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Electric",
            "seats": 5,
            "color": "Glaze Red",
            "daily_rate": Decimal("3600.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Financial District Hub",
            "image_url": "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=85",
            "description": "Connected electric crossover with 50.3 kWh battery pack, autonomous Level-2 ADAS, panoramic sky roof, and i-SMART digital key.",
        },
        {
            "vehicle_number": "MH-12-SUV-3344",
            "brand": "Toyota",
            "model": "Innova Hycross ZX(O)",
            "vehicle_type": "SUV",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Hybrid",
            "seats": 7,
            "color": "Pearl White",
            "daily_rate": Decimal("5200.00"),
            "status": "BOOKED",
            "location": "Hyderabad - RGIA Shamshabad Airport",
            "image_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=85",
            "description": "Self-charging strong hybrid 7-seater MPV/SUV with powered Ottoman captain seats, Toyota Safety Sense, and ultra-quiet cabin.",
        },
        {
            "vehicle_number": "KA-05-HB-8877",
            "brand": "Hyundai",
            "model": "i20 N Line N8",
            "vehicle_type": "Hatchback",
            "year": 2023,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Thunder Blue",
            "daily_rate": Decimal("2200.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Madhapur Hub",
            "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
            "description": "Sport-tuned hot hatchback with 1.0L Turbo GDi engine, 7-speed DCT with paddle shifters, sporty exhaust note, and chequered leatherette.",
        },
        {
            "vehicle_number": "KA-01-LX-7000",
            "brand": "Mercedes-Benz",
            "model": "C-Class C200",
            "vehicle_type": "Luxury",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Selenite Grey",
            "daily_rate": Decimal("9200.00"),
            "status": "AVAILABLE",
            "location": "Hyderabad - Jubilee Hills Luxury Lounge",
            "image_url": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=85",
            "description": "Baby S-Class luxury saloon with 11.9-inch portrait MBUX OLED touchscreen, 64-color ambient lighting, and mild-hybrid EQ Boost.",
        },
        {
            "vehicle_number": "KA-03-SUV-6161",
            "brand": "Kia",
            "model": "Seltos GTX+ Turbo",
            "vehicle_type": "SUV",
            "year": 2024,
            "transmission": "Automatic",
            "fuel_type": "Petrol",
            "seats": 5,
            "color": "Pewter Olive",
            "daily_rate": Decimal("3900.00"),
            "status": "MAINTENANCE",
            "location": "Hyderabad - Gachibowli Hub",
            "image_url": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=85",
            "description": "Feature-packed mid-size SUV with dual-pane panoramic sunroof, dual 10.25-inch displays, ADAS 17 autonomous features, and 160 PS turbo engine.",
        },
    ]

    vehicles_list = []
    for vs in vehicle_specs:
        v = Vehicle(**vs)
        db.add(v)
        db.flush()
        vehicles_list.append(v)

    # 4. Create 16 Bookings (13 COMPLETED, 1 ACTIVE, 1 CONFIRMED, 1 CANCELLED)
    booking_Seed_rows = [
        # (ref, cust_idx, veh_idx, start, end, status, method, return_date, condition, notes)
        ("VR-2026-1001", 0, 0, date(2026, 5, 5), date(2026, 5, 9), "COMPLETED", "UPI", date(2026, 5, 9), "Good", "Returned on time in clean condition."),
        ("VR-2026-1002", 1, 1, date(2026, 5, 12), date(2026, 5, 15), "COMPLETED", "CARD", date(2026, 5, 15), "Good", "Battery at 65%, no issues."),
        ("VR-2026-1003", 2, 3, date(2026, 6, 1), date(2026, 6, 5), "COMPLETED", "DEMO", date(2026, 6, 6), "Good", "Returned 1 day late due to highway traffic."),
        ("VR-2026-1004", 3, 4, date(2026, 6, 10), date(2026, 6, 13), "COMPLETED", "UPI", date(2026, 6, 13), "Good", "Routine inspection passed."),
        ("VR-2026-1005", 4, 5, date(2026, 6, 18), date(2026, 6, 21), "COMPLETED", "CARD", date(2026, 6, 21), "Minor Damage", "Small scratch on front left alloy rim."),
        ("VR-2026-1006", 0, 2, date(2026, 7, 2), date(2026, 7, 7), "COMPLETED", "UPI", date(2026, 7, 7), "Good", "Clean interior and exterior."),
        ("VR-2026-1007", 5, 8, date(2026, 7, 14), date(2026, 7, 18), "COMPLETED", "CARD", date(2026, 7, 18), "Good", "Returned at Airport Hub on schedule."),
        ("VR-2026-1008", 1, 7, date(2026, 7, 22), date(2026, 7, 25), "COMPLETED", "DEMO", date(2026, 7, 25), "Good", "No issues reported."),
        ("VR-2026-1009", 0, 0, date(2026, 8, 4), date(2026, 8, 8), "COMPLETED", "UPI", date(2026, 8, 8), "Good", "Repeat customer, immaculate condition."),
        ("VR-2026-1010", 2, 6, date(2026, 8, 12), date(2026, 8, 16), "COMPLETED", "CASH", date(2026, 8, 17), "Good", "1 day extension billed at standard late rate."),
        ("VR-2026-1011", 4, 10, date(2026, 8, 20), date(2026, 8, 23), "COMPLETED", "CARD", date(2026, 8, 23), "Good", "VIP luxury return completed."),
        ("VR-2026-1012", 3, 9, date(2026, 9, 2), date(2026, 9, 5), "COMPLETED", "UPI", date(2026, 9, 5), "Good", "All checks normal."),
        ("VR-2026-1013", 0, 6, date(2026, 9, 26), date(2026, 9, 30), "ACTIVE", "DEMO", None, None, None),
        ("VR-2026-1014", 1, 8, date(2026, 10, 5), date(2026, 10, 9), "CONFIRMED", "UPI", None, None, None),
        ("VR-2026-1015", 2, 3, date(2026, 9, 10), date(2026, 9, 12), "CANCELLED", "CARD", None, None, None),
        ("VR-2026-1016", 5, 2, date(2026, 9, 15), date(2026, 9, 19), "COMPLETED", "DEMO", date(2026, 9, 19), "Good", "Completed smoothly."),
    ]

    for idx, row in enumerate(booking_Seed_rows, start=1):
        ref, c_idx, v_idx, s_dt, e_dt, b_status, pay_method, ret_dt, cond, notes = row
        cust = customers_list[c_idx]
        veh = vehicles_list[v_idx]
        days = (e_dt - s_dt).days
        rate = Decimal(str(veh.daily_rate))
        subtotal = (rate * Decimal(days)).quantize(Decimal("0.01"))

        booking = Booking(
            booking_reference=ref,
            customer_id=cust.id,
            vehicle_id=veh.id,
            start_date=s_dt,
            end_date=e_dt,
            total_days=days,
            daily_rate=rate,
            subtotal=subtotal,
            status=b_status,
        )
        db.add(booking)
        db.flush()

        p_status = "REFUNDED" if b_status == "CANCELLED" else "PAID"
        payment = Payment(
            booking_id=booking.id,
            amount=subtotal,
            payment_method=pay_method,
            payment_status=p_status,
            transaction_reference=f"TXN-{pay_method}-{s_dt.strftime('%Y%m%d')}-{idx:02d}",
        )
        db.add(payment)
        db.flush()

        if b_status == "COMPLETED" and ret_dt is not None:
            late_days = max(0, (ret_dt - e_dt).days)
            late_fee = (Decimal(late_days) * rate * Decimal("1.20")).quantize(
                Decimal("0.01")
            )
            damage_fee = (
                Decimal("2500.00")
                if cond == "Minor Damage"
                else (
                    Decimal("8500.00")
                    if cond == "Major Damage"
                    else Decimal("0.00")
                )
            )
            final_amt = (subtotal + late_fee + damage_fee).quantize(Decimal("0.01"))

            ret = ReturnRecord(
                booking_id=booking.id,
                vehicle_id=veh.id,
                return_date=ret_dt,
                condition=cond,
                late_days=late_days,
                late_fee=late_fee,
                damage_fee=damage_fee,
                final_amount=final_amt,
                notes=notes,
            )
            db.add(ret)

            hist = RentalHistory(
                customer_id=cust.id,
                vehicle_id=veh.id,
                booking_id=booking.id,
                rented_from=s_dt,
                rented_to=ret_dt,
                amount=final_amt,
            )
            db.add(hist)

    # 5. Availability Windows
    for v in vehicles_list:
        if v.status == "RENTED":
            db.add(
                Availability(
                    vehicle_id=v.id,
                    available_from=date(2026, 9, 26),
                    available_to=date(2026, 9, 30),
                    status="RENTED",
                )
            )
        elif v.status == "BOOKED":
            db.add(
                Availability(
                    vehicle_id=v.id,
                    available_from=date(2026, 10, 5),
                    available_to=date(2026, 10, 9),
                    status="BOOKED",
                )
            )
        elif v.status == "MAINTENANCE":
            db.add(
                Availability(
                    vehicle_id=v.id,
                    available_from=date(2026, 9, 25),
                    available_to=date(2026, 10, 5),
                    status="MAINTENANCE",
                )
            )
        else:
            db.add(
                Availability(
                    vehicle_id=v.id,
                    available_from=date(2026, 9, 1),
                    available_to=date(2026, 12, 31),
                    status="AVAILABLE",
                )
            )

    # 6. Sample Notifications
    rahul_user_id = customers_list[0].user_id
    priya_user_id = customers_list[1].user_id
    db.add_all(
        [
            Notification(
                user_id=rahul_user_id,
                type="BOOKING_ACTIVE",
                title="Active Rental in Progress",
                message="Your rental for Volkswagen Virtus GT Plus (Booking #VR-2026-1013) is currently active until 2026-09-30.",
                is_read=False,
            ),
            Notification(
                user_id=rahul_user_id,
                type="AI_RECOMMENDATION",
                title="AI Recommendations Updated",
                message="Our AI engine found a 100% match for your SUV preference: Hyundai Creta SX(O) at ₹3,800/day.",
                is_read=False,
            ),
            Notification(
                user_id=priya_user_id,
                type="BOOKING_CONFIRMED",
                title="Upcoming Booking Confirmed",
                message="Your booking #VR-2026-1014 for Toyota Innova Hycross ZX(O) (2026-10-05 to 2026-10-09) is confirmed and paid.",
                is_read=False,
            ),
            Notification(
                user_id=admin_user.id,
                type="SYSTEM_ALERT",
                title="Fleet Maintenance Scheduled",
                message="Kia Seltos GTX+ Turbo (KA-03-SUV-6161) is marked as MAINTENANCE at Whitefield Hub.",
                is_read=False,
            ),
        ]
    )

    db.commit()

    # 7. Generate AI Recommendations for all seeded customers using the live AI Engine
    for c in customers_list:
        generate_recommendations_for_customer(db, c.id, persist=True)

    return {
        "seeded": True,
        "users": db.query(User).count(),
        "customers": db.query(Customer).count(),
        "vehicles": db.query(Vehicle).count(),
        "bookings": db.query(Booking).count(),
        "payments": db.query(Payment).count(),
        "returns": db.query(ReturnRecord).count(),
        "rental_history": db.query(RentalHistory).count(),
        "recommendations": db.query(Recommendation).count(),
        "notifications": db.query(Notification).count(),
    }


if __name__ == "__main__":
    db_sess = SessionLocal()
    try:
        summary = seed_database(db_sess, force_reset=True)
        print("Database seeded successfully:", summary)
    finally:
        db_sess.close()
