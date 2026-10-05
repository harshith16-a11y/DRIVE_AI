from datetime import date, datetime, timezone
from decimal import Decimal
import uuid
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.entities import (
    User,
    Customer,
    Vehicle,
    Booking,
    Payment,
    ReturnRecord,
    RentalHistory,
    Availability,
    Notification,
)

DAMAGE_FEE_SCHEDULE = {
    "Good": Decimal("0.00"),
    "Minor Damage": Decimal("2500.00"),
    "Major Damage": Decimal("8500.00"),
}


def validate_dates_and_availability(
    db: Session,
    vehicle_id: int,
    start_date: date,
    end_date: date,
    exclude_booking_id: Optional[int] = None,
) -> Tuple[Vehicle, int, Decimal]:
    """
    Validates:
    1. end_date > start_date
    2. Vehicle exists and is not INACTIVE or in MAINTENANCE
    3. No overlapping active/confirmed/pending bookings exist for the date window
    Returns (vehicle, total_days, subtotal).
    """
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

    if vehicle.status in ("MAINTENANCE", "INACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This vehicle is not available for the selected dates.",
        )

    overlap_query = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_(["PENDING", "CONFIRMED", "ACTIVE"]),
        Booking.start_date <= end_date,
        Booking.end_date >= start_date,
    )
    if exclude_booking_id is not None:
        overlap_query = overlap_query.filter(Booking.id != exclude_booking_id)

    overlapping_booking = overlap_query.first()
    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This vehicle is not available for the selected dates.",
        )

    total_days = (end_date - start_date).days
    daily_rate = Decimal(str(vehicle.daily_rate))
    subtotal = (daily_rate * Decimal(total_days)).quantize(Decimal("0.01"))
    return vehicle, total_days, subtotal


def generate_booking_reference(db: Session) -> str:
    count = db.query(Booking).count() + 1001
    suffix = uuid.uuid4().hex[:4].upper()
    return f"VR-2026-{count}-{suffix}"


def generate_transaction_reference(method: str) -> str:
    prefix = {
        "UPI": "UPI",
        "CARD": "CRD",
        "CASH": "CSH",
        "DEMO": "DMO",
    }.get(method.upper(), "DMO")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    rand = uuid.uuid4().hex[:5].upper()
    return f"TXN-{prefix}-{stamp}-{rand}"


def execute_transactional_booking_and_payment(
    db: Session,
    customer: Customer,
    vehicle_id: int,
    start_date: date,
    end_date: date,
    payment_method: str = "DEMO",
    simulate_failure: bool = False,
) -> Dict[str, Any]:
    """
    Demonstrates full ACID Transaction handling (BEGIN -> operations -> COMMIT / ROLLBACK):
    1. Check vehicle availability
    2. Check overlapping bookings
    3. Insert booking
    4. Insert payment
    5. Update vehicle status & availability
    6. Insert notification
    7. Commit (or ROLLBACK if any step fails or simulate_failure is True)
    """
    method = payment_method.upper()
    if method not in ("UPI", "CARD", "CASH", "DEMO"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method. Choose UPI, CARD, CASH, or DEMO.",
        )

    try:
        # Step 1 & 2: Validate dates, vehicle status, and overlapping bookings
        vehicle, total_days, subtotal = validate_dates_and_availability(
            db, vehicle_id, start_date, end_date
        )

        # Step 3: Insert Booking (flushed inside transaction, not yet committed)
        booking_ref = generate_booking_reference(db)
        today = date.today()
        new_booking_status = "ACTIVE" if start_date <= today <= end_date else "CONFIRMED"

        booking = Booking(
            booking_reference=booking_ref,
            customer_id=customer.id,
            vehicle_id=vehicle.id,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            daily_rate=vehicle.daily_rate,
            subtotal=subtotal,
            status=new_booking_status,
        )
        db.add(booking)
        db.flush()  # Assigns booking.id inside open transaction

        # Step 4: Insert Payment
        txn_ref = generate_transaction_reference(method)
        payment = Payment(
            booking_id=booking.id,
            amount=subtotal,
            payment_method=method,
            payment_status="PAID",
            transaction_reference=txn_ref,
        )
        db.add(payment)
        db.flush()

        # Step 5: Update Vehicle status & insert Availability window
        vehicle.status = "RENTED" if new_booking_status == "ACTIVE" else "BOOKED"
        avail = Availability(
            vehicle_id=vehicle.id,
            available_from=start_date,
            available_to=end_date,
            status=vehicle.status,
        )
        db.add(avail)
        db.flush()

        # Step 6: Insert Notification for customer
        notif = Notification(
            user_id=customer.user_id,
            type="BOOKING_CONFIRMED",
            title="Booking Confirmed & Payment Successful",
            message=(
                f"Booking {booking_ref} for {vehicle.brand} {vehicle.model} "
                f"({start_date} to {end_date}) is confirmed. Paid ₹{float(subtotal):,.2f} via {method} "
                f"(Ref: {txn_ref})."
            ),
            is_read=False,
        )
        db.add(notif)
        db.flush()

        # Intentional failure trigger to demonstrate ACID ROLLBACK during final review
        if simulate_failure:
            raise RuntimeError(
                "Payment could not be completed. Simulated gateway/constraint failure triggered ACID ROLLBACK."
            )

        # Step 7: Commit atomic transaction
        db.commit()
        db.refresh(booking)
        db.refresh(payment)
        db.refresh(vehicle)

        return {
            "transaction_status": "COMMITTED",
            "booking": booking,
            "payment": payment,
            "vehicle": vehicle,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        # ROLLBACK all flushed changes (booking, payment, vehicle status, availability, notification)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment could not be completed. Transaction rolled back: {str(exc)}",
        )


