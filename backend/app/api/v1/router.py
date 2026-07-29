from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.ai import router as ai_router
from app.api.v1.assessment import router as assessment_router
from app.api.v1.reports import router as reports_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.health import router as health_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(ai_router)
api_router.include_router(assessment_router)
api_router.include_router(reports_router)
api_router.include_router(reminders_router)
api_router.include_router(health_router)
