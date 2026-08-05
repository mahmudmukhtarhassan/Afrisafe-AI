from fastapi import APIRouter

from app.api.v1.ai import router as ai_router
from app.api.v1.assessment import router as assessment_router
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.prediction import router as prediction_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.reports import router as reports_router
from app.api.v1.users import router as users_router
from app.api.v1.debug import router as debug_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(prediction_router, prefix="/prediction", tags=["Predictions"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Engine"])
api_router.include_router(assessment_router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(reminders_router, prefix="/reminders", tags=["Reminders"])
api_router.include_router(health_router, prefix="/health", tags=["Health Check"])
api_router.include_router(debug_router, prefix="/debug", tags=["Debug"])