def process_payment_for_pending_booking(
    db: Session,
    booking_id: int,
    payment_method: str = "DEMO",
    simulate_failure: bool = False,
) -> Dict[str, Any]:
    """
    Processes payment for an existing PENDING booking inside an atomic database transaction.
    """
    method = payment_method.upper()
    if method not in ("UPI", "CARD", "CASH", "DEMO"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment method. Choose UPI, CARD, CASH, or DEMO.",
        )

    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found.",
            )
        if booking.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay for a cancelled booking.",
            )

        existing_paid = (
            db.query(Payment)
            .filter(
                Payment.booking_id == booking.id,
                Payment.payment_status == "PAID",
            )
            .first()
        )
        if existing_paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment has already been completed for this booking.",
            )

        # Re-verify no conflicting booking took the vehicle
        vehicle, _, _ = validate_dates_and_availability(
            db,
            booking.vehicle_id,
            booking.start_date,
            booking.end_date,
            exclude_booking_id=booking.id,
        )

        today = date.today()
        booking.status = (
            "ACTIVE"
            if booking.start_date <= today <= booking.end_date
            else "CONFIRMED"
        )
        vehicle.status = "RENTED" if booking.status == "ACTIVE" else "BOOKED"

        txn_ref = generate_transaction_reference(method)
        payment = Payment(
            booking_id=booking.id,
            amount=booking.subtotal,
            payment_method=method,
            payment_status="PAID",
            transaction_reference=txn_ref,
        )
        db.add(payment)

        avail = Availability(
            vehicle_id=vehicle.id,
            available_from=booking.start_date,
            available_to=booking.end_date,
            status=vehicle.status,
        )
        db.add(avail)

        customer = (
            db.query(Customer).filter(Customer.id == booking.customer_id).first()
        )
        if customer:
            notif = Notification(
                user_id=customer.user_id,
                type="PAYMENT_SUCCESS",
                title="Payment Successful & Booking Confirmed",
                message=(
                    f"Payment of ₹{float(booking.subtotal):,.2f} via {method} (Ref: {txn_ref}) "
                    f"succeeded. Booking {booking.booking_reference} for {vehicle.brand} {vehicle.model} is now {booking.status}."
                ),
                is_read=False,
            )
            db.add(notif)

        db.flush()

        if simulate_failure:
            raise RuntimeError(
                "Payment could not be completed. Simulated payment failure triggered ACID ROLLBACK."
            )

        db.commit()
        db.refresh(payment)
        db.refresh(booking)
        db.refresh(vehicle)

        return {
            "transaction_status": "COMMITTED",
            "payment": payment,
            "booking": booking,
            "vehicle": vehicle,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment could not be completed. Transaction rolled back: {str(exc)}",
        )


