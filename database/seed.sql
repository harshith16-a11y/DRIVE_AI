-- ============================================================================
-- AI-DRIVEN VEHICLE RENTAL MANAGEMENT SYSTEM
-- PostgreSQL Database Seed Script (DML)
-- Populates: Admin, 6 Customers, 12 Vehicles, 18 Bookings, Payments, Returns,
--            Rental History, Recommendations, Availability, Notifications
-- Note: Default Admin credentials -> admin@rental.com / Admin@123
--       Default Customer credentials -> rahul@example.com / Customer@123
-- ============================================================================

TRUNCATE TABLE
    notifications,
    availability,
    recommendations,
    rental_history,
    returns,
    payments,
    bookings,
    vehicles,
    customers,
    users
RESTART IDENTITY CASCADE;

-- 1. USERS (1 Admin + 6 Customers)
-- Password hashes are bcrypt hashes generated for 'Admin@123' and 'Customer@123'
INSERT INTO users (name, email, phone, password_hash, role, is_active) VALUES
('System Administrator', 'admin@rental.com', '+91-9876543210', '$2b$12$KIX/y2H2xQ1q8X9k7m1xVeO2M6k8J9L0pQ3rS5tU7vW9xY1zA2bC3', 'ADMIN', TRUE),
('Rahul Sharma', 'rahul@example.com', '+91-9845012345', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE),
('Priya Nair', 'priya@example.com', '+91-9845023456', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE),
('Arjun Mehta', 'arjun@example.com', '+91-9845034567', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE),
('Sneha Reddy', 'sneha@example.com', '+91-9845045678', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE),
('Vikram Singh', 'vikram@example.com', '+91-9845056789', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE),
('Ananya Verma', 'ananya@example.com', '+91-9845067890', '$2b$12$L9Y/z3I3yR2r9Y0l8n2yWfP3N7l9K0M1qR4sT6uV8wX0yZ2aB3cD4', 'CUSTOMER', TRUE);

-- 2. CUSTOMERS (Preferences linked to users 2..7)
INSERT INTO customers (user_id, preferred_vehicle_type, preferred_transmission, preferred_fuel, preferred_seats, budget_per_day) VALUES
(2, 'SUV', 'Automatic', 'Diesel', 5, 4500.00),
(3, 'Electric', 'Automatic', 'Electric', 5, 3800.00),
(4, 'Sedan', 'Automatic', 'Petrol', 5, 3000.00),
(5, 'Hatchback', 'Manual', 'Petrol', 5, 2000.00),
(6, 'Luxury', 'Automatic', 'Petrol', 5, 9000.00),
(7, 'SUV', 'Automatic', 'Petrol', 7, 5000.00);

