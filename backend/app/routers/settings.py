"""Settings and Organization Profile Router"""
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.config import settings
from app.models.all_models import CompanySettings, UserRole
from app.schemas.all_schemas import CompanySettingsResponse, CompanySettingsUpdate
from app.routers.deps import get_current_user, require_admin

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/company", response_model=CompanySettingsResponse)
def get_company_settings(db: Session = Depends(get_db)):
    """Fetch current organization settings (accessible by authenticated users)"""
    comp = db.query(CompanySettings).first()
    if not comp:
        comp = CompanySettings()
        db.add(comp)
        db.commit()
        db.refresh(comp)
    return comp


@router.put("/company", response_model=CompanySettingsResponse)
def update_company_settings(
    payload: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Update organization settings (admin only)"""
    comp = db.query(CompanySettings).first()
    if not comp:
        comp = CompanySettings()
        db.add(comp)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(comp, key, value)

    db.commit()
    db.refresh(comp)
    return comp


@router.post("/company/upload-logo")
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Upload company logo for document header"""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".svg"]:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG, and SVG images allowed")

    filename = f"company_logo{ext}"
    dest_path = settings.uploads_dir / filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    comp = db.query(CompanySettings).first()
    if not comp:
        comp = CompanySettings()
        db.add(comp)

    comp.logo_path = f"/uploads/{filename}"
    db.commit()
    return {"logo_path": comp.logo_path}


@router.post("/company/upload-signature")
def upload_signature(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Upload company authorized signature for invoices/contracts"""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG images allowed for signature")

    filename = f"authorized_signature{ext}"
    dest_path = settings.uploads_dir / filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    comp = db.query(CompanySettings).first()
    if not comp:
        comp = CompanySettings()
        db.add(comp)

    comp.signature_path = f"/uploads/{filename}"
    db.commit()
    return {"signature_path": comp.signature_path}
