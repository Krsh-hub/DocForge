"""DocForge Core Configuration"""
import json
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App info
    APP_NAME: str = "DocForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server binding
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ALLOW_LAN: bool = False
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost",
        "capacitor://localhost",
        "http://localhost",
        "*",
    ]

    # Security
    SECRET_KEY: str = "docforge-super-secret-local-change-in-production-random-salt-128471928471"
    COOKIE_NAME: str = "docforge_session"
    SESSION_EXPIRE_HOURS: int = 72
    ALGORITHM: str = "HS256"

    # Paths - Data folder is one level up from backend in /data
    DATA_DIR: str = ""
    LIBREOFFICE_PATH: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def resolved_data_dir(self) -> Path:
        if self.DATA_DIR:
            p = Path(self.DATA_DIR)
            if not p.is_absolute():
                p = (Path(__file__).parent.parent.parent / self.DATA_DIR).resolve()
            return p
        # Default: DocForge/data
        return (Path(__file__).parent.parent.parent.parent / "data").resolve()

    @property
    def db_path(self) -> Path:
        return self.resolved_data_dir / "app.db"

    @property
    def templates_dir(self) -> Path:
        d = self.resolved_data_dir / "templates"
        d.mkdir(parents=True, exist_ok=True)
        return d

    @property
    def generated_dir(self) -> Path:
        d = self.resolved_data_dir / "generated"
        d.mkdir(parents=True, exist_ok=True)
        return d

    @property
    def uploads_dir(self) -> Path:
        d = self.resolved_data_dir / "uploads"
        d.mkdir(parents=True, exist_ok=True)
        return d

    @property
    def backups_dir(self) -> Path:
        d = self.resolved_data_dir / "backups"
        d.mkdir(parents=True, exist_ok=True)
        return d


settings = Settings()