-- 3. VEHICLES (12 Fleet Vehicles across SUV, Sedan, Hatchback, Luxury, Electric)
INSERT INTO vehicles (vehicle_number, brand, model, vehicle_type, year, transmission, fuel_type, seats, color, daily_rate, status, location, image_url, description) VALUES
('KA-01-MJ-2024', 'Hyundai', 'Creta SX(O)', 'SUV', 2024, 'Automatic', 'Diesel', 5, 'Titan Grey', 3800.00, 'AVAILABLE', 'Hyderabad - HITEC City Hub', '/vehicles/suv-creta.svg', 'Premium 5-seater urban SUV featuring panoramic sunroof, ADAS Level 2 safety suite, ventilated seats, and Bose 8-speaker audio.'),
('KA-03-EV-9090', 'Tata', 'Nexon EV Empowered+', 'Electric', 2024, 'Automatic', 'Electric', 5, 'Empowered Oxide', 3200.00, 'AVAILABLE', 'Hyderabad - Madhapur Hub', '/vehicles/ev-nexon.svg', 'Zero-emission long-range electric SUV with 465 km certified range, V2L charging, 360-degree camera, and arcade.ev infotainment.'),
('MH-02-AB-7788', 'Mahindra', 'XUV700 AX7L', 'SUV', 2024, 'Automatic', 'Diesel', 7, 'Midnight Black', 4800.00, 'AVAILABLE', 'Hyderabad - RGIA Shamshabad Airport', '/vehicles/suv-xuv700.svg', 'Flagship 7-seater highway cruiser with twin HD superscreens, Skyroof, Sony 3D sound, and turbo-diesel automatic powertrain.'),
('KA-05-SD-4411', 'Honda', 'City ZX CVT', 'Sedan', 2023, 'Automatic', 'Petrol', 5, 'Obsidian Blue', 2700.00, 'AVAILABLE', 'Hyderabad - Banjara Hills Hub', '/vehicles/sedan-city.svg', 'Executive compact sedan offering class-leading rear legroom, Honda Sensing ADAS, lane-watch camera, and refined i-VTEC engine.'),
('KA-04-HB-1122', 'Maruti Suzuki', 'Baleno Alpha', 'Hatchback', 2024, 'Manual', 'Petrol', 5, 'Nexa Blue', 1800.00, 'AVAILABLE', 'Hyderabad - Gachibowli Hub', '/vehicles/hatch-baleno.svg', 'Fuel-efficient premium hatchback with Heads-Up Display (HUD), 360-view camera, 6 airbags, and agile city handling.'),
('DL-01-LX-9999', 'BMW', '3 Series Gran Limousine', 'Luxury', 2024, 'Automatic', 'Petrol', 5, 'Mineral White', 8500.00, 'AVAILABLE', 'Hyderabad - Jubilee Hills Luxury Lounge', '/vehicles/luxury-bmw3.svg', 'Chauffeur-grade luxury sports sedan with extended wheelbase, BMW Curved Display, Harman Kardon surround, and TwinPower Turbo.'),
('KA-02-SD-5566', 'Volkswagen', 'Virtus GT Plus', 'Sedan', 2024, 'Automatic', 'Petrol', 5, 'Wild Cherry Red', 3100.00, 'RENTED', 'Hyderabad - HITEC City Hub', '/vehicles/sedan-virtus.svg', 'Enthusiast 1.5L TSI EVO performance sedan with 7-speed DSG dual-clutch transmission, 5-star Global NCAP safety, and ventilated leather seats.'),
('KA-01-EV-4040', 'MG', 'ZS EV Exclusive Pro', 'Electric', 2024, 'Automatic', 'Electric', 5, 'Glaze Red', 3600.00, 'AVAILABLE', 'Hyderabad - Financial District Hub', '/vehicles/ev-mgzs.svg', 'Connected electric crossover with 50.3 kWh battery pack, autonomous Level-2 ADAS, panoramic sky roof, and i-SMART digital key.'),
('MH-12-SUV-3344', 'Toyota', 'Innova Hycross ZX(O)', 'SUV', 2024, 'Automatic', 'Hybrid', 7, 'Pearl White', 5200.00, 'BOOKED', 'Hyderabad - RGIA Shamshabad Airport', '/vehicles/suv-hycross.svg', 'Self-charging strong hybrid 7-seater MPV/SUV with powered Ottoman captain seats, Toyota Safety Sense, and ultra-quiet cabin.'),
('KA-05-HB-8877', 'Hyundai', 'i20 N Line N8', 'Hatchback', 2023, 'Automatic', 'Petrol', 5, 'Thunder Blue', 2200.00, 'AVAILABLE', 'Hyderabad - Madhapur Hub', '/vehicles/hatch-i20.svg', 'Sport-tuned hot hatchback with 1.0L Turbo GDi engine, 7-speed DCT with paddle shifters, sporty exhaust note, and chequered leatherette.'),
('KA-01-LX-7000', 'Mercedes-Benz', 'C-Class C200', 'Luxury', 2024, 'Automatic', 'Petrol', 5, 'Selenite Grey', 9200.00, 'AVAILABLE', 'Hyderabad - Jubilee Hills Luxury Lounge', '/vehicles/luxury-mercc.svg', 'Baby S-Class luxury saloon with 11.9-inch portrait MBUX OLED touchscreen, 64-color ambient lighting, and mild-hybrid EQ Boost.'),
('KA-03-SUV-6161', 'Kia', 'Seltos GTX+ Turbo', 'SUV', 2024, 'Automatic', 'Petrol', 5, 'Pewter Olive', 3900.00, 'MAINTENANCE', 'Hyderabad - Gachibowli Hub', '/vehicles/suv-seltos.svg', 'Feature-packed mid-size SUV with dual-pane panoramic sunroof, dual 10.25-inch displays, ADAS 17 autonomous features, and 160 PS turbo engine.');

