"""Authentication Router"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_session_token
from app.models.all_models import User, UserRole, CompanySettings
from app.schemas.all_schemas import UserLogin, UserFirstRun, UserResponse
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/status")
def auth_status(request: Request, db: Session = Depends(get_db)):
    """Check whether system has an admin and if user is logged in"""
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN.value).first() is not None
    token = request.cookies.get(settings.COOKIE_NAME)
    current_user_data = None
    if token:
        from app.core.security import decode_session_token
        payload = decode_session_token(token)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active == True).first()
            if user:
                current_user_data = {
                    "id": user.id,
                    "name": user.name,
                    "username": user.username,
                    "role": user.role
                }

    return {
        "is_first_run": not admin_exists,
        "is_authenticated": current_user_data is not None,
        "user": current_user_data
    }


@router.post("/first-run", response_model=UserResponse)
def first_run_setup(payload: UserFirstRun, response: Response, db: Session = Depends(get_db)):
    """Create initial admin account if none exists"""
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
    if admin_exists:
        raise HTTPException(status_code=400, detail="Admin account already configured")

    # Create admin user
    user = User(
        name=payload.name,
        username=payload.username.lower().strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN.value,
        is_active=True
    )
    db.add(user)
    
    # Ensure default company settings record exists
    comp = db.query(CompanySettings).first()
    if not comp:
        comp = CompanySettings()
        db.add(comp)

    db.commit()
    db.refresh(user)

    # Set auth cookie
    token = create_session_token(user.id, user.username, user.role)
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # localhost http
        max_age=settings.SESSION_EXPIRE_HOURS * 3600
    )

    return user


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    token = create_session_token(user.id, user.username, user.role)
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600
    )
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=settings.COOKIE_NAME)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
