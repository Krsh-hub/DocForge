"""Health and System Status Router"""
import os
import shutil
import subprocess
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.db import get_db
from app.core.config import settings
from app.models.all_models import User, UserRole
from app.schemas.all_schemas import HealthCheckResponse

router = APIRouter(tags=["Health"])


def detect_libreoffice() -> tuple[bool, str]:
    """Check if LibreOffice soffice binary is available in PATH or custom paths"""
    # 1. Custom setting
    if settings.LIBREOFFICE_PATH and Path(settings.LIBREOFFICE_PATH).is_file():
        return True, settings.LIBREOFFICE_PATH

    # 2. In PATH
    which_soffice = shutil.which("soffice")
    if which_soffice:
        return True, which_soffice

    # 3. Common Windows paths
    win_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for p in win_paths:
        if Path(p).is_file():
            return True, p

    return False, ""


def detect_weasyprint() -> bool:
    try:
        import weasyprint  # type: ignore
        return True
    except ImportError:
        return False
    except Exception:
        return False


@router.get("/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    # Test DB
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    # Check LibreOffice
    lo_ok, lo_path = detect_libreoffice()

    # Check WeasyPrint
    wp_ok = detect_weasyprint()

    # Check data directory write permission
    data_dir_writable = False
    try:
        test_file = settings.resolved_data_dir / ".write_test"
        test_file.write_text("ok", encoding="utf-8")
        test_file.unlink()
        data_dir_writable = True
    except Exception:
        pass

    # Check if first run (no admin)
    first_run = True
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        if admin:
            first_run = False
    except Exception:
        pass

    return HealthCheckResponse(
        status="healthy" if db_ok and data_dir_writable else "degraded",
        version=settings.APP_VERSION,
        database=db_ok,
        libreoffice_available=lo_ok,
        libreoffice_path=lo_path if lo_ok else None,
        weasyprint_available=wp_ok,
        data_dir_writable=data_dir_writable,
        is_first_run=first_run
    )