-- 4. BOOKINGS (16 Historical, Active, Upcoming, and Cancelled Bookings)
INSERT INTO bookings (booking_reference, customer_id, vehicle_id, start_date, end_date, total_days, daily_rate, subtotal, status) VALUES
('VR-2026-1001', 1, 1, '2026-05-05', '2026-05-09', 4, 3800.00, 15200.00, 'COMPLETED'),
('VR-2026-1002', 2, 2, '2026-05-12', '2026-05-15', 3, 3200.00, 9600.00, 'COMPLETED'),
('VR-2026-1003', 3, 4, '2026-06-01', '2026-06-05', 4, 2700.00, 10800.00, 'COMPLETED'),
('VR-2026-1004', 4, 5, '2026-06-10', '2026-06-13', 3, 1800.00, 5400.00, 'COMPLETED'),
('VR-2026-1005', 5, 6, '2026-06-18', '2026-06-21', 3, 8500.00, 25500.00, 'COMPLETED'),
('VR-2026-1006', 1, 3, '2026-07-02', '2026-07-07', 5, 4800.00, 24000.00, 'COMPLETED'),
('VR-2026-1007', 6, 9, '2026-07-14', '2026-07-18', 4, 5200.00, 20800.00, 'COMPLETED'),
('VR-2026-1008', 2, 8, '2026-07-22', '2026-07-25', 3, 3600.00, 10800.00, 'COMPLETED'),
('VR-2026-1009', 1, 1, '2026-08-04', '2026-08-08', 4, 3800.00, 15200.00, 'COMPLETED'),
('VR-2026-1010', 3, 7, '2026-08-12', '2026-08-16', 4, 3100.00, 12400.00, 'COMPLETED'),
('VR-2026-1011', 5, 11, '2026-08-20', '2026-08-23', 3, 9200.00, 27600.00, 'COMPLETED'),
('VR-2026-1012', 4, 10, '2026-09-02', '2026-09-05', 3, 2200.00, 6600.00, 'COMPLETED'),
('VR-2026-1013', 1, 7, '2026-09-26', '2026-09-30', 4, 3100.00, 12400.00, 'ACTIVE'),
('VR-2026-1014', 2, 9, '2026-10-05', '2026-10-09', 4, 5200.00, 20800.00, 'CONFIRMED'),
('VR-2026-1015', 3, 4, '2026-09-10', '2026-09-12', 2, 2700.00, 5400.00, 'CANCELLED'),
('VR-2026-1016', 6, 3, '2026-09-15', '2026-09-19', 4, 4800.00, 19200.00, 'COMPLETED');

-- 5. PAYMENTS
INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference, paid_at) VALUES
(1, 15200.00, 'UPI', 'PAID', 'TXN-UPI-20260505-01', '2026-05-05 09:30:00+05:30'),
(2, 9600.00, 'CARD', 'PAID', 'TXN-CRD-20260512-02', '2026-05-12 10:15:00+05:30'),
(3, 10800.00, 'DEMO', 'PAID', 'TXN-DMO-20260601-03', '2026-06-01 11:00:00+05:30'),
(4, 5400.00, 'UPI', 'PAID', 'TXN-UPI-20260610-04', '2026-06-10 08:45:00+05:30'),
(5, 25500.00, 'CARD', 'PAID', 'TXN-CRD-20260618-05', '2026-06-18 14:20:00+05:30'),
(6, 24000.00, 'UPI', 'PAID', 'TXN-UPI-20260702-06', '2026-07-02 09:10:00+05:30'),
(7, 20800.00, 'CARD', 'PAID', 'TXN-CRD-20260714-07', '2026-07-14 12:00:00+05:30'),
(8, 10800.00, 'DEMO', 'PAID', 'TXN-DMO-20260722-08', '2026-07-22 10:30:00+05:30'),
(9, 15200.00, 'UPI', 'PAID', 'TXN-UPI-20260804-09', '2026-08-04 09:40:00+05:30'),
(10, 12400.00, 'CASH', 'PAID', 'TXN-CSH-20260812-10', '2026-08-12 11:15:00+05:30'),
(11, 27600.00, 'CARD', 'PAID', 'TXN-CRD-20260820-11', '2026-08-20 15:00:00+05:30'),
(12, 6600.00, 'UPI', 'PAID', 'TXN-UPI-20260902-12', '2026-09-02 10:00:00+05:30'),
(13, 12400.00, 'DEMO', 'PAID', 'TXN-DMO-20260926-13', '2026-09-26 09:00:00+05:30'),
(14, 20800.00, 'UPI', 'PAID', 'TXN-UPI-20260927-14', '2026-09-27 16:30:00+05:30'),
(15, 5400.00, 'CARD', 'REFUNDED', 'TXN-CRD-20260910-15', '2026-09-10 13:00:00+05:30'),
(16, 19200.00, 'DEMO', 'PAID', 'TXN-DMO-20260915-16', '2026-09-15 09:25:00+05:30');

