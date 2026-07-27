from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():

    return {

        "status": "healthy",

        "service": "AfriSafe AI",

        "version": "1.0.0"

    }
