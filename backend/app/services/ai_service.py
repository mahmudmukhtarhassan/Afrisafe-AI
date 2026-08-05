import joblib
import numpy as np
from pathlib import Path
import logging
import os

logger = logging.getLogger("afrisafe")

BASE_DIR = Path(__file__).resolve().parent.parent

# Allow overriding model path via env var for Render or other deployments
MODEL_PATH = Path(os.environ.get("MODEL_PATH") or (BASE_DIR / "ml" / "malaria_model.pkl"))
FEATURE_PATH = Path(os.environ.get("FEATURE_PATH") or (BASE_DIR / "ml" / "feature_names.pkl"))
MODEL_VERSION = os.environ.get("MODEL_VERSION") or "v0.0"

_model = None
_features = None
_load_error = None


def load_model():
    """Load the ML model and feature names. Safe to call multiple times."""
    global _model, _features, _load_error
    if _model is not None:
        return
    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
        if FEATURE_PATH.exists():
            _features = joblib.load(FEATURE_PATH)
        logger.info("AI model loaded successfully from %s", MODEL_PATH)
    except Exception as e:
        _load_error = str(e)
        logger.warning("Could not load AI model (%s). AI endpoints will return 503 if used.", e)


def is_model_ready() -> bool:
    return _model is not None


def get_model_version() -> str:
    return MODEL_VERSION


def predict(data):
    """Run model prediction.

    The function expects an object with attributes/keys corresponding to features
    used by the model (e.g., fever, headache, chills, vomiting, fatigue, body_pain).
    If the model is not available, raises RuntimeError with the load error message.
    """
    if _model is None:
        load_model()
    if _model is None:
        raise RuntimeError(f"AI model is not available: {_load_error}")

    # Support both pydantic object with attributes and plain dict
    def v(key):
        if hasattr(data, key):
            return getattr(data, key)
        if isinstance(data, dict):
            return data.get(key)
        return None

    values = np.array([[
        v("fever") or 0,
        v("headache") or 0,
        v("chills") or 0,
        v("vomiting") or 0,
        v("fatigue") or 0,
        v("body_pain") or 0,
    ]])

    prediction = _model.predict(values)[0]
    proba_arr = _model.predict_proba(values)
    probability = float(proba_arr.max()) if proba_arr is not None else 0.0

    return prediction, probability, get_model_version()
