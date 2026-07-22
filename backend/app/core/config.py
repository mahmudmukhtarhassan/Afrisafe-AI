import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AfriSafe AI API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_secret_for_dev_only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # PostgreSQL Connection String
    # Format: postgresql://user:password@localhost:5432/dbname
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/afrisafe_db"
    )

    MODEL_PATH: str = "Model/malaria_model.pkl"
    FEATURE_NAMES_PATH: str = "Model/feature_names.pkl"

    class Config:
        env_file = ".env"

settings = Settings()
