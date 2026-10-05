# AI-Driven Vehicle Rental Management System

A complete, full-stack **Database Management Systems (DBMS) & Explainable AI** web application demonstrating normalized PostgreSQL relational database design, ACID transaction management (`BEGIN` / `COMMIT` / `ROLLBACK`), conflict-free vehicle availability checking, a 100-point weighted AI recommendation engine, demand-oriented predictive analytics, and 12 SQL-powered business intelligence reports.

---

## 1. Project Overview

The **AI-Driven Vehicle Rental Management System** manages the end-to-end vehicle rental lifecycle for two primary roles:
- **Customer**: Registration with preferences, role-based JWT login, multi-criteria vehicle search & filtering, live date availability verification, explainable AI vehicle recommendations, booking creation, atomic demo payment checkout, active rental management, vehicle return with automated late/damage fee billing, and searchable rental history.
- **Admin**: Executive dashboard with 7 live PostgreSQL KPIs and 6 interactive charts, full Vehicle CRUD, Customer CRM, Booking management, Payment ledger, Return inspection processing, 12 SQL analytical reports with CSV export, and Demand-Oriented AI prediction.

---

## 2. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite + Tailwind CSS + Recharts            │
│       Customer Portal (Navbar UI)   │   Admin Console (Sidebar UI)      │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │ REST API (Axios + JWT Bearer)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FastAPI + SQLAlchemy 2.0 + Pydantic v2              │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ ACID Transaction Svc │  │ 100-Pt Explainable  │  │ Demand-Oriented│  │
│  │ (Commit & Rollback)  │  │ AI Recommender      │  │ Predictor      │  │
│  └──────────────────────┘  └─────────────────────┘  └────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │ psycopg3 Connection Pool
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Relational Database (10 Tables)             │
│  users, customers, vehicles, bookings, payments, returns,               │
│  rental_history, recommendations, availability, notifications           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Database**: PostgreSQL 16+ / 18 (`database/schema.sql`, `database/seed.sql`, `database/reports.sql`)
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, PyJWT, bcrypt, psycopg, Uvicorn, Pytest
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons
- **Deployment**: Docker & `docker-compose.yml`

---

## 4. Database Design & ER Relationships

The PostgreSQL schema (`database/schema.sql`) is normalized to **Third Normal Form (3NF)** across **10 core tables**:

1. `users`: Stores authentication credentials (`email` UNIQUE, `password_hash`, `role` CHECK IN `('CUSTOMER','ADMIN')`).
2. `customers`: 1:1 extension of `users` (`user_id` FK UNIQUE) storing AI preferences (`preferred_vehicle_type`, `preferred_transmission`, `preferred_fuel`, `preferred_seats`, `budget_per_day`).
3. `vehicles`: Fleet inventory (`vehicle_number` UNIQUE, `brand`, `model`, `vehicle_type`, `daily_rate` CHECK > 0, `status` CHECK IN `('AVAILABLE','BOOKED','RENTED','MAINTENANCE','INACTIVE')`).
4. `bookings`: Reservations (`booking_reference` UNIQUE, `customer_id` FK, `vehicle_id` FK, `start_date`, `end_date`, `total_days`, `daily_rate`, `subtotal`, `status`, CHECK `end_date > start_date`).
5. `payments`: Financial transactions (`booking_id` FK, `amount`, `payment_method` CHECK IN `('UPI','CARD','CASH','DEMO')`, `payment_status` CHECK IN `('PENDING','PAID','FAILED','REFUNDED')`, `transaction_reference` UNIQUE).
6. `returns`: Vehicle return inspections (`booking_id` FK UNIQUE, `vehicle_id` FK, `return_date`, `condition` CHECK IN `('Good','Minor Damage','Major Damage')`, `late_days`, `late_fee`, `damage_fee`, `final_amount`).
7. `rental_history`: Permanent audit log of completed rentals (`customer_id` FK, `vehicle_id` FK, `booking_id` FK UNIQUE, `rented_from`, `rented_to`, `amount`).
8. `recommendations`: Persisted AI recommendation scores and explanations (`customer_id` FK, `vehicle_id` FK, `score` CHECK 0..100, `reason`, `matching_factors`).
9. `availability`: Date-range availability tracking (`vehicle_id` FK, `available_from`, `available_to`, `status`).
10. `notifications`: In-app event alerts (`user_id` FK, `type`, `title`, `message`, `is_read`).

