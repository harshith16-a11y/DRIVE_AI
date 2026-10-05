from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User,
    Customer,
    Vehicle,
    Booking,
    Payment,
    ReturnRecord,
    Notification,
)
from app.schemas.api_schemas import (
    BookingCreate,
    TransactionalBookingPaymentRequest,
    BookingStatusUpdate,
)
from app.auth.security import get_current_user
from app.services.rental_service import (
    validate_dates_and_availability,
    generate_booking_reference,
    execute_transactional_booking_and_payment,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def serialize_booking(b: Booking) -> dict:
    cust = b.customer
    user = cust.user if cust else None
    veh = b.vehicle
    payment = b.payments[-1] if b.payments else None
    ret = b.return_record

    return {
        "id": b.id,
        "booking_reference": b.booking_reference,
        "customer_id": b.customer_id,
        "customer_name": user.name if user else f"Customer #{b.customer_id}",
        "customer_email": user.email if user else "",
        "customer_phone": user.phone if user else "",
        "vehicle_id": b.vehicle_id,
        "vehicle": (
            {
                "id": veh.id,
                "vehicle_number": veh.vehicle_number,
                "brand": veh.brand,
                "model": veh.model,
                "vehicle_type": veh.vehicle_type,
                "transmission": veh.transmission,
                "fuel_type": veh.fuel_type,
                "seats": veh.seats,
                "daily_rate": float(veh.daily_rate),
                "status": veh.status,
                "location": veh.location,
                "image_url": veh.image_url,
            }
            if veh
            else None
        ),
        "start_date": b.start_date.isoformat(),
        "end_date": b.end_date.isoformat(),
        "total_days": b.total_days,
        "daily_rate": float(b.daily_rate),
        "subtotal": float(b.subtotal),
        "status": b.status,
        "payment_status": payment.payment_status if payment else "UNPAID",
        "payment": (
            {
                "id": payment.id,
                "amount": float(payment.amount),
                "payment_method": payment.payment_method,
                "payment_status": payment.payment_status,
                "transaction_reference": payment.transaction_reference,
                "paid_at": (
                    payment.paid_at.isoformat() if payment.paid_at else None
                ),
            }
            if payment
            else None
        ),
        "return_record": (
            {
                "id": ret.id,
                "return_date": ret.return_date.isoformat(),
                "condition": ret.condition,
                "late_days": ret.late_days,
                "late_fee": float(ret.late_fee),
                "damage_fee": float(ret.damage_fee),
                "final_amount": float(ret.final_amount),
                "notes": ret.notes,
            }
            if ret
            else None
        ),
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
    }


def _resolve_customer_for_user(db: Session, current_user: User, customer_id: Optional[int] = None) -> Customer:
    if current_user.role == "ADMIN" and customer_id is not None:
        c = db.query(Customer).filter(Customer.id == customer_id).first()
        if not c:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found.",
            )
        return c

    c = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not c:
        c = Customer(
            user_id=current_user.id,
            preferred_vehicle_type="SUV",
            preferred_transmission="Automatic",
            preferred_fuel="Petrol",
            preferred_seats=5,
            budget_per_day=Decimal("4000.00"),
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


@router.get("")
def list_bookings(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    customer_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)

    if current_user.role != "ADMIN":
        cust = (
            db.query(Customer)
            .filter(Customer.user_id == current_user.id)
            .first()
        )
        if not cust:
            return []
        query = query.filter(Booking.customer_id == cust.id)
    elif customer_id is not None:
        query = query.filter(Booking.customer_id == customer_id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Booking.status == status_filter.upper().strip())

    if start_date:
        query = query.filter(Booking.start_date >= start_date)

    if end_date:
        query = query.filter(Booking.end_date <= end_date)

    bookings = query.order_by(Booking.id.desc()).all()
    serialized = [serialize_booking(b) for b in bookings]

    if search:
        term = search.strip().lower()
        serialized = [
            item
            for item in serialized
            if term in item["booking_reference"].lower()
            or term in str(item["id"])
            or term in (item["customer_name"] or "").lower()
            or term in (item["customer_email"] or "").lower()
            or (
                item["vehicle"]
                and (
                    term in item["vehicle"]["brand"].lower()
                    or term in item["vehicle"]["model"].lower()
                    or term in item["vehicle"]["vehicle_number"].lower()
                )
            )
        ]

    return serialized


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a validated PENDING booking with server-side rental day and subtotal calculation.
    Prevents invalid dates and double-booking on overlapping date windows.
    """
    customer = _resolve_customer_for_user(db, current_user, payload.customer_id)

    try:
        vehicle, total_days, subtotal = validate_dates_and_availability(
            db, payload.vehicle_id, payload.start_date, payload.end_date
        )

        booking_ref = generate_booking_reference(db)
        new_booking = Booking(
            booking_reference=booking_ref,
            customer_id=customer.id,
            vehicle_id=vehicle.id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            total_days=total_days,
            daily_rate=vehicle.daily_rate,
            subtotal=subtotal,
            status="PENDING",
        )
        db.add(new_booking)
        db.flush()

        notif = Notification(
            user_id=customer.user_id,
            type="BOOKING_CREATED",
            title="Booking Created — Awaiting Payment",
            message=(
                f"Booking {booking_ref} for {vehicle.brand} {vehicle.model} "
                f"({payload.start_date} to {payload.end_date}, {total_days} days) has been created. "
                f"Total amount: ₹{float(subtotal):,.2f}. Complete payment to confirm."
            ),
            is_read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(new_booking)
        return serialize_booking(new_booking)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create booking: {str(exc)}",
        )


@router.post("/transactional", status_code=status.HTTP_201_CREATED)
def create_transactional_booking_with_payment(
    payload: TransactionalBookingPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Executes Booking + Payment + Vehicle Status Update + Notification inside a single
    ACID PostgreSQL transaction. Supports `simulate_failure=True` to demonstrate ROLLBACK.
    """
    customer = _resolve_customer_for_user(db, current_user)
    result = execute_transactional_booking_and_payment(
        db=db,
        customer=customer,
        vehicle_id=payload.vehicle_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        payment_method=payload.payment_method,
        simulate_failure=payload.simulate_failure,
    )
    return {
        "transaction_status": result["transaction_status"],
        "booking": serialize_booking(result["booking"]),
    }


@router.get("/{booking_id}")
def get_booking_details(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if current_user.role != "ADMIN":
        cust = (
            db.query(Customer)
            .filter(Customer.user_id == current_user.id)
            .first()
        )
        if not cust or booking.customer_id != cust.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this booking.",
            )

    return serialize_booking(booking)


@router.put("/{booking_id}")
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    cust = (
        db.query(Customer)
        .filter(Customer.user_id == current_user.id)
        .first()
    )
    if current_user.role != "ADMIN" and (
        not cust or booking.customer_id != cust.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this booking.",
        )

    new_status = payload.status.strip().upper()
    valid_statuses = {
        "PENDING",
        "CONFIRMED",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED",
    }
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking status.",
        )

    try:
        booking.status = new_status
        vehicle = (
            db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        )

        if new_status == "CANCELLED":
            # Refund any PAID payment and free vehicle if no other active booking exists
            for p in booking.payments:
                if p.payment_status == "PAID":
                    p.payment_status = "REFUNDED"
            if vehicle:
                other_active = (
                    db.query(Booking)
                    .filter(
                        Booking.vehicle_id == vehicle.id,
                        Booking.id != booking.id,
                        Booking.status.in_(["ACTIVE", "CONFIRMED"]),
                    )
                    .first()
                )
                if not other_active and vehicle.status in ("BOOKED", "RENTED"):
                    vehicle.status = "AVAILABLE"

            target_cust = booking.customer
            if target_cust:
                db.add(
                    Notification(
                        user_id=target_cust.user_id,
                        type="BOOKING_CANCELLED",
                        title="Booking Cancelled",
                        message=f"Booking {booking.booking_reference} has been cancelled.",
                        is_read=False,
                    )
                )
        elif new_status == "ACTIVE" and vehicle:
            vehicle.status = "RENTED"
        elif new_status == "CONFIRMED" and vehicle:
            vehicle.status = "BOOKED"

        db.commit()
        db.refresh(booking)
        return serialize_booking(booking)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update booking: {str(exc)}",
        )


@router.delete("/{booking_id}")
def cancel_or_delete_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    cust = (
        db.query(Customer)
        .filter(Customer.user_id == current_user.id)
        .first()
    )
    if current_user.role != "ADMIN" and (
        not cust or booking.customer_id != cust.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking.",
        )

    booking.status = "CANCELLED"
    for p in booking.payments:
        if p.payment_status == "PAID":
            p.payment_status = "REFUNDED"

    vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
    if vehicle:
        other_active = (
            db.query(Booking)
            .filter(
                Booking.vehicle_id == vehicle.id,
                Booking.id != booking.id,
                Booking.status.in_(["ACTIVE", "CONFIRMED"]),
            )
            .first()
        )
        if not other_active and vehicle.status in ("BOOKED", "RENTED"):
            vehicle.status = "AVAILABLE"

    if booking.customer:
        db.add(
            Notification(
                user_id=booking.customer.user_id,
                type="BOOKING_CANCELLED",
                title="Booking Cancelled",
                message=f"Booking {booking.booking_reference} has been cancelled.",
                is_read=False,
            )
        )

    db.commit()
    db.refresh(booking)
    return {
        "message": "Booking cancelled successfully.",
        "booking": serialize_booking(booking),
    }
