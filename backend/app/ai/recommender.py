from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import (
    Customer,
    Vehicle,
    Booking,
    RentalHistory,
    Recommendation,
)

# Exact 100-point transparent weighting as specified in requirements
WEIGHTS = {
    "vehicle_type_match": 25,
    "transmission_match": 15,
    "fuel_match": 10,
    "seats_match": 10,
    "budget_match": 20,
    "rental_history_match": 20,
}


def generate_recommendations_for_customer(
    db: Session, customer_id: int, persist: bool = True
) -> List[Dict[str, Any]]:
    """
    Computes explainable AI vehicle recommendations for a customer based on:
    1. Customer profile preferences (type, transmission, fuel, seats, budget_per_day)
    2. Customer historical rentals & bookings (previously rented vehicle types & brands)
    3. Available fleet vehicles

    Persists the generated scores and reasons into the PostgreSQL `recommendations` table.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return []

    # Retrieve customer's past bookings and rental history to learn behavioral affinity
    past_bookings = (
        db.query(Booking)
        .filter(
            Booking.customer_id == customer.id,
            Booking.status.in_(["CONFIRMED", "ACTIVE", "COMPLETED"]),
        )
        .all()
    )
    past_history = (
        db.query(RentalHistory)
        .filter(RentalHistory.customer_id == customer.id)
        .all()
    )

    past_vehicle_ids = {b.vehicle_id for b in past_bookings} | {
        h.vehicle_id for h in past_history
    }

    past_types = set()
    past_brands = set()
    if past_vehicle_ids:
        past_vehicles = (
            db.query(Vehicle).filter(Vehicle.id.in_(past_vehicle_ids)).all()
        )
        for pv in past_vehicles:
            past_types.add((pv.vehicle_type or "").lower())
            past_brands.add((pv.brand or "").lower())

    # Candidate vehicles: prioritize AVAILABLE, also evaluate BOOKED/RENTED for future dates
    vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.status.in_(["AVAILABLE", "BOOKED", "RENTED"]))
        .all()
    )

    pref_type = (customer.preferred_vehicle_type or "SUV").strip()
    pref_trans = (customer.preferred_transmission or "Automatic").strip()
    pref_fuel = (customer.preferred_fuel or "Petrol").strip()
    pref_seats = int(customer.preferred_seats or 5)
    budget = float(customer.budget_per_day or 3500.0)

    results: List[Dict[str, Any]] = []

    for v in vehicles:
        score = 0.0
        matching_factors: List[str] = []
        reason_parts: List[str] = []
        factor_breakdown: Dict[str, float] = {}

        # 1. Vehicle Type Match (25 points)
        if v.vehicle_type.lower() == pref_type.lower():
            score += WEIGHTS["vehicle_type_match"]
            factor_breakdown["vehicle_type_match"] = 25.0
            matching_factors.append(f"{v.vehicle_type} Type (+25)")
            reason_parts.append(f"preferred {v.vehicle_type} type")
        elif v.vehicle_type.lower() in ("suv", "electric") and pref_type.lower() in (
            "suv",
            "electric",
        ):
            score += 10.0
            factor_breakdown["vehicle_type_match"] = 10.0
            matching_factors.append(f"Crossover/SUV Style (+10)")
        else:
            factor_breakdown["vehicle_type_match"] = 0.0

        # 2. Transmission Match (15 points)
        if v.transmission.lower() == pref_trans.lower():
            score += WEIGHTS["transmission_match"]
            factor_breakdown["transmission_match"] = 15.0
            matching_factors.append(f"{v.transmission} (+15)")
            reason_parts.append(f"{v.transmission.lower()} transmission")
        else:
            factor_breakdown["transmission_match"] = 0.0

        # 3. Fuel Match (10 points)
        if v.fuel_type.lower() == pref_fuel.lower():
            score += WEIGHTS["fuel_match"]
            factor_breakdown["fuel_match"] = 10.0
            matching_factors.append(f"{v.fuel_type} Fuel (+10)")
            reason_parts.append(f"{v.fuel_type.lower()} fuel")
        elif v.fuel_type.lower() in ("electric", "hybrid"):
            score += 5.0
            factor_breakdown["fuel_match"] = 5.0
            matching_factors.append(f"Eco {v.fuel_type} (+5)")
        else:
            factor_breakdown["fuel_match"] = 0.0

        # 4. Seats Match (10 points)
        if v.seats == pref_seats:
            score += WEIGHTS["seats_match"]
            factor_breakdown["seats_match"] = 10.0
            matching_factors.append(f"{v.seats} Seats (+10)")
            reason_parts.append(f"{v.seats}-seat requirement")
        elif v.seats > pref_seats:
            score += 8.0
            factor_breakdown["seats_match"] = 8.0
            matching_factors.append(f"{v.seats} Seats Capacity (+8)")
            reason_parts.append(f"{v.seats}-seat spacious capacity")
        else:
            factor_breakdown["seats_match"] = 0.0

        # 5. Budget Match (20 points)
        v_rate = float(v.daily_rate)
        if v_rate <= budget:
            score += WEIGHTS["budget_match"]
            factor_breakdown["budget_match"] = 20.0
            matching_factors.append(f"Within Budget ₹{int(v_rate)}/day (+20)")
            reason_parts.append(f"fits within your ₹{int(budget):,}/day budget")
        elif v_rate <= budget * 1.25:
            # Partial linear score if within 25% of daily budget
            ratio = 1.0 - ((v_rate - budget) / (budget * 0.25))
            partial_budget = round(max(4.0, 14.0 * ratio), 1)
            score += partial_budget
            factor_breakdown["budget_match"] = partial_budget
            matching_factors.append(f"Near Budget (+{int(partial_budget)})")
            reason_parts.append("close to your daily budget")
        else:
            factor_breakdown["budget_match"] = 0.0

        # 6. Rental History Match (20 points)
        hist_pts = 0.0
        if v.id in past_vehicle_ids:
            hist_pts = 20.0
            matching_factors.append("Previously Rented Model (+20)")
            reason_parts.append(f"you previously rented the {v.brand} {v.model}")
        elif (
            v.vehicle_type.lower() in past_types
            and v.brand.lower() in past_brands
        ):
            hist_pts = 20.0
            matching_factors.append(f"Past {v.brand} {v.vehicle_type} Affinity (+20)")
            reason_parts.append(
                f"similar to your previous {v.brand} {v.vehicle_type} rentals"
            )
        elif v.vehicle_type.lower() in past_types:
            hist_pts = 15.0
            matching_factors.append(f"Past {v.vehicle_type} History (+15)")
            reason_parts.append(f"matches your past {v.vehicle_type} rental history")
        elif v.brand.lower() in past_brands:
            hist_pts = 12.0
            matching_factors.append(f"Past {v.brand} Brand Affinity (+12)")
            reason_parts.append(f"matches your previously rented {v.brand} brand")
        elif not past_vehicle_ids and v.vehicle_type.lower() == pref_type.lower():
            # Cold-start bonus for new customers with no history yet
            hist_pts = 14.0
            matching_factors.append("New Customer Profile Match (+14)")
            reason_parts.append("tailored to your initial profile preferences")

        score += hist_pts
        factor_breakdown["rental_history_match"] = hist_pts

        # Availability adjustment: slightly prioritize immediately AVAILABLE vehicles in ordering
        final_score = round(min(100.0, score), 1)

        if reason_parts:
            if len(reason_parts) > 1:
                joined_reasons = (
                    ", ".join(reason_parts[:-1]) + " and " + reason_parts[-1]
                )
            else:
                joined_reasons = reason_parts[0]
            reason_text = (
                f"{int(final_score)}% match — Recommended because it matches your "
                f"{joined_reasons}."
            )
        else:
            reason_text = (
                f"{int(final_score)}% match — Available {v.brand} {v.model} "
                f"({v.vehicle_type}) option at {v.location}."
            )

        from app.routers.vehicles import _serialize_vehicle

        results.append(
            {
                "vehicle_id": v.id,
                "score": final_score,
                "reason": reason_text,
                "matching_factors": matching_factors,
                "factor_breakdown": factor_breakdown,
                "vehicle": _serialize_vehicle(v),
            }
        )

    # Sort highest score first, with AVAILABLE status as tie-breaker
    results.sort(
        key=lambda item: (
            item["score"],
            1 if item["vehicle"]["status"] == "AVAILABLE" else 0,
        ),
        reverse=True,
    )

    if persist and results:
        try:
            # Replace previous snapshot for this customer so recommendations table stays fresh
            db.query(Recommendation).filter(
                Recommendation.customer_id == customer.id
            ).delete(synchronize_session=False)
            for item in results[:8]:
                rec = Recommendation(
                    customer_id=customer.id,
                    vehicle_id=item["vehicle_id"],
                    score=Decimal(str(item["score"])),
                    reason=item["reason"],
                    matching_factors=", ".join(item["matching_factors"]),
                )
                db.add(rec)
            db.commit()
        except Exception:
            db.rollback()

    return results
