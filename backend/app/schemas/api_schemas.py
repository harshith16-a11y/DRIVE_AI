from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# AUTH & USER SCHEMAS
# ============================================================================
class CustomerPreferencesInput(BaseModel):
    preferred_vehicle_type: str = Field(default="SUV")
    preferred_transmission: str = Field(default="Automatic")
    preferred_fuel: str = Field(default="Petrol")
    preferred_seats: int = Field(default=5, ge=1, le=15)
    budget_per_day: float = Field(default=3500.0, gt=0)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=150)
    phone: str = Field(..., min_length=7, max_length=25)
    password: str = Field(..., min_length=6, max_length=100)
    preferred_vehicle_type: str = Field(default="SUV")
    preferred_transmission: str = Field(default="Automatic")
    preferred_fuel: str = Field(default="Petrol")
    preferred_seats: int = Field(default=5, ge=1, le=15)
    budget_per_day: float = Field(default=3500.0, gt=0)


class LoginRequest(BaseModel):
    email: str
    password: str


class CustomerOut(BaseModel):
    id: int
    user_id: int
    preferred_vehicle_type: Optional[str] = "SUV"
    preferred_transmission: Optional[str] = "Automatic"
    preferred_fuel: Optional[str] = "Petrol"
    preferred_seats: Optional[int] = 5
    budget_per_day: float = 3500.0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    customer_id: Optional[int] = None
    preferences: Optional[CustomerOut] = None

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, min_length=7, max_length=25)
    preferred_vehicle_type: Optional[str] = None
    preferred_transmission: Optional[str] = None
    preferred_fuel: Optional[str] = None
    preferred_seats: Optional[int] = Field(None, ge=1, le=15)
    budget_per_day: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


# ============================================================================
# VEHICLE SCHEMAS
# ============================================================================
class VehicleBase(BaseModel):
    vehicle_number: str = Field(..., min_length=3, max_length=30)
    brand: str = Field(..., min_length=2, max_length=80)
    model: str = Field(..., min_length=1, max_length=80)
    vehicle_type: str = Field(..., description="SUV, Sedan, Hatchback, Luxury, Electric")
    year: int = Field(..., ge=2000, le=2030)
    transmission: str = Field(..., description="Automatic or Manual")
    fuel_type: str = Field(..., description="Petrol, Diesel, Electric, Hybrid")
    seats: int = Field(..., gt=0, le=15)
    color: str = Field(..., min_length=2, max_length=40)
    daily_rate: float = Field(..., gt=0)
    status: str = Field(default="AVAILABLE")
    location: str = Field(..., min_length=2, max_length=100)
    image_url: str = Field(default="/vehicles/suv-creta.svg")
    description: str = Field(..., min_length=5)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    vehicle_type: Optional[str] = None
    year: Optional[int] = Field(None, ge=2000, le=2030)
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    seats: Optional[int] = Field(None, gt=0, le=15)
    color: Optional[str] = None
    daily_rate: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class VehicleOut(BaseModel):
    id: int
    vehicle_number: str
    brand: str
    model: str
    vehicle_type: str
    year: int
    transmission: str
    fuel_type: str
    seats: int
    color: str
    daily_rate: float
    status: str
    location: str
    image_url: str
    description: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BOOKING & TRANSACTION SCHEMAS
# ============================================================================
class BookingCreate(BaseModel):
    vehicle_id: int
    start_date: date
    end_date: date
    customer_id: Optional[int] = None


class TransactionalBookingPaymentRequest(BaseModel):
    vehicle_id: int
    start_date: date
    end_date: date
    payment_method: str = Field(default="DEMO", description="UPI, CARD, CASH, DEMO")
    simulate_failure: bool = Field(
        default=False,
        description="If true, triggers an intentional error mid-transaction to demonstrate ACID database rollback",
    )


class BookingStatusUpdate(BaseModel):
    status: str


class PaymentCreate(BaseModel):
    booking_id: int
    payment_method: str = Field(default="DEMO")
    simulate_failure: bool = Field(default=False)


class ReturnCreate(BaseModel):
    booking_id: int
    return_date: date
    condition: str = Field(..., description="Good, Minor Damage, Major Damage")
    notes: Optional[str] = None
