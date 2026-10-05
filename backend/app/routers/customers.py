from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User,
    Customer,
    Booking,
    Payment,
    RentalHistory,
)
from app.schemas.api_schemas import CustomerProfileUpdate
from app.auth.security import (
    get_current_user,
    require_admin,
)
from app.ai.recommender import generate_recommendations_for_customer

router = APIRouter(prefix="/customers", tags=["Customers"])


def _format_customer_record(db: Session, cust: Customer) -> dict:
    user = cust.user
    bookings = db.query(Booking).filter(Booking.customer_id == cust.id).all()
    booking_ids = [b.id for b in bookings]

    total_spent = 0.0
    if booking_ids:
        paid_payments = (
            db.query(Payment)
            .filter(
                Payment.booking_id.in_(booking_ids),
                Payment.payment_status == "PAID",
            )
            .all()
        )
        total_spent = sum(float(p.amount or 0) for p in paid_payments)

    history_rows = (
        db.query(RentalHistory)
        .filter(RentalHistory.customer_id == cust.id)
        .order_by(RentalHistory.rented_from.desc())
        .all()
    )

    return {
        "id": cust.id,
        "user_id": cust.user_id,
        "name": user.name if user else "",
        "email": user.email if user else "",
        "phone": user.phone if user else "",
        "is_active": user.is_active if user else True,
        "preferred_vehicle_type": cust.preferred_vehicle_type,
        "preferred_transmission": cust.preferred_transmission,
        "preferred_fuel": cust.preferred_fuel,
        "preferred_seats": cust.preferred_seats,
        "budget_per_day": float(cust.budget_per_day or 3500.0),
        "booking_count": len(bookings),
        "completed_rentals_count": len(history_rows),
        "total_spent": round(total_spent, 2),
        "created_at": cust.created_at.isoformat() if cust.created_at else None,
        "rental_history": [
            {
                "id": h.id,
                "booking_id": h.booking_id,
                "vehicle_id": h.vehicle_id,
                "vehicle_name": (
                    f"{h.vehicle.brand} {h.vehicle.model}" if h.vehicle else "Vehicle"
                ),
                "vehicle_number": h.vehicle.vehicle_number if h.vehicle else "",
                "rented_from": h.rented_from.isoformat(),
                "rented_to": h.rented_to.isoformat(),
                "amount": float(h.amount),
            }
            for h in history_rows
        ],
    }


@router.get("/me")
def get_my_customer_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust = (
        db.query(Customer).filter(Customer.user_id == current_user.id).first()
    )
    if not cust:
        # Auto-create customer profile if an admin or user accesses /customers/me
        cust = Customer(
            user_id=current_user.id,
            preferred_vehicle_type="SUV",
            preferred_transmission="Automatic",
            preferred_fuel="Petrol",
            preferred_seats=5,
            budget_per_day=Decimal("4000.00"),
        )
        db.add(cust)
        db.commit()
        db.refresh(cust)
    return _format_customer_record(db, cust)


@router.put("/me")
def update_my_customer_profile(
    payload: CustomerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust = (
        db.query(Customer).filter(Customer.user_id == current_user.id).first()
    )
    if not cust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found.",
        )

    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.preferred_vehicle_type is not None:
        cust.preferred_vehicle_type = payload.preferred_vehicle_type
    if payload.preferred_transmission is not None:
        cust.preferred_transmission = payload.preferred_transmission
    if payload.preferred_fuel is not None:
        cust.preferred_fuel = payload.preferred_fuel
    if payload.preferred_seats is not None:
        cust.preferred_seats = payload.preferred_seats
    if payload.budget_per_day is not None:
        cust.budget_per_day = Decimal(str(payload.budget_per_day))

    db.commit()
    db.refresh(current_user)
    db.refresh(cust)

    # Refresh AI recommendations immediately upon preference change
    generate_recommendations_for_customer(db, cust.id, persist=True)
    return _format_customer_record(db, cust)


@router.get("")
def list_customers(
    search: Optional[str] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Customer).join(User, User.id == Customer.user_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.name.ilike(term),
                User.email.ilike(term),
                User.phone.ilike(term),
                Customer.preferred_vehicle_type.ilike(term),
            )
        )
    customers = query.order_by(Customer.id.asc()).all()
    return [_format_customer_record(db, c) for c in customers]


@router.get("/{customer_id}")
def get_customer_by_id(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )
    if current_user.role != "ADMIN" and cust.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return _format_customer_record(db, cust)


@router.put("/{customer_id}")
def update_customer_by_id(
    customer_id: int,
    payload: CustomerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )
    if current_user.role != "ADMIN" and cust.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    user = cust.user
    if user:
        if payload.name is not None:
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip()
        if payload.is_active is not None and current_user.role == "ADMIN":
            user.is_active = payload.is_active

    if payload.preferred_vehicle_type is not None:
        cust.preferred_vehicle_type = payload.preferred_vehicle_type
    if payload.preferred_transmission is not None:
        cust.preferred_transmission = payload.preferred_transmission
    if payload.preferred_fuel is not None:
        cust.preferred_fuel = payload.preferred_fuel
    if payload.preferred_seats is not None:
        cust.preferred_seats = payload.preferred_seats
    if payload.budget_per_day is not None:
        cust.budget_per_day = Decimal(str(payload.budget_per_day))

    db.commit()
    db.refresh(cust)
    generate_recommendations_for_customer(db, cust.id, persist=True)
    return _format_customer_record(db, cust)


@router.delete("/{customer_id}")
def delete_or_deactivate_customer(
    customer_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    has_bookings = (
        db.query(Booking).filter(Booking.customer_id == cust.id).count() > 0
    )
    user = cust.user
    if has_bookings:
        # Preserve relational integrity for historical bookings while deactivating account
        if user:
            user.is_active = False
        db.commit()
        return {
            "message": "Customer has historical bookings; account deactivated to preserve referential integrity.",
            "deactivated": True,
            "deleted": False,
        }
    else:
        if user:
            db.delete(user)
        else:
            db.delete(cust)
        db.commit()
        return {
            "message": "Customer deleted successfully.",
            "deactivated": False,
            "deleted": True,
        }
