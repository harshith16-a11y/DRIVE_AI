from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Customer, Notification
from app.schemas.api_schemas import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserOut,
    CustomerOut,
)
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.ai.recommender import generate_recommendations_for_customer

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _serialize_user(user: User) -> UserOut:
    cust = user.customer
    prefs = None
    cust_id = None
    if cust:
        cust_id = cust.id
        prefs = CustomerOut(
            id=cust.id,
            user_id=cust.user_id,
            preferred_vehicle_type=cust.preferred_vehicle_type,
            preferred_transmission=cust.preferred_transmission,
            preferred_fuel=cust.preferred_fuel,
            preferred_seats=cust.preferred_seats,
            budget_per_day=float(cust.budget_per_day or 3500.0),
            created_at=cust.created_at,
        )
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        customer_id=cust_id,
        preferences=prefs,
    )


@router.post(
    "/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
def register_customer(payload: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    try:
        new_user = User(
            name=payload.name.strip(),
            email=email_clean,
            phone=payload.phone.strip(),
            password_hash=hash_password(payload.password),
            role="CUSTOMER",
            is_active=True,
        )
        db.add(new_user)
        db.flush()

        new_customer = Customer(
            user_id=new_user.id,
            preferred_vehicle_type=payload.preferred_vehicle_type,
            preferred_transmission=payload.preferred_transmission,
            preferred_fuel=payload.preferred_fuel,
            preferred_seats=payload.preferred_seats,
            budget_per_day=Decimal(str(payload.budget_per_day)),
        )
        db.add(new_customer)
        db.flush()

        welcome_notif = Notification(
            user_id=new_user.id,
            type="WELCOME",
            title="Welcome to AI-Driven Vehicle Rental",
            message=(
                f"Welcome {new_user.name}! Your preferences ({payload.preferred_vehicle_type}, "
                f"{payload.preferred_transmission}, ₹{int(payload.budget_per_day)}/day) are saved and "
                f"personalized AI vehicle recommendations have been generated."
            ),
            is_read=False,
        )
        db.add(welcome_notif)
        db.commit()
        db.refresh(new_user)
        db.refresh(new_customer)

        # Generate initial AI recommendations for this customer
        generate_recommendations_for_customer(db, new_customer.id, persist=True)

        token = create_access_token(
            {"sub": str(new_user.id), "email": new_user.email, "role": new_user.role}
        )
        return AuthResponse(access_token=token, user=_serialize_user(new_user))
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(exc)}",
        )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact admin.",
        )

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )
    return AuthResponse(access_token=token, user=_serialize_user(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _serialize_user(current_user)
