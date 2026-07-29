from pydantic import BaseModel
from datetime import datetime

class ReminderCreate(BaseModel):
    title: str
    reminder_date: datetime
