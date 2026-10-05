from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User,
    Customer,
    Booking,
    RentalHistory,
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/history", tags=["Rental History"])


@router.get("")
def get_rental_history(
    search: Optional[str] = Query(None),
    booking_status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(
        "date_desc", description="date_desc, date_asc, amount_desc, amount_asc"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns comprehensive rental history joining bookings, rental_history, payments, and returns.
    Scoped to the logged-in customer, or complete across all customers for Admin.
    """
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

    bookings = query.all()
    results = []

    for b in bookings:
        veh = b.vehicle
        cust = b.customer
        user = cust.user if cust else None
        payment = b.payments[-1] if b.payments else None
        ret = b.return_record
        hist = b.rental_history

        p_status = payment.payment_status if payment else "UNPAID"
        r_status = (
            f"Returned ({ret.condition})"
            if ret
            else (
                "In Progress"
                if b.status in ("ACTIVE", "CONFIRMED")
                else ("Cancelled" if b.status == "CANCELLED" else "Pending")
            )
        )
        final_amt = (
            float(ret.final_amount)
            if ret
            else (float(hist.amount) if hist else float(b.subtotal))
        )

        item = {
            "id": hist.id if hist else b.id,
            "booking_id": b.id,
            "booking_reference": b.booking_reference,
            "customer_id": b.customer_id,
            "customer_name": user.name if user else f"Customer #{b.customer_id}",
            "customer_email": user.email if user else "",
            "vehicle_id": b.vehicle_id,
            "vehicle": (
                {
                    "id": veh.id,
                    "vehicle_number": veh.vehicle_number,
                    "brand": veh.brand,
                    "model": veh.model,
                    "name": f"{veh.brand} {veh.model}",
                    "vehicle_type": veh.vehicle_type,
                    "transmission": veh.transmission,
                    "fuel_type": veh.fuel_type,
                    "seats": veh.seats,
                    "daily_rate": float(veh.daily_rate),
                    "location": veh.location,
                    "image_url": veh.image_url,
                }
                if veh
                else None
            ),
            "rented_from": (
                hist.rented_from.isoformat()
                if hist
                else b.start_date.isoformat()
            ),
            "rented_to": (
                hist.rented_to.isoformat() if hist else b.end_date.isoformat()
            ),
            "start_date": b.start_date.isoformat(),
            "end_date": b.end_date.isoformat(),
            "total_days": b.total_days,
            "daily_rate": float(b.daily_rate),
            "base_subtotal": float(b.subtotal),
            "amount": final_amt,
            "payment_status": p_status,
            "payment_method": payment.payment_method if payment else "N/A",
            "transaction_reference": (
                payment.transaction_reference if payment else "N/A"
            ),
            "booking_status": b.status,
            "return_status": r_status,
            "return_details": (
                {
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
        }
        results.append(item)

    if booking_status and booking_status.upper() != "ALL":
        results = [
            r
            for r in results
            if r["booking_status"] == booking_status.upper().strip()
        ]

    if payment_status and payment_status.upper() != "ALL":
        results = [
            r
            for r in results
            if r["payment_status"] == payment_status.upper().strip()
        ]

    if vehicle_type and vehicle_type.upper() != "ALL":
        results = [
            r
            for r in results
            if r["vehicle"]
            and r["vehicle"]["vehicle_type"].lower()
            == vehicle_type.strip().lower()
        ]

    if search:
        term = search.strip().lower()
        results = [
            r
            for r in results
            if term in r["booking_reference"].lower()
            or term in str(r["booking_id"])
            or term in (r["customer_name"] or "").lower()
            or (
                r["vehicle"]
                and (
                    term in r["vehicle"]["name"].lower()
                    or term in r["vehicle"]["vehicle_number"].lower()
                )
            )
        ]

    if sort_by == "date_asc":
        results.sort(key=lambda x: x["rented_from"])
    elif sort_by == "amount_desc":
        results.sort(key=lambda x: x["amount"], reverse=True)
    elif sort_by == "amount_asc":
        results.sort(key=lambda x: x["amount"])
    else:
        results.sort(key=lambda x: (x["rented_from"], x["booking_id"]), reverse=True)

    return results
