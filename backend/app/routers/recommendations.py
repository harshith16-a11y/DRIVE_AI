from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Customer, Recommendation
from app.auth.security import get_current_user, require_admin
from app.ai.recommender import generate_recommendations_for_customer, WEIGHTS

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])


@router.get("/me")
def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust = (
        db.query(Customer).filter(Customer.user_id == current_user.id).first()
    )
    if not cust:
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

    recommendations = generate_recommendations_for_customer(
        db, cust.id, persist=True
    )
    stored_records = (
        db.query(Recommendation)
        .filter(Recommendation.customer_id == cust.id)
        .order_by(Recommendation.score.desc())
        .all()
    )

    return {
        "customer_id": cust.id,
        "preferences": {
            "preferred_vehicle_type": cust.preferred_vehicle_type,
            "preferred_transmission": cust.preferred_transmission,
            "preferred_fuel": cust.preferred_fuel,
            "preferred_seats": cust.preferred_seats,
            "budget_per_day": float(cust.budget_per_day or 3500.0),
        },
        "weights": WEIGHTS,
        "recommendations": recommendations,
        "stored_count": len(stored_records),
    }


@router.get("/admin/stats")
def get_admin_recommendation_statistics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Recommendation)
        .order_by(Recommendation.score.desc(), Recommendation.id.desc())
        .all()
    )
    serialized = []
    for r in rows:
        cust = r.customer
        user = cust.user if cust else None
        veh = r.vehicle
        serialized.append(
            {
                "id": r.id,
                "customer_id": r.customer_id,
                "customer_name": (
                    user.name if user else f"Customer #{r.customer_id}"
                ),
                "vehicle_id": r.vehicle_id,
                "vehicle_name": (
                    f"{veh.brand} {veh.model}"
                    if veh
                    else f"Vehicle #{r.vehicle_id}"
                ),
                "vehicle_type": veh.vehicle_type if veh else "",
                "daily_rate": float(veh.daily_rate) if veh else 0.0,
                "score": float(r.score),
                "reason": r.reason,
                "matching_factors": (
                    [f.strip() for f in r.matching_factors.split(",")]
                    if r.matching_factors
                    else []
                ),
                "generated_at": (
                    r.generated_at.isoformat() if r.generated_at else None
                ),
            }
        )

    avg_score = (
        round(sum(x["score"] for x in serialized) / len(serialized), 1)
        if serialized
        else 0.0
    )
    high_matches = sum(1 for x in serialized if x["score"] >= 80.0)

    return {
        "total_stored_recommendations": len(serialized),
        "average_score": avg_score,
        "high_confidence_matches": high_matches,
        "weights": WEIGHTS,
        "records": serialized,
    }


@router.get("/{customer_id}")
def get_recommendations_for_customer_id(
    customer_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns explainable AI recommendations for the specified customer_id:
    [ { vehicle_id, score, reason, matching_factors, vehicle } ]
    Sorted highest score first and persisted in PostgreSQL.
    """
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        # Fallback check if user_id was passed instead of customer_id
        cust = (
            db.query(Customer).filter(Customer.user_id == customer_id).first()
        )
    if not cust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    results = generate_recommendations_for_customer(db, cust.id, persist=True)
    return results
