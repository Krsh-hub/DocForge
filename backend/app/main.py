"""Main FastAPI Application Entrypoint for DocForge"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.db import engine, Base
from app.routers import auth, health, settings as settings_router, templates, clients, clauses, documents, payments

# Create DB tables if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="DocForge: Local Business Document Generation System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for local frontend, cloud deployments (Render), and mobile apps
allowed_origins = [o for o in (settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:3000"]) if o != "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*|capacitor://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads and generated documents
app.mount("/uploads", StaticFiles(directory=str(settings.uploads_dir)), name="uploads")
app.mount("/generated", StaticFiles(directory=str(settings.generated_dir)), name="generated")
app.mount("/templates", StaticFiles(directory=str(settings.templates_dir)), name="templates")

# Include Core Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(settings_router.router)
app.include_router(templates.router)
app.include_router(clients.router)
app.include_router(clauses.router)
app.include_router(documents.router)
app.include_router(payments.router)



@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs"
    }
