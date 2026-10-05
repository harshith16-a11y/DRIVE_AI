from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Customer, Booking, ReturnRecord
from app.schemas.api_schemas import ReturnCreate
from app.auth.security import get_current_user
from app.services.rental_service import process_vehicle_return
from app.routers.bookings import serialize_booking

router = APIRouter(prefix="/returns", tags=["Returns"])


def _serialize_return(r: ReturnRecord) -> dict:
    b = r.booking
    cust = b.customer if b else None
    user = cust.user if cust else None
    veh = r.vehicle

    return {
        "id": r.id,
        "booking_id": r.booking_id,
        "booking_reference": b.booking_reference if b else "",
        "customer_id": cust.id if cust else None,
        "customer_name": user.name if user else "",
        "customer_email": user.email if user else "",
        "vehicle_id": r.vehicle_id,
        "vehicle_name": f"{veh.brand} {veh.model}" if veh else "",
        "vehicle_number": veh.vehicle_number if veh else "",
        "start_date": b.start_date.isoformat() if b else None,
        "end_date": b.end_date.isoformat() if b else None,
        "return_date": r.return_date.isoformat(),
        "condition": r.condition,
        "base_subtotal": float(b.subtotal) if b else 0.0,
        "daily_rate": float(b.daily_rate) if b else 0.0,
        "late_days": r.late_days,
        "late_fee": float(r.late_fee),
        "damage_fee": float(r.damage_fee),
        "final_amount": float(r.final_amount),
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_return(
    payload: ReturnCreate,
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
                detail="Not authorized to return this booking.",
            )

    result = process_vehicle_return(
        db=db,
        booking_id=payload.booking_id,
        return_date=payload.return_date,
        condition=payload.condition,
        notes=payload.notes,
    )
    return {
        "message": "Vehicle returned successfully and final bill generated.",
        "return_record": _serialize_return(result["return_record"]),
        "booking": serialize_booking(result["booking"]),
    }


@router.get("")
def list_returns(
    condition: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ReturnRecord).join(
        Booking, Booking.id == ReturnRecord.booking_id
    )

    if current_user.role != "ADMIN":
        cust = (
            db.query(Customer)
            .filter(Customer.user_id == current_user.id)
            .first()
        )
        if not cust:
            return []
        query = query.filter(Booking.customer_id == cust.id)

    if condition and condition.upper() != "ALL":
        query = query.filter(ReturnRecord.condition == condition.strip())

    rows = query.order_by(ReturnRecord.id.desc()).all()
    items = [_serialize_return(r) for r in rows]

    if search:
        term = search.strip().lower()
        items = [
            x
            for x in items
            if term in x["booking_reference"].lower()
            or term in (x["customer_name"] or "").lower()
            or term in (x["vehicle_name"] or "").lower()
            or term in (x["vehicle_number"] or "").lower()
        ]

    return items
