from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get("/me")
async def me(
    current_user=Depends(get_current_user)
):

    return {
        "user": current_user
    }
