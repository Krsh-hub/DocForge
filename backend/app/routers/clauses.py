"""Clause Library Management Router"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.all_models import ClauseBlock
from app.schemas.all_schemas import ClauseResponse, ClauseCreate
from app.routers.deps import require_manager_or_admin

router = APIRouter(prefix="/clauses", tags=["Clause Library"])


@router.get("", response_model=List[ClauseResponse])
def list_clauses(category: Optional[str] = None, template_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ClauseBlock)
    if category:
        query = query.filter(ClauseBlock.category == category)
    if template_type:
        query = query.filter(ClauseBlock.applies_to.contains(template_type))
    return query.order_by(ClauseBlock.category.asc(), ClauseBlock.title.asc()).all()


@router.post("", response_model=ClauseResponse)
def create_clause(
    payload: ClauseCreate,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    clause = ClauseBlock(**payload.model_dump())
    db.add(clause)
    db.commit()
    db.refresh(clause)
    return clause


@router.delete("/{clause_id}")
def delete_clause(
    clause_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    clause = db.query(ClauseBlock).filter(ClauseBlock.id == clause_id).first()
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")
    db.delete(clause)
    db.commit()
    return {"message": "Clause deleted successfully"}
