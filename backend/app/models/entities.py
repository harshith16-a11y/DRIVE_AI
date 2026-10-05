from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Numeric,
    Date,
    DateTime,
    Text,
    ForeignKey,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    phone = Column(String(25), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="CUSTOMER", index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint("role IN ('CUSTOMER', 'ADMIN')", name="chk_user_role"),
    )

    # Relationships
    customer = relationship(
        "Customer", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    preferred_vehicle_type = Column(String(50), default="SUV")
    preferred_transmission = Column(String(30), default="Automatic")
    preferred_fuel = Column(String(30), default="Petrol")
    preferred_seats = Column(Integer, default=5)
    budget_per_day = Column(Numeric(10, 2), default=Decimal("3500.00"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "preferred_seats > 0 AND preferred_seats <= 15",
            name="chk_customer_seats",
        ),
        CheckConstraint("budget_per_day > 0", name="chk_customer_budget"),
    )

    # Relationships
    user = relationship("User", back_populates="customer")
    bookings = relationship("Booking", back_populates="customer")
    rental_history = relationship(
        "RentalHistory", back_populates="customer", cascade="all, delete-orphan"
    )
    recommendations = relationship(
        "Recommendation", back_populates="customer", cascade="all, delete-orphan"
    )


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(30), nullable=False, unique=True, index=True)
    brand = Column(String(80), nullable=False)
    model = Column(String(80), nullable=False)
    vehicle_type = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    transmission = Column(String(30), nullable=False)
    fuel_type = Column(String(30), nullable=False)
    seats = Column(Integer, nullable=False)
    color = Column(String(40), nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="AVAILABLE", index=True)
    location = Column(String(100), nullable=False)
    image_url = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "vehicle_type IN ('SUV', 'Sedan', 'Hatchback', 'Luxury', 'Electric')",
            name="chk_vehicle_type",
        ),
        CheckConstraint(
            "transmission IN ('Automatic', 'Manual')", name="chk_vehicle_transmission"
        ),
        CheckConstraint(
            "fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')",
            name="chk_vehicle_fuel",
        ),
        CheckConstraint("seats > 0 AND seats <= 15", name="chk_vehicle_seats"),
        CheckConstraint("daily_rate > 0", name="chk_vehicle_daily_rate"),
        CheckConstraint(
            "status IN ('AVAILABLE', 'BOOKED', 'RENTED', 'MAINTENANCE', 'INACTIVE')",
            name="chk_vehicle_status",
        ),
        Index("idx_vehicles_brand_model", "brand", "model"),
    )

    # Relationships
    bookings = relationship("Booking", back_populates="vehicle")
    returns = relationship("ReturnRecord", back_populates="vehicle")
    rental_history = relationship("RentalHistory", back_populates="vehicle")
    recommendations = relationship(
        "Recommendation", back_populates="vehicle", cascade="all, delete-orphan"
    )
    availability_records = relationship(
        "Availability", back_populates="vehicle", cascade="all, delete-orphan"
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(40), nullable=False, unique=True, index=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), nullable=False, default="PENDING", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint("total_days > 0", name="chk_booking_total_days"),
        CheckConstraint("daily_rate > 0", name="chk_booking_daily_rate"),
        CheckConstraint("subtotal >= 0", name="chk_booking_subtotal"),
        CheckConstraint("end_date > start_date", name="chk_booking_dates"),
        CheckConstraint(
            "status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')",
            name="chk_booking_status",
        ),
        Index("idx_bookings_dates", "start_date", "end_date"),
    )

    # Relationships
    customer = relationship("Customer", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    payments = relationship(
        "Payment", back_populates="booking", cascade="all, delete-orphan"
    )
    return_record = relationship(
        "ReturnRecord",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
    )
    rental_history = relationship(
        "RentalHistory",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(30), nullable=False)
    payment_status = Column(String(30), nullable=False, default="PENDING", index=True)
    transaction_reference = Column(String(60), nullable=False, unique=True)
    paid_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("amount >= 0", name="chk_payment_amount"),
        CheckConstraint(
            "payment_method IN ('UPI', 'CARD', 'CASH', 'DEMO')",
            name="chk_payment_method",
        ),
        CheckConstraint(
            "payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')",
            name="chk_payment_status",
        ),
    )

    # Relationships
    booking = relationship("Booking", back_populates="payments")


class ReturnRecord(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    return_date = Column(Date, nullable=False)
    condition = Column(String(40), nullable=False)
    late_days = Column(Integer, nullable=False, default=0)
    late_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    damage_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    final_amount = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "condition IN ('Good', 'Minor Damage', 'Major Damage')",
            name="chk_return_condition",
        ),
        CheckConstraint("late_days >= 0", name="chk_return_late_days"),
        CheckConstraint("late_fee >= 0", name="chk_return_late_fee"),
        CheckConstraint("damage_fee >= 0", name="chk_return_damage_fee"),
        CheckConstraint("final_amount >= 0", name="chk_return_final_amount"),
    )

    # Relationships
    booking = relationship("Booking", back_populates="return_record")
    vehicle = relationship("Vehicle", back_populates="returns")


class RentalHistory(Base):
    __tablename__ = "rental_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    rented_from = Column(Date, nullable=False)
    rented_to = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (CheckConstraint("amount >= 0", name="chk_history_amount"),)

    # Relationships
    customer = relationship("Customer", back_populates="rental_history")
    vehicle = relationship("Vehicle", back_populates="rental_history")
    booking = relationship("Booking", back_populates="rental_history")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score = Column(Numeric(5, 2), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    matching_factors = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 100", name="chk_recommendation_score"),
    )

    # Relationships
    customer = relationship("Customer", back_populates="recommendations")
    vehicle = relationship("Vehicle", back_populates="recommendations")


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    available_from = Column(Date, nullable=False)
    available_to = Column(Date, nullable=False)
    status = Column(String(30), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "status IN ('AVAILABLE', 'BOOKED', 'RENTED', 'MAINTENANCE')",
            name="chk_availability_status",
        ),
        Index(
            "idx_availability_vehicle_dates",
            "vehicle_id",
            "available_from",
            "available_to",
        ),
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="availability_records")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