def process_vehicle_return(
    db: Session,
    booking_id: int,
    return_date: date,
    condition: str,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Processes a vehicle return inside an atomic transaction:
    - Validates condition ('Good', 'Minor Damage', 'Major Damage')
    - Calculates late_days, late_fee (1.2x daily rate per late day), damage_fee, final_amount
    - Updates booking.status = 'COMPLETED'
    - Updates vehicle.status = 'AVAILABLE'
    - Inserts ReturnRecord
    - Inserts RentalHistory
    - Updates Availability
    - Generates Notification
    """
    if condition not in DAMAGE_FEE_SCHEDULE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid condition. Must be 'Good', 'Minor Damage', or 'Major Damage'.",
        )

    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found.",
            )

        if booking.status == "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This booking has already been returned and completed.",
            )
        if booking.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot return a cancelled booking.",
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found.",
            )

        late_days = max(0, (return_date - booking.end_date).days)
        daily_rate_dec = Decimal(str(booking.daily_rate))
        late_fee = (
            Decimal(late_days) * daily_rate_dec * Decimal("1.20")
        ).quantize(Decimal("0.01"))
        damage_fee = DAMAGE_FEE_SCHEDULE[condition]
        subtotal_dec = Decimal(str(booking.subtotal))
        final_amount = (subtotal_dec + late_fee + damage_fee).quantize(Decimal("0.01"))

        return_rec = ReturnRecord(
            booking_id=booking.id,
            vehicle_id=vehicle.id,
            return_date=return_date,
            condition=condition,
            late_days=late_days,
            late_fee=late_fee,
            damage_fee=damage_fee,
            final_amount=final_amount,
            notes=notes or f"Vehicle returned in {condition} condition.",
        )
        db.add(return_rec)

        booking.status = "COMPLETED"

        # Check if vehicle has any other currently ACTIVE/CONFIRMED bookings right now
        other_active = (
            db.query(Booking)
            .filter(
                Booking.vehicle_id == vehicle.id,
                Booking.id != booking.id,
                Booking.status.in_(["ACTIVE", "CONFIRMED"]),
            )
            .first()
        )
        vehicle.status = (
            "AVAILABLE"
            if not other_active
            else ("RENTED" if other_active.status == "ACTIVE" else "BOOKED")
        )

        # Create RentalHistory record
        actual_end = max(booking.end_date, return_date)
        history_rec = RentalHistory(
            customer_id=booking.customer_id,
            vehicle_id=vehicle.id,
            booking_id=booking.id,
            rented_from=booking.start_date,
            rented_to=actual_end,
            amount=final_amount,
        )
        db.add(history_rec)

        # Update Availability record
        avail = Availability(
            vehicle_id=vehicle.id,
            available_from=return_date,
            available_to=date(2026, 12, 31),
            status="AVAILABLE",
        )
        db.add(avail)

        # Generate customer notification
        customer = (
            db.query(Customer).filter(Customer.id == booking.customer_id).first()
        )
        if customer:
            notif = Notification(
                user_id=customer.user_id,
                type="VEHICLE_RETURNED",
                title="Vehicle Returned & Final Bill Generated",
                message=(
                    f"Vehicle {vehicle.brand} {vehicle.model} for booking {booking.booking_reference} "
                    f"has been returned ({condition}). Final Bill: ₹{float(final_amount):,.2f} "
                    f"(Base: ₹{float(subtotal_dec):,.2f}, Late Fee: ₹{float(late_fee):,.2f}, Damage Fee: ₹{float(damage_fee):,.2f})."
                ),
                is_read=False,
            )
            db.add(notif)

        db.commit()
        db.refresh(return_rec)
        db.refresh(booking)
        db.refresh(vehicle)
        db.refresh(history_rec)

        return {
            "return_record": return_rec,
            "booking": booking,
            "vehicle": vehicle,
            "rental_history": history_rec,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process vehicle return: {str(exc)}",
        )
