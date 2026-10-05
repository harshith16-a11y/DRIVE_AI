-- ============================================================================
-- AI-DRIVEN VEHICLE RENTAL MANAGEMENT SYSTEM
-- PostgreSQL Relational Database Schema (DDL)
-- Demonstrates: 3NF Normalization, PK, FK, UNIQUE, NOT NULL, CHECK, Indexes, Triggers
-- ============================================================================

-- Drop existing tables in reverse dependency order for clean initialization
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS rental_history CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. CUSTOMERS TABLE (1:1 Extension of Users for Customer Preferences)
-- ============================================================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_vehicle_type VARCHAR(50) DEFAULT 'SUV',
    preferred_transmission VARCHAR(30) DEFAULT 'Automatic',
    preferred_fuel VARCHAR(30) DEFAULT 'Petrol',
    preferred_seats INTEGER DEFAULT 5 CHECK (preferred_seats > 0 AND preferred_seats <= 15),
    budget_per_day NUMERIC(10, 2) DEFAULT 3500.00 CHECK (budget_per_day > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_user_id ON customers(user_id);

-- ============================================================================
-- 3. VEHICLES TABLE
-- ============================================================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(30) NOT NULL UNIQUE,
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('SUV', 'Sedan', 'Hatchback', 'Luxury', 'Electric')),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2030),
    transmission VARCHAR(30) NOT NULL CHECK (transmission IN ('Automatic', 'Manual')),
    fuel_type VARCHAR(30) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
    seats INTEGER NOT NULL CHECK (seats > 0 AND seats <= 15),
    color VARCHAR(40) NOT NULL,
    daily_rate NUMERIC(10, 2) NOT NULL CHECK (daily_rate > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'RENTED', 'MAINTENANCE', 'INACTIVE')),
    location VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);

-- ============================================================================
-- 4. BOOKINGS TABLE
-- ============================================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(40) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    daily_rate NUMERIC(10, 2) NOT NULL CHECK (daily_rate > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'CARD', 'CASH', 'DEMO')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    transaction_reference VARCHAR(60) NOT NULL UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- ============================================================================
-- 6. RETURNS TABLE
-- ============================================================================
CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    return_date DATE NOT NULL,
    condition VARCHAR(40) NOT NULL CHECK (condition IN ('Good', 'Minor Damage', 'Major Damage')),
    late_days INTEGER NOT NULL DEFAULT 0 CHECK (late_days >= 0),
    late_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (late_fee >= 0),
    damage_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (damage_fee >= 0),
    final_amount NUMERIC(12, 2) NOT NULL CHECK (final_amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_returns_booking_id ON returns(booking_id);
CREATE INDEX idx_returns_vehicle_id ON returns(vehicle_id);

-- ============================================================================
-- 7. RENTAL HISTORY TABLE
-- ============================================================================
CREATE TABLE rental_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    rented_from DATE NOT NULL,
    rented_to DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rental_history_customer ON rental_history(customer_id);
CREATE INDEX idx_rental_history_vehicle ON rental_history(vehicle_id);

-- ============================================================================
-- 8. RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    reason TEXT NOT NULL,
    matching_factors TEXT,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_customer ON recommendations(customer_id);
CREATE INDEX idx_recommendations_score ON recommendations(score DESC);

-- ============================================================================
-- 9. AVAILABILITY TABLE
-- ============================================================================
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    available_from DATE NOT NULL,
    available_to DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('AVAILABLE', 'BOOKED', 'RENTED', 'MAINTENANCE'))
);

CREATE INDEX idx_availability_vehicle_dates ON availability(vehicle_id, available_from, available_to);

-- ============================================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ============================================================================
-- TRIGGER FOR AUTOMATIC updated_at TIMESTAMP MAINTENANCE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
