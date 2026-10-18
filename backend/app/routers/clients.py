"""Clients and Projects Management Router"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.all_models import Client, Contact, Project, UserRole
from app.schemas.all_schemas import (
    ClientResponse, ClientCreate, ClientUpdate,
    ProjectResponse, ProjectCreate, ProjectUpdate,
    ContactResponse, ContactCreate
)
from app.routers.deps import get_current_user, require_manager_or_admin

router = APIRouter(tags=["Clients & Projects"])


# ----------------------------------------------------
# Clients
# ----------------------------------------------------
@router.get("/clients", response_model=List[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.legal_name.asc()).all()


@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


@router.post("/clients", response_model=ClientResponse)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    client_data = payload.model_dump(exclude={"contacts"})
    client = Client(**client_data)
    db.add(client)
    db.flush()

    if payload.contacts:
        for c in payload.contacts:
            contact = Contact(client_id=client.id, **c.model_dump())
            db.add(contact)

    db.commit()
    db.refresh(client)
    return client


@router.put("/clients/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(client, k, v)

    db.commit()
    db.refresh(client)
    return client


# ----------------------------------------------------
# Projects
# ----------------------------------------------------
@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(client_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if client_id:
        query = query.filter(Project.client_id == client_id)
    projects = query.order_by(Project.created_at.desc()).all()
    
    # Enrich with client_legal_name
    res = []
    for p in projects:
        data = ProjectResponse.model_validate(p)
        if p.client:
            data.client_legal_name = p.client.legal_name
        res.append(data)
    return res


@router.post("/projects", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Referenced client does not exist")

    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)

    res = ProjectResponse.model_validate(project)
    res.client_legal_name = client.legal_name
    return res
