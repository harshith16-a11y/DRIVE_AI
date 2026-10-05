import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    PROJECT_NAME: str = "AI-Driven Vehicle Rental Management System"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@127.0.0.1:5433/vehicle_rental_db",
    )
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", "super_secret_dbms_vehicle_rental_jwt_key_2026"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )


settings = Settings()
