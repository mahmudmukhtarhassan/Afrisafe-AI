from app.api.v1.reports import router as reports_router
from app.api.v1.reminders import router as reminders_router

api_router.include_router(reports_router)
api_router.include_router(reminders_router)
