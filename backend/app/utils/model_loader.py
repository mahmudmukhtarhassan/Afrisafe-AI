import joblib
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Dictionary wanda zai rike models a memory
ml_models: Dict[str, Any] = {}

def load_ml_models():
    """
    Loda ML models a memory lokacin da server ke tashi.
    """
    try:
        logger.info("Loading ML models into memory...")
        ml_models["malaria_model"] = joblib.load(settings.MODEL_PATH)
        ml_models["feature_names"] = joblib.load(settings.FEATURE_NAMES_PATH)
        logger.info("ML models loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        raise e

def clear_ml_models():
    """
    Tsaftace memory lokacin da server ke mutuwa (Shutdown).
    """
    logger.info("Clearing ML models from memory...")
    ml_models.clear()

def get_model(model_name: str):
    """
    Helper function don samun lodi model daga memory.
    """
    model = ml_models.get(model_name)
    if not model:
        raise RuntimeError(f"Model '{model_name}' is not loaded in memory.")
    return model
