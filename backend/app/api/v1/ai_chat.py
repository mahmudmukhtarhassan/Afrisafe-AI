import os
import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

router = APIRouter(tags=["AI Chat"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)


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

    try:
        resp = requests.get(url, headers=headers, timeout=10)
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify user session"
        )

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
- Never prescribe specific medication dosages.
- Keep responses clear, practical, and supportive.
- Use short paragraphs and bullet points when useful.
- End most responses with a reminder that AfriSafe AI does not replace a
  qualified healthcare professional.
"""


@router.post("")
def chat(data: ChatRequest, request: Request):
    # Verify authenticated user
    get_user_id_from_request(request)

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY is not configured"
        )

    user_message = data.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    try:
        response = client.responses.create(
            model="gpt-5-mini",
            input=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
        )

        return {
            "success": True,
            "reply": response.output_text,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )
