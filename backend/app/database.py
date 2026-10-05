import os
import socket
import subprocess
import tempfile
import time
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings


def _is_port_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False


def ensure_postgres_running() -> None:
    """
    Ensures the local PostgreSQL 18 instance on port 5433 is running and
    has the 'vehicle_rental_db' database ready when running on Windows locally.
    """
    if "127.0.0.1:5433" not in settings.DATABASE_URL and "localhost:5433" not in settings.DATABASE_URL:
        return

    if _is_port_open("127.0.0.1", 5433):
        return

    pg_bin = Path(r"C:\Program Files\PostgreSQL\18\bin")
    if not pg_bin.exists():
        return

    local_app_data = Path(os.environ.get("LOCALAPPDATA", tempfile.gettempdir()))
    pgdata_dir = local_app_data / "vehicle_rental_pg18_data"
    logfile = Path(tempfile.gettempdir()) / "vehicle_rental_pg18.log"

    initdb_exe = pg_bin / "initdb.exe"
    pg_ctl_exe = pg_bin / "pg_ctl.exe"
    createdb_exe = pg_bin / "createdb.exe"

    if not (pgdata_dir / "PG_VERSION").exists():
        pgdata_dir.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                str(initdb_exe),
                "-D",
                str(pgdata_dir),
                "-U",
                "postgres",
                "-A",
                "trust",
                "--encoding=UTF8",
                "--locale=C",
            ],
            check=False,
            capture_output=True,
        )

    # Remove stale postmaster.pid if port 5433 is closed
    pid_file = pgdata_dir / "postmaster.pid"
    if pid_file.exists() and not _is_port_open("127.0.0.1", 5433):
        try:
            subprocess.run(
                [str(pg_ctl_exe), "-D", str(pgdata_dir), "stop", "-m", "immediate"],
                check=False,
                capture_output=True,
            )
        except Exception:
            pass

    creationflags = 0
    if os.name == "nt":
        creationflags = (
            subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
        )

    subprocess.run(
        [
            str(pg_ctl_exe),
            "-D",
            str(pgdata_dir),
            "-l",
            str(logfile),
            "-o",
            "-p 5433",
            "start",
        ],
        check=False,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creationflags,
    )

    for _ in range(20):
        if _is_port_open("127.0.0.1", 5433):
            break
        time.sleep(0.25)

    # Ensure vehicle_rental_db exists
    subprocess.run(
        [
            str(createdb_exe),
            "-h",
            "127.0.0.1",
            "-p",
            "5433",
            "-U",
            "postgres",
            "vehicle_rental_db",
        ],
        check=False,
        capture_output=True,
    )


ensure_postgres_running()

# Normalize postgresql:// to postgresql+psycopg:// for SQLAlchemy + psycopg3
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
