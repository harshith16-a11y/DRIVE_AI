-- ============================================================================
-- AI-DRIVEN VEHICLE RENTAL MANAGEMENT SYSTEM
-- Analytical & Operational SQL Reports (DBMS Demonstration Queries)
-- Demonstrates: INNER/LEFT JOIN, GROUP BY, HAVING, Aggregations, Subqueries,
--               Window Functions, CASE Statements, Date Arithmetic
-- ============================================================================

-- 1. TOTAL BOOKINGS SUMMARY BY STATUS
SELECT
    status AS booking_status,
    COUNT(*) AS total_bookings,
    ROUND(SUM(subtotal), 2) AS total_booking_value,
    ROUND(AVG(total_days), 1) AS avg_rental_days
FROM bookings
GROUP BY status
ORDER BY total_bookings DESC;

-- 2. TOTAL REVENUE (PAID PAYMENTS + LATE/DAMAGE FEES)
SELECT
    COUNT(DISTINCT p.booking_id) AS paid_bookings_count,
    COALESCE(SUM(p.amount), 0.00) AS total_collected_revenue,
    COALESCE((SELECT SUM(late_fee + damage_fee) FROM returns), 0.00) AS total_penalty_revenue,
    ROUND(AVG(p.amount), 2) AS avg_transaction_value
FROM payments p
WHERE p.payment_status = 'PAID';

-- 3. MONTHLY REVENUE & BOOKING TRENDS
SELECT
    TO_CHAR(b.start_date, 'YYYY-MM') AS month,
    COUNT(b.id) AS total_bookings,
    COALESCE(SUM(CASE WHEN p.payment_status = 'PAID' THEN p.amount ELSE 0 END), 0.00) AS monthly_revenue,
    ROUND(AVG(b.total_days), 1) AS avg_duration_days
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.status != 'CANCELLED'
GROUP BY TO_CHAR(b.start_date, 'YYYY-MM')
ORDER BY month ASC;

-- 4. MOST RENTED VEHICLES (FLEET PERFORMANCE LEADERBOARD)
SELECT
    v.id AS vehicle_id,
    v.vehicle_number,
    v.brand,
    v.model,
    v.vehicle_type,
    v.daily_rate,
    COUNT(b.id) AS total_rentals,
    COALESCE(SUM(b.total_days), 0) AS total_days_rented,
    COALESCE(SUM(b.subtotal), 0.00) AS gross_revenue_generated
FROM vehicles v
LEFT JOIN bookings b ON b.vehicle_id = v.id AND b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
GROUP BY v.id, v.vehicle_number, v.brand, v.model, v.vehicle_type, v.daily_rate
ORDER BY total_rentals DESC, gross_revenue_generated DESC;

-- 5. MOST RENTED VEHICLE TYPES
SELECT
    v.vehicle_type,
    COUNT(DISTINCT v.id) AS fleet_count,
    COUNT(b.id) AS rental_count,
    COALESCE(SUM(b.total_days), 0) AS total_rental_days,
    COALESCE(SUM(b.subtotal), 0.00) AS type_revenue,
    ROUND(AVG(v.daily_rate), 2) AS avg_daily_rate
FROM vehicles v
LEFT JOIN bookings b ON b.vehicle_id = v.id AND b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
GROUP BY v.vehicle_type
ORDER BY rental_count DESC;

-- 6. CUSTOMER SPENDING & LOYALTY REPORT
SELECT
    c.id AS customer_id,
    u.name AS customer_name,
    u.email,
    u.phone,
    c.preferred_vehicle_type,
    COUNT(b.id) AS total_bookings,
    COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) AS completed_rentals,
    COALESCE(SUM(CASE WHEN p.payment_status = 'PAID' THEN p.amount ELSE 0 END), 0.00) AS total_spent
FROM customers c
INNER JOIN users u ON u.id = c.user_id
LEFT JOIN bookings b ON b.customer_id = c.id
LEFT JOIN payments p ON p.booking_id = b.id
GROUP BY c.id, u.name, u.email, u.phone, c.preferred_vehicle_type
ORDER BY total_spent DESC;

