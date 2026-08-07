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


SYSTEM_PROMPT = """
You are AfriSafe AI, a malaria-focused health assistant for Nigeria and Africa.

Your role:
- Provide educational guidance about malaria.
- Explain symptoms, prevention, mosquito control, medication reminders,
  hydration, nutrition, and when to seek medical care.
- Encourage malaria testing when symptoms suggest possible malaria.
- Encourage users to visit a hospital or clinic for diagnosis and treatment.
- If symptoms sound severe (difficulty breathing, seizures, confusion,
  unconsciousness, severe dehydration, persistent vomiting, high fever that
  does not improve, or signs of severe malaria), instruct the user to seek
  emergency medical care immediately.
- Never claim to diagnose malaria with certainty.
- Never prescribe specific dosages.
- Keep responses clear, practical, and supportive.
- Use short paragraphs and bullet points when useful.
- End most responses with a reminder that AfriSafe AI does not replace a
  qualified healthcare professional.
"""


@router.post("")
def chat(request_data: ChatRequest, request: Request):
    # Verify authenticated user
    get_user_id_from_request(request)

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured"
        )

    user_message = request_data.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{SYSTEM_PROMPT}\\n\\nUser: {user_message}"
                    }
                ]
            }
        ]
    }

    try:
        resp = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini API error: {resp.text}"
            )

        data = resp.json()

        ai_reply = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "I’m sorry, I couldn’t generate a response right now.")
        )

        return {
            "success": True,
            "reply": ai_reply
        }

    except requests.Timeout:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timed out. Please try again."
        )

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service unavailable: {str(e)}"
        )