### Entity Relationships
- `User (1) ─── (1) Customer`
- `Customer (1) ─── (N) Bookings | (N) RentalHistory | (N) Recommendations`
- `Vehicle (1) ─── (N) Bookings | (N) Returns | (N) RentalHistory | (N) Recommendations | (N) Availability`
- `Booking (1) ─── (N) Payments | (1) Return | (1) RentalHistory`

---

## 5. Explainable AI Recommendation Logic (`backend/app/ai/recommender.py`)

Each candidate vehicle is evaluated using a **transparent 100-point weighted scoring model**:
- **Vehicle Type Match**: `25 points` (exact match with customer's `preferred_vehicle_type`)
- **Budget Match**: `20 points` (full 20 points when `daily_rate <= budget_per_day`; scaled partial credit when within 25% of budget)
- **Rental History Affinity**: `20 points` (matches vehicle models, types, or brands previously rented by the customer)
- **Transmission Match**: `15 points` (matches `preferred_transmission`)
- **Fuel Type Match**: `10 points` (matches `preferred_fuel`)
- **Seating Capacity Match**: `10 points` (meets or matches `preferred_seats`)

All generated scores, factor breakdowns, and human-readable explanations (`reason`) are persisted in the PostgreSQL `recommendations` table.

---

## 6. Demand-Oriented AI Analysis Logic (`backend/app/ai/demand.py`)

Using historical operational records from `bookings` and `rental_history`, the service computes:
- Historical rentals, total rental days, and 90-day fleet utilization percentage per category and per vehicle.
- **Current Demand Tier** (`High`, `Medium`, `Low`) based on rental frequency and utilization.
- **Demand-oriented prediction** (`predicted_demand`) using a weighted moving average of monthly booking momentum combined with active customer preference signals.

---

## 7. Modular REST API Endpoints

- **Auth (`/auth`)**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- **Customers (`/customers`)**: `GET /customers`, `GET /customers/me`, `PUT /customers/me`, `GET /customers/{id}`, `PUT /customers/{id}`, `DELETE /customers/{id}`
- **Vehicles (`/vehicles`)**: `GET /vehicles`, `GET /vehicles/{id}`, `GET /vehicles/{id}/availability`, `POST /vehicles`, `PUT /vehicles/{id}`, `DELETE /vehicles/{id}`
- **Bookings (`/bookings`)**: `GET /bookings`, `POST /bookings`, `POST /bookings/transactional`, `GET /bookings/{id}`, `PUT /bookings/{id}`, `DELETE /bookings/{id}`
- **Payments (`/payments`)**: `POST /payments`, `GET /payments`
- **Returns (`/returns`)**: `POST /returns`, `GET /returns`
- **History (`/history`)**: `GET /history`
- **AI Recommendations (`/recommendations`)**: `GET /recommendations/me`, `GET /recommendations/{customer_id}`, `GET /recommendations/admin/stats`
- **Reports (`/reports`)**: `GET /reports/summary`, `GET /reports/revenue`, `GET /reports/utilization`
- **Demand Analysis (`/demand`)**: `GET /demand/analysis`
- **Notifications (`/notifications`)**: `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`

---

## 8. Setup & Execution Instructions

### Environment Configuration (`.env`)
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5433/vehicle_rental_db
JWT_SECRET=super_secret_dbms_vehicle_rental_jwt_key_2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Run Backend (FastAPI + PostgreSQL)
```powershell
cd backend
python -m pip install -r requirements.txt
python -m app.utils.seed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Backend API: `http://127.0.0.1:8000`
- Swagger OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Run Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- Frontend Application: `http://localhost:5173`

### Run Automated Test Suite
```powershell
cd backend
python -m pytest tests/test_full_system.py -v
```

### Run with Docker Compose
```bash
docker compose up --build -d
```

---

## 9. Default Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rental.com` | `Admin@123` |
| **Customer (Rahul)** | `rahul@example.com` | `Customer@123` |
| **Customer (Priya)** | `priya@example.com` | `Customer@123` |
| **Customer (Arjun)** | `arjun@example.com` | `Customer@123` |
| **Customer (Sneha)** | `sneha@example.com` | `Customer@123` |
| **Customer (Vikram)** | `vikram@example.com` | `Customer@123` |

---

## 10. Troubleshooting

- **Port 8000 or 5173 already in use**: Stop any previous `uvicorn` or `vite` process, or pass `--port` to override.
- **Database reset**: Run `python -m app.utils.seed` inside `backend/` at any time to cleanly reset and re-seed all 10 PostgreSQL tables.
