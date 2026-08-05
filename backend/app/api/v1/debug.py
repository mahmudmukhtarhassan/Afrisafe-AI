from fastapi import APIRouter, Request
import os

router = APIRouter()


def _read_git_sha() -> str:
    # Prefer explicit environment variable (set by CI or deploy platform)
    sha = os.environ.get("GIT_COMMIT_SHA") or os.environ.get("COMMIT_SHA") or os.environ.get("VERCEL_GIT_COMMIT_SHA")
    if sha:
        return sha

    # Fallback: try to read .git/HEAD and resolve ref to a SHA (works when .git is present)
    try:
        head_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.git', 'HEAD')
        if os.path.exists(head_path):
            with open(head_path, 'r') as fh:
                head = fh.read().strip()
            if head.startswith('ref:'):
                ref = head.split(' ', 1)[1].strip()
                ref_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.git', ref)
                if os.path.exists(ref_path):
                    with open(ref_path, 'r') as rf:
                        return rf.read().strip()
            else:
                # HEAD contains a detached SHA
                return head
    except Exception:
        pass

    return "unknown"


@router.get("/routes")
def list_registered_routes(request: Request):
    """Return the OpenAPI paths registered on this FastAPI app for debugging.

    WARNING: This endpoint is intended for short-lived debugging only. Do not expose
    in production without proper access controls.
    """
    try:
        spec = request.app.openapi()
        paths = sorted(list(spec.get("paths", {}).keys()))
        commit = _read_git_sha()
        return {"paths": paths, "commit_sha": commit}
    except Exception as e:
        return {"error": str(e)}
