"""Application configuration using Pydantic BaseSettings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Project root resolved from this file (backend/config.py -> ..)
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Strongly-typed application settings loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Security ---
    SECRET_KEY: str = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./afrisafe.db"

    # --- Machine Learning model artefacts ---
    MODEL_PATH: Path = BASE_DIR / "Model" / "malaria_model.pkl"
    FEATURE_NAMES_PATH: Path = BASE_DIR / "Model" / "feature_names.pkl"

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    # --- App metadata ---
    APP_NAME: str = "AfriSafe AI"
    APP_VERSION: str = "1.0.0"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (created once per process)."""
    return Settings()


settings = get_settings()
