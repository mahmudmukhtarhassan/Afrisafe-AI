from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/routes")
def list_registered_routes(request: Request):
    """Return the OpenAPI paths registered on this FastAPI app for debugging.

    WARNING: This endpoint is intended for short-lived debugging only. Do not expose
    in production without proper access controls.
    """
    try:
        spec = request.app.openapi()
        paths = sorted(list(spec.get("paths", {}).keys()))
        return {"paths": paths}
    except Exception as e:
        return {"error": str(e)}
