from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router

from app.core.config import settings


app = FastAPI(

    title=settings.APP_NAME,

    version=settings.APP_VERSION,

    docs_url="/docs",

    redoc_url="/redoc",

)


app.add_middleware(

    CORSMiddleware,

    allow_origins=[settings.FRONTEND_URL],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


app.include_router(health_router)


@app.get("/")

async def root():

    return {

        "application": settings.APP_NAME,

        "version": settings.APP_VERSION,

        "status": "running"

    }
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
