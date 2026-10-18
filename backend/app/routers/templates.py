"""Template Management Router: List, Upload DOCX, Variable Detection, Versioning, and Schema Editor"""
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.config import settings
from app.models.all_models import Template, TemplateVersion, Document, UserRole
from app.schemas.all_schemas import (
    TemplateResponse, TemplateCreate, TemplateVersionResponse, TemplateSchemaUpdate
)
from app.services.template_service import (
    get_docx_variables, infer_field_schema, save_uploaded_template_file
)
from app.routers.deps import get_current_user, require_admin

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("", response_model=List[TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).all()
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


@router.post("", response_model=TemplateResponse)
def create_template(
    name: str = Form(...),
    type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Create a new template from an uploaded DOCX file.
    Automatically parses undeclared Jinja2 variables and creates Version 1 with an inferred schema.
    """
    # 1. Create Template record
    tpl = Template(
        name=name.strip(),
        type=type.lower().strip(),
        description=description,
        is_active=True
    )
    db.add(tpl)
    db.flush()

    # 2. Save file
    saved_path = save_uploaded_template_file(file, tpl.id, 1)

    # 3. Detect variables and infer schema
    variables = get_docx_variables(saved_path)
    schema = infer_field_schema(variables)

    # 4. Create Template Version 1
    rel_path = f"/templates/{saved_path.name}"
    version = TemplateVersion(
        template_id=tpl.id,
        version_no=1,
        file_path=rel_path,
        field_schema=schema,
        locked_at=None
    )
    db.add(version)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.post("/{template_id}/versions", response_model=TemplateVersionResponse)
def upload_new_version(
    template_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Upload a new version for an existing template.
    Preserves version history; locked versions are never mutated.
    """
    tpl = db.query(Template).filter(Template.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    # Determine next version number
    latest_version = (
        db.query(TemplateVersion)
        .filter(TemplateVersion.template_id == template_id)
        .order_by(TemplateVersion.version_no.desc())
        .first()
    )
    next_ver = (latest_version.version_no + 1) if latest_version else 1

    saved_path = save_uploaded_template_file(file, template_id, next_ver)
    variables = get_docx_variables(saved_path)
    schema = infer_field_schema(variables)

    rel_path = f"/templates/{saved_path.name}"
    version = TemplateVersion(
        template_id=template_id,
        version_no=next_ver,
        file_path=rel_path,
        field_schema=schema,
        locked_at=None
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.put("/versions/{version_id}/schema", response_model=TemplateVersionResponse)
def update_version_schema(
    version_id: int,
    payload: TemplateSchemaUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """
    Edit field schema (reorder, labels, types, required flags, default values).
    If the version is locked by generated documents, editing is rejected (user must create a new version).
    """
    ver = db.query(TemplateVersion).filter(TemplateVersion.id == version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Template version not found")

    if ver.locked_at is not None:
        raise HTTPException(
            status_code=400,
            detail="This template version is locked because documents have already been generated with it. Upload a new version to modify the schema."
        )

    ver.field_schema = payload.field_schema
    db.commit()
    db.refresh(ver)
    return ver
