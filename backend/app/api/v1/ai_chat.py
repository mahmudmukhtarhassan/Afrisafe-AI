import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["AI Chat"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)


class ChatRequest(BaseModel):
    message: str


def get_user_id_from_request(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": auth_header,
        "apikey": SUPABASE_ANON_KEY,
    }

    resp = requests.get(url, headers=headers, timeout=10)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return resp.json().get("id")


@router.post("")
def chat(data: ChatRequest, request: Request):
    get_user_id_from_request(request)

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured"
        )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": data.message
                    }
                ]
            }
        ]
    }

    resp = requests.post(
        f"{GEMINI_URL}?key={GEMINI_API_KEY}",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30,
    )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {resp.text}"
        )

    result = resp.json()

    reply = (
        result.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "Sorry, I could not generate a response.")
    )

    return {
        "success": True,
        "reply": reply
    }
