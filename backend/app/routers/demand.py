from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User
from app.auth.security import require_admin
from app.ai.demand import compute_demand_analysis

router = APIRouter(prefix="/demand", tags=["Demand Analysis"])


@router.get("/analysis")
def get_demand_analysis(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns Demand-Oriented AI Analysis & Predictions based on historical PostgreSQL
    rental and booking records.
    """
    return compute_demand_analysis(db)
