from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.utils.seed import seed_database
from app.routers import (
    auth,
    customers,
    vehicles,
    bookings,
    payments,
    returns,
    history,
    recommendations,
    reports,
    demand,
    notifications,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Complete DBMS & AI-Driven Vehicle Rental Management System API with "
        "PostgreSQL relational integrity, ACID transaction commit/rollback, "
        "explainable AI vehicle recommendations, and demand-oriented prediction."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(vehicles.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(returns.router)
app.include_router(history.router)
app.include_router(recommendations.router)
app.include_router(reports.router)
app.include_router(demand.router)
app.include_router(notifications.router)


@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    pg_version = db.execute(text("SELECT version();")).scalar()
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "PostgreSQL",
        "postgres_version": pg_version,
    }
