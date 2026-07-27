from fastapi import APIRouter

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get("/me")
async def profile():

    return {
        "message": "Coming in Module 3"
    }
