import joblib
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger("afrisafe")

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "ml" / "malaria_model.pkl"
FEATURE_PATH = BASE_DIR / "ml" / "feature_names.pkl"

_model = None
_features = None
_load_error = None


def load_model():
    """Load the ML model and feature names. Safe to call multiple times."""
    global _model, _features, _load_error
    if _model is not None:
        return
    try:
        _model = joblib.load(MODEL_PATH)
        _features = joblib.load(FEATURE_PATH)
        logger.info("AI model loaded successfully from %s", MODEL_PATH)
    except Exception as e:
        _load_error = str(e)
        logger.warning("Could not load AI model (%s). /ai/predict will return 503.", e)


def is_model_ready() -> bool:
    return _model is not None


def predict(data):
    if _model is None:
        load_model()
    if _model is None:
        raise RuntimeError(f"AI model is not available: {_load_error}")

    values = np.array([[
        data.fever,
        data.headache,
        data.chills,
        data.vomiting,
        data.fatigue,
        data.body_pain,
    ]])

    prediction = _model.predict(values)[0]
    probability = float(_model.predict_proba(values).max())

    return prediction, probability