-- 7. VEHICLE UTILIZATION PERCENTAGE (90-DAY OPERATIONAL WINDOW)
SELECT
    v.id AS vehicle_id,
    v.vehicle_number,
    v.brand || ' ' || v.model AS vehicle_name,
    v.vehicle_type,
    v.status AS current_status,
    COALESCE(SUM(CASE WHEN b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED') THEN b.total_days ELSE 0 END), 0) AS days_utilized,
    ROUND(
        LEAST(
            100.0,
            (COALESCE(SUM(CASE WHEN b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED') THEN b.total_days ELSE 0 END), 0)::NUMERIC / 90.0) * 100.0
        ),
        1
    ) AS utilization_percentage
FROM vehicles v
LEFT JOIN bookings b ON b.vehicle_id = v.id
GROUP BY v.id, v.vehicle_number, v.brand, v.model, v.vehicle_type, v.status
ORDER BY utilization_percentage DESC;

-- 8. ACTIVE RENTALS REPORT
SELECT
    b.id AS booking_id,
    b.booking_reference,
    u.name AS customer_name,
    u.phone AS customer_phone,
    v.vehicle_number,
    v.brand || ' ' || v.model AS vehicle_name,
    b.start_date,
    b.end_date,
    b.total_days,
    b.subtotal,
    b.status
FROM bookings b
INNER JOIN customers c ON c.id = b.customer_id
INNER JOIN users u ON u.id = c.user_id
INNER JOIN vehicles v ON v.id = b.vehicle_id
WHERE b.status IN ('ACTIVE', 'CONFIRMED')
ORDER BY b.start_date ASC;

-- 9. COMPLETED RENTALS & RETURN CONDITION AUDIT
SELECT
    b.booking_reference,
    u.name AS customer_name,
    v.brand || ' ' || v.model AS vehicle_name,
    b.start_date,
    b.end_date,
    r.return_date,
    r.condition,
    r.late_days,
    r.late_fee,
    r.damage_fee,
    r.final_amount
FROM returns r
INNER JOIN bookings b ON b.id = r.booking_id
INNER JOIN customers c ON c.id = b.customer_id
INNER JOIN users u ON u.id = c.user_id
INNER JOIN vehicles v ON v.id = r.vehicle_id
ORDER BY r.return_date DESC;

-- 10. CANCELLED BOOKINGS REPORT
SELECT
    b.booking_reference,
    u.name AS customer_name,
    u.email,
    v.vehicle_number,
    v.brand || ' ' || v.model AS vehicle_name,
    b.start_date,
    b.end_date,
    b.subtotal AS cancelled_value,
    b.updated_at AS cancelled_at
FROM bookings b
INNER JOIN customers c ON c.id = b.customer_id
INNER JOIN users u ON u.id = c.user_id
INNER JOIN vehicles v ON v.id = b.vehicle_id
WHERE b.status = 'CANCELLED'
ORDER BY b.updated_at DESC;

-- 11. PAYMENT SUMMARY BY METHOD AND STATUS
SELECT
    payment_method,
    payment_status,
    COUNT(*) AS transaction_count,
    ROUND(SUM(amount), 2) AS total_amount
FROM payments
GROUP BY payment_method, payment_status
ORDER BY total_amount DESC;

-- 12. DEMAND-ORIENTED ANALYSIS QUERY (BY VEHICLE TYPE)
WITH type_stats AS (
    SELECT
        v.vehicle_type,
        COUNT(DISTINCT v.id) AS total_fleet,
        COUNT(b.id) AS historical_rentals,
        COALESCE(SUM(b.total_days), 0) AS total_days_booked
    FROM vehicles v
    LEFT JOIN bookings b ON b.vehicle_id = v.id AND b.status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
    GROUP BY v.vehicle_type
)
SELECT
    vehicle_type,
    total_fleet,
    historical_rentals,
    total_days_booked,
    CASE
        WHEN historical_rentals >= 5 THEN 'High'
        WHEN historical_rentals >= 3 THEN 'Medium'
        ELSE 'Low'
    END AS current_demand,
    ROUND(historical_rentals * 1.20) AS predicted_demand
FROM type_stats
ORDER BY historical_rentals DESC;
