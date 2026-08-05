try:
    # prefer pydantic-settings (pydantic v2 style) when available
    from pydantic_settings import BaseSettings
except Exception:
    # fallback to pydantic v1 BaseSettings for environments using pydantic<2
    from pydantic import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str

    APP_ENV: str

    APP_VERSION: str

    SECRET_KEY: str

    ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int

    SUPABASE_URL: str

    SUPABASE_ANON_KEY: str

    SUPABASE_SERVICE_ROLE_KEY: str

    FRONTEND_URL: str

    class Config:
        env_file = ".env"


settings = Settings()
