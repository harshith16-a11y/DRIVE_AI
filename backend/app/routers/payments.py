from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Customer, Booking, Payment
from app.schemas.api_schemas import PaymentCreate
from app.auth.security import get_current_user
from app.services.rental_service import process_payment_for_pending_booking
from app.routers.bookings import serialize_booking

router = APIRouter(prefix="/payments", tags=["Payments"])


def _serialize_payment(p: Payment) -> dict:
    b = p.booking
    cust = b.customer if b else None
    user = cust.user if cust else None
    veh = b.vehicle if b else None

    return {
        "id": p.id,
        "booking_id": p.booking_id,
        "booking_reference": b.booking_reference if b else "",
        "booking_status": b.status if b else "",
        "customer_id": cust.id if cust else None,
        "customer_name": user.name if user else "",
        "customer_email": user.email if user else "",
        "vehicle_name": f"{veh.brand} {veh.model}" if veh else "",
        "vehicle_number": veh.vehicle_number if veh else "",
        "start_date": b.start_date.isoformat() if b else None,
        "end_date": b.end_date.isoformat() if b else None,
        "amount": float(p.amount),
        "payment_method": p.payment_method,
        "payment_status": p.payment_status,
        "transaction_reference": p.transaction_reference,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
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
                detail="Not authorized to pay for this booking.",
            )

    result = process_payment_for_pending_booking(
        db=db,
        booking_id=payload.booking_id,
        payment_method=payload.payment_method,
        simulate_failure=payload.simulate_failure,
    )
    return {
        "transaction_status": result["transaction_status"],
        "payment": _serialize_payment(result["payment"]),
        "booking": serialize_booking(result["booking"]),
    }


@router.get("")
def list_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    method: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Payment).join(Booking, Booking.id == Payment.booking_id)

    if current_user.role != "ADMIN":
        cust = (
            db.query(Customer)
            .filter(Customer.user_id == current_user.id)
            .first()
        )
        if not cust:
            return {"payments": [], "summary": {}}
        query = query.filter(Booking.customer_id == cust.id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(
            Payment.payment_status == status_filter.upper().strip()
        )

    if method and method.upper() != "ALL":
        query = query.filter(Payment.payment_method == method.upper().strip())

    rows = query.order_by(Payment.id.desc()).all()
    items = [_serialize_payment(p) for p in rows]

    if search:
        term = search.strip().lower()
        items = [
            x
            for x in items
            if term in x["transaction_reference"].lower()
            or term in x["booking_reference"].lower()
            or term in (x["customer_name"] or "").lower()
            or term in (x["vehicle_name"] or "").lower()
        ]

    total_collected = round(
        sum(x["amount"] for x in items if x["payment_status"] == "PAID"), 2
    )
    pending_amount = round(
        sum(x["amount"] for x in items if x["payment_status"] == "PENDING"), 2
    )
    failed_amount = round(
        sum(x["amount"] for x in items if x["payment_status"] == "FAILED"), 2
    )
    refunded_amount = round(
        sum(x["amount"] for x in items if x["payment_status"] == "REFUNDED"), 2
    )

    return {
        "payments": items,
        "summary": {
            "total_transactions": len(items),
            "total_collected": total_collected,
            "pending_amount": pending_amount,
            "failed_amount": failed_amount,
            "refunded_amount": refunded_amount,
        },
    }
