from fastapi import APIRouter, Depends
from app.schemas.reminder import ReminderCreate
from app.services.reminder_service import ReminderService
from app.dependencies.auth import get_current_user
from app.utils.responses import success

router = APIRouter(tags=["Reminders"])

@router.post("")
async def create_reminder(
    data: ReminderCreate,
    user=Depends(get_current_user),
):
    result = await ReminderService.create(
        user["sub"],
        data,
    )
    return success(result, "Reminder created")

@router.get("")
async def list_reminders(
    user=Depends(get_current_user),
):
    result = await ReminderService.list(
        user["sub"]
    )
    return success(result)
