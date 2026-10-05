from collections import defaultdict
from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User,
    Customer,
    Vehicle,
    Booking,
    Payment,
    ReturnRecord,
)
from app.auth.security import require_admin
from app.ai.demand import compute_demand_analysis
from app.routers.bookings import serialize_booking

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/summary")
def get_reports_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Powers both the Admin Dashboard and the 12-Report SQL Analytics Suite.
    All values are computed dynamically from PostgreSQL.
    """
    total_customers = db.query(Customer).count()
    vehicles = db.query(Vehicle).all()
    total_vehicles = len(vehicles)
    available_vehicles = sum(1 for v in vehicles if v.status == "AVAILABLE")

    bookings_query = db.query(Booking)
    if start_date:
        bookings_query = bookings_query.filter(Booking.start_date >= start_date)
    if end_date:
        bookings_query = bookings_query.filter(Booking.end_date <= end_date)
    bookings = bookings_query.order_by(Booking.id.desc()).all()

    total_bookings = len(bookings)
    active_rentals_count = sum(
        1 for b in bookings if b.status in ("ACTIVE", "CONFIRMED")
    )
    completed_rentals_count = sum(
        1 for b in bookings if b.status == "COMPLETED"
    )
    cancelled_bookings_count = sum(
        1 for b in bookings if b.status == "CANCELLED"
    )

    booking_ids = {b.id for b in bookings}
    payments = db.query(Payment).order_by(Payment.id.desc()).all()
    if start_date or end_date:
        payments = [p for p in payments if p.booking_id in booking_ids]

    returns = db.query(ReturnRecord).order_by(ReturnRecord.id.desc()).all()
    if start_date or end_date:
        returns = [r for r in returns if r.booking_id in booking_ids]

    paid_revenue = sum(
        float(p.amount or 0) for p in payments if p.payment_status == "PAID"
    )
    extra_fees = sum(
        float((r.late_fee or 0) + (r.damage_fee or 0)) for r in returns
    )
    total_revenue = round(paid_revenue + extra_fees, 2)

    # Monthly bookings & revenue chart data
    monthly_map: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"month": "", "bookings": 0, "revenue": 0.0}
    )
    for b in bookings:
        if b.status != "CANCELLED":
            m_key = b.start_date.strftime("%Y-%m")
            monthly_map[m_key]["month"] = m_key
            monthly_map[m_key]["bookings"] += 1
            b_paid = sum(
                float(p.amount or 0)
                for p in b.payments
                if p.payment_status == "PAID"
            )
            b_extra = (
                float(
                    (b.return_record.late_fee or 0)
                    + (b.return_record.damage_fee or 0)
                )
                if b.return_record
                else 0.0
            )
            monthly_map[m_key]["revenue"] = round(
                monthly_map[m_key]["revenue"] + b_paid + b_extra, 2
            )

    monthly_series = [monthly_map[k] for k in sorted(monthly_map.keys())]

    # Vehicle Type Distribution
    type_counts: Dict[str, int] = defaultdict(int)
    for v in vehicles:
        type_counts[v.vehicle_type] += 1
    vehicle_type_distribution = [
        {"name": k, "value": v} for k, v in sorted(type_counts.items())
    ]

    # Booking Status Distribution
    status_counts: Dict[str, int] = defaultdict(int)
    for b in bookings:
        status_counts[b.status] += 1
    booking_status_distribution = [
        {"status": k, "count": v} for k, v in sorted(status_counts.items())
    ]

    # Demand & Utilization from AI Demand Service
    demand_data = compute_demand_analysis(db)

    # Customer spending report
    customers = db.query(Customer).all()
    customer_spending = []
    for c in customers:
        u = c.user
        c_bookings = [b for b in bookings if b.customer_id == c.id]
        c_completed = [b for b in c_bookings if b.status == "COMPLETED"]
        c_spent = 0.0
        for b in c_bookings:
            c_spent += sum(
                float(p.amount or 0)
                for p in b.payments
                if p.payment_status == "PAID"
            )
            if b.return_record:
                c_spent += float(
                    (b.return_record.late_fee or 0)
                    + (b.return_record.damage_fee or 0)
                )
        customer_spending.append(
            {
                "customer_id": c.id,
                "customer_name": u.name if u else f"Customer #{c.id}",
                "email": u.email if u else "",
                "phone": u.phone if u else "",
                "preferred_vehicle_type": c.preferred_vehicle_type,
                "total_bookings": len(c_bookings),
                "completed_rentals": len(c_completed),
                "total_spent": round(c_spent, 2),
            }
        )
    customer_spending.sort(key=lambda x: x["total_spent"], reverse=True)

    # Payment summary by method & status
    pay_summary_map: Dict[str, Dict[str, Any]] = {}
    for p in payments:
        key = f"{p.payment_method}_{p.payment_status}"
        if key not in pay_summary_map:
            pay_summary_map[key] = {
                "payment_method": p.payment_method,
                "payment_status": p.payment_status,
                "transaction_count": 0,
                "total_amount": 0.0,
            }
        pay_summary_map[key]["transaction_count"] += 1
        pay_summary_map[key]["total_amount"] = round(
            pay_summary_map[key]["total_amount"] + float(p.amount or 0), 2
        )
    payment_summary = sorted(
        pay_summary_map.values(),
        key=lambda x: x["total_amount"],
        reverse=True,
    )

    # Vehicles needing attention (MAINTENANCE, INACTIVE, or returned with damage)
    damaged_vehicle_ids = {
        r.vehicle_id
        for r in returns
        if r.condition in ("Minor Damage", "Major Damage")
    }
    vehicles_needing_attention = []
    for v in vehicles:
        if v.status in ("MAINTENANCE", "INACTIVE") or v.id in damaged_vehicle_ids:
            reason = (
                f"Status: {v.status}"
                if v.status in ("MAINTENANCE", "INACTIVE")
                else "Reported damage in historical return inspection"
            )
            vehicles_needing_attention.append(
                {
                    "id": v.id,
                    "vehicle_number": v.vehicle_number,
                    "name": f"{v.brand} {v.model}",
                    "vehicle_type": v.vehicle_type,
                    "status": v.status,
                    "location": v.location,
                    "attention_reason": reason,
                }
            )

    recent_bookings = [serialize_booking(b) for b in bookings[:8]]
    active_rentals_list = [
        serialize_booking(b)
        for b in bookings
        if b.status in ("ACTIVE", "CONFIRMED")
    ]
    completed_rentals_list = [
        serialize_booking(b) for b in bookings if b.status == "COMPLETED"
    ]
    cancelled_bookings_list = [
        serialize_booking(b) for b in bookings if b.status == "CANCELLED"
    ]

    recent_payments = []
    for p in payments[:8]:
        b = p.booking
        cust = b.customer if b else None
        user = cust.user if cust else None
        veh = b.vehicle if b else None
        recent_payments.append(
            {
                "id": p.id,
                "transaction_reference": p.transaction_reference,
                "booking_reference": b.booking_reference if b else "",
                "customer_name": user.name if user else "",
                "vehicle_name": f"{veh.brand} {veh.model}" if veh else "",
                "amount": float(p.amount),
                "payment_method": p.payment_method,
                "payment_status": p.payment_status,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
        )

    return {
        "kpis": {
            "total_customers": total_customers,
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles,
            "active_rentals": active_rentals_count,
            "total_bookings": total_bookings,
            "completed_rentals": completed_rentals_count,
            "cancelled_bookings": cancelled_bookings_count,
            "total_revenue": total_revenue,
            "base_booking_revenue": round(paid_revenue, 2),
            "late_and_damage_revenue": round(extra_fees, 2),
        },
        "charts": {
            "monthly_series": monthly_series,
            "vehicle_utilization": demand_data["most_rented_vehicles"],
            "vehicle_type_distribution": vehicle_type_distribution,
            "booking_status_distribution": booking_status_distribution,
            "demand_by_type": demand_data["demand_by_type"],
        },
        "tables": {
            "recent_bookings": recent_bookings,
            "recent_payments": recent_payments,
            "active_rentals": active_rentals_list,
            "completed_rentals": completed_rentals_list,
            "cancelled_bookings": cancelled_bookings_list,
            "vehicles_needing_attention": vehicles_needing_attention,
            "customer_spending": customer_spending,
            "payment_summary": payment_summary,
            "most_rented_vehicles": demand_data["most_rented_vehicles"],
            "most_rented_vehicle_types": demand_data["demand_by_type"],
        },
    }


@router.get("/revenue")
def get_revenue_report(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    summary = get_reports_summary(
        start_date=start_date, end_date=end_date, admin_user=admin_user, db=db
    )
    return {
        "total_revenue": summary["kpis"]["total_revenue"],
        "base_booking_revenue": summary["kpis"]["base_booking_revenue"],
        "late_and_damage_revenue": summary["kpis"]["late_and_damage_revenue"],
        "monthly_revenue": summary["charts"]["monthly_series"],
        "payment_summary": summary["tables"]["payment_summary"],
        "customer_spending": summary["tables"]["customer_spending"],
    }


@router.get("/utilization")
def get_utilization_report(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    demand_data = compute_demand_analysis(db)
    return {
        "overall_utilization_percentage": demand_data[
            "overall_utilization_percentage"
        ],
        "vehicle_utilization": demand_data["most_rented_vehicles"],
        "utilization_by_type": demand_data["demand_by_type"],
    }
