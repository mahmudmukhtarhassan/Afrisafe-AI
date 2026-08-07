from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel
import os
import requests
import datetime
import uuid
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REST_URL = f"{SUPABASE_URL}/rest/v1"

# Do not raise at import time — allow app to start even if env vars are missing.
# Perform checks at request time and return clear HTTP errors when necessary.

service_headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

# simple payload: question answers are arbitrary - store json and create deterministic score
class AssessmentPayload(BaseModel):
    answers: dict  # free-form answers stored as JSON

# helper to validate token and fetch user id
def get_user_id_from_request(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {"Authorization": auth_header, "apikey": SUPABASE_ANON_KEY}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = resp.json()
    return user.get("id")


@router.post("", status_code=201)
def create_assessment(payload: AssessmentPayload, request: Request):
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.",
        )

    user_id = get_user_id_from_request(request)
    # Deterministic simple scoring: sum numeric values in answers; non-numeric ignored
    score = 0.0
    count = 0
    for k, v in (payload.answers or {}).items():
        try:
            val = float(v)
            score += val
            count += 1
        except Exception:
            # try to map booleans / strings
            if isinstance(v, bool):
                score += 1 if v else 0
                count += 1
    average = score / count if count else 0.0
    # map to result
    if average >= 0.75:
        result = "High Risk"
    elif average >= 0.4:
        result = "Moderate Risk"
    else:
        result = "Low Risk"

    assessment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "data": payload.answers,
        "result": result,
        "score": average,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    # insert into Supabase table 'assessments'
    url = f"{REST_URL}/assessments"
    resp = requests.post(url, json=assessment, headers=service_headers)
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=resp.text)
    # Return inserted assessment
    return assessment


@router.get("/history")
def assessment_history(request: Request):
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.",
        )

    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/assessments?user_id=eq.{user_id}&order=created_at.desc"
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=resp.text)
    return resp.json()


@router.get("/{assessment_id}")
def get_assessment(assessment_id: str, request: Request):
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.",
        )

    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/assessments?id=eq.{assessment_id}&user_id=eq.{user_id}"
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=resp.text)
    data = resp.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return data[0]


@router.delete("/{assessment_id}", status_code=204)
def delete_assessment(assessment_id: str, request: Request):
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not configured.",
        )

    user_id = get_user_id_from_request(request)
    url = f"{REST_URL}/assessments?id=eq.{assessment_id}&user_id=eq.{user_id}"
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    resp = requests.delete(url, headers=headers)
    if resp.status_code not in (200, 204):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=resp.text)
    return {}
    @router.get("/guidelines")
def malaria_guidelines_2026():
    return {
        "title": "Nigeria Malaria Guidelines 2026",
        "version": "2026",
        "country": "Nigeria",
        "summary": "General malaria prevention, testing, and treatment guidance for users in Nigeria in 2026.",
        "prevention": [
            "Sleep under insecticide-treated mosquito nets every night.",
            "Use indoor residual spraying where available.",
            "Eliminate stagnant water around homes and communities.",
            "Wear protective clothing during evening and night hours.",
            "Use approved mosquito repellents when appropriate."
        ],
        "symptoms": [
            "Fever",
            "Chills or shivering",
            "Headache",
            "Body weakness or fatigue",
            "Nausea or vomiting",
            "Loss of appetite",
            "Sweating"
        ],
        "testing": {
            "recommended": True,
            "methods": [
                "Rapid Diagnostic Test (RDT)",
                "Microscopy (blood smear)"
            ],
            "note": "Confirm malaria with a diagnostic test whenever possible before treatment."
        },
        "treatment": {
            "first_line": "Artemisinin-based Combination Therapy (ACT) as prescribed by a qualified healthcare professional.",
            "warning": "Do not self-medicate with antimalarial drugs without proper medical guidance."
        },
        "high_risk_groups": [
            "Children under five years",
            "Pregnant women",
            "Older adults",
            "People with weakened immune systems"
        ],
        "when_to_seek_care": [
            "Persistent high fever",
            "Difficulty breathing",
            "Confusion or altered consciousness",
            "Repeated vomiting",
            "Convulsions",
            "Severe weakness or inability to drink fluids"
        ],
        "emergency": {
            "severe_malaria_signs": [
                "Unconsciousness",
                "Seizures",
                "Severe anemia",
                "Respiratory distress",
                "Jaundice"
            ],
            "action": "Go immediately to the nearest hospital or emergency medical facility."
        },
        "last_updated": "2026-01-01",
        "source": "AfriSafe AI 2026 Nigeria Malaria Guidance"
    }