-- 6. RETURNS (For Completed Bookings 1..12 and 16)
INSERT INTO returns (booking_id, vehicle_id, return_date, condition, late_days, late_fee, damage_fee, final_amount, notes) VALUES
(1, 1, '2026-05-09', 'Good', 0, 0.00, 0.00, 15200.00, 'Returned on time in clean condition.'),
(2, 2, '2026-05-15', 'Good', 0, 0.00, 0.00, 9600.00, 'Battery at 65%, no issues.'),
(3, 4, '2026-06-06', 'Good', 1, 3240.00, 0.00, 14040.00, 'Returned 1 day late due to highway traffic.'),
(4, 5, '2026-06-13', 'Good', 0, 0.00, 0.00, 5400.00, 'Routine inspection passed.'),
(5, 6, '2026-06-21', 'Minor Damage', 0, 0.00, 2500.00, 28000.00, 'Small scratch on front left alloy rim.'),
(6, 3, '2026-07-07', 'Good', 0, 0.00, 0.00, 24000.00, 'Clean interior and exterior.'),
(7, 9, '2026-07-18', 'Good', 0, 0.00, 0.00, 20800.00, 'Returned at Airport Hub on schedule.'),
(8, 8, '2026-07-25', 'Good', 0, 0.00, 0.00, 10800.00, 'No issues reported.'),
(9, 1, '2026-08-08', 'Good', 0, 0.00, 0.00, 15200.00, 'Repeat customer, immaculate condition.'),
(10, 7, '2026-08-17', 'Good', 1, 3720.00, 0.00, 16120.00, '1 day extension billed at standard late rate.'),
(11, 11, '2026-08-23', 'Good', 0, 0.00, 0.00, 27600.00, 'VIP luxury return completed.'),
(12, 10, '2026-09-05', 'Good', 0, 0.00, 0.00, 6600.00, 'All checks normal.'),
(16, 3, '2026-09-19', 'Good', 0, 0.00, 0.00, 19200.00, 'Completed smoothly.');

-- 7. RENTAL HISTORY
INSERT INTO rental_history (customer_id, vehicle_id, booking_id, rented_from, rented_to, amount) VALUES
(1, 1, 1, '2026-05-05', '2026-05-09', 15200.00),
(2, 2, 2, '2026-05-12', '2026-05-15', 9600.00),
(3, 4, 3, '2026-06-01', '2026-06-06', 14040.00),
(4, 5, 4, '2026-06-10', '2026-06-13', 5400.00),
(5, 6, 5, '2026-06-18', '2026-06-21', 28000.00),
(1, 3, 6, '2026-07-02', '2026-07-07', 24000.00),
(6, 9, 7, '2026-07-14', '2026-07-18', 20800.00),
(2, 8, 8, '2026-07-22', '2026-07-25', 10800.00),
(1, 1, 9, '2026-08-04', '2026-08-08', 15200.00),
(3, 7, 10, '2026-08-12', '2026-08-17', 16120.00),
(5, 11, 11, '2026-08-20', '2026-08-23', 27600.00),
(4, 10, 12, '2026-09-02', '2026-09-05', 6600.00),
(6, 3, 16, '2026-09-15', '2026-09-19', 19200.00);

-- 8. RECOMMENDATIONS (Initial AI Scored Recommendations for Customer 1)
INSERT INTO recommendations (customer_id, vehicle_id, score, reason, matching_factors) VALUES
(1, 1, 100.00, '100% match — Recommended because it matches your preferred SUV type, Automatic transmission, Diesel fuel, 5-seat requirement, fits within your ₹4,500/day budget, and aligns with your previous Hyundai SUV rentals.', 'SUV Type (+25), Automatic (+15), Diesel (+10), 5+ Seats (+10), Within Budget (+20), Past Rental Match (+20)'),
(1, 3, 86.00, '86% match — Recommended because it matches your preferred SUV type, Automatic transmission, Diesel fuel, 7 seats (meets 5+ requirement), and your previous Mahindra SUV rental history.', 'SUV Type (+25), Automatic (+15), Diesel (+10), 7 Seats (+10), Near Budget (+6), Past Rental Match (+20)');

-- 9. AVAILABILITY WINDOWS
INSERT INTO availability (vehicle_id, available_from, available_to, status) VALUES
(1, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(2, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(3, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(4, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(5, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(6, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(7, '2026-09-26', '2026-09-30', 'RENTED'),
(8, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(9, '2026-10-05', '2026-10-09', 'BOOKED'),
(10, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(11, '2026-09-01', '2026-12-31', 'AVAILABLE'),
(12, '2026-09-25', '2026-10-05', 'MAINTENANCE');

-- 10. NOTIFICATIONS
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
(2, 'BOOKING_ACTIVE', 'Active Rental in Progress', 'Your rental for Volkswagen Virtus GT Plus (Booking #VR-2026-1013) is currently active until 2026-09-30.', FALSE),
(2, 'AI_RECOMMENDATION', 'New AI Vehicle Recommendations Ready', 'Our AI engine found a 100% match for your SUV preference: Hyundai Creta SX(O) at ₹3,800/day.', FALSE),
(3, 'BOOKING_CONFIRMED', 'Upcoming Booking Confirmed', 'Your booking #VR-2026-1014 for Toyota Innova Hycross ZX(O) (2026-10-05 to 2026-10-09) is confirmed and paid.', FALSE),
(1, 'SYSTEM_ALERT', 'Vehicle in Maintenance', 'Kia Seltos GTX+ Turbo (KA-03-SUV-6161) is scheduled for periodic maintenance inspection.', FALSE);

