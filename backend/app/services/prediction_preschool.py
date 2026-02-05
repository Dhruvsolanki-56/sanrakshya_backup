from typing import Any, Dict, List
import os
import numpy as np
import pandas as pd

from app.core.config import settings
from app.services.prediction_common import model_cache, dataframe_for_model, clip_float

PRESCHOOL_MODELS: Dict[str, str] = {
    "growth_percentile": "preschool_growth_percentile_xgb_model.pkl",
    "nutrition_flag": "preschool_nutrition_flag_xgb_model.pkl",
    "prob_fever": "preschool_prob_fever_xgb_model.pkl",
    "prob_cold": "preschool_prob_cold_xgb_model.pkl",
    "prob_diarrhea": "preschool_prob_diarrhea_xgb_model.pkl",
    "milestone_speech_delay_prob": "preschool_milestone_speech_delay_prob_xgb_model.pkl",
    "milestone_social_play_delay_prob": "preschool_milestone_social_play_delay_prob_xgb_model.pkl",
}

PRESCHOOL_FEATURES: List[str] = [
    "is_existing",
    "age_months",
    "sex",
    "weight_kg",
    "height_cm",
    "muac_cm",
    "bmi",
    "weight_zscore",
    "height_zscore",
    "feeding_type",
    "feeding_frequency",
    "vaccination_status",
    "sleep_hours",
    "illness_fever",
    "illness_cold",
    "illness_diarrhea",
    "milestone_speech_clarity",
    "milestone_social_play",
    "avg_weight_gain",
    "weight_velocity",
    "illness_freq_trend",
]


def _load_preschool_models() -> Dict[str, Any]:
    folder = os.path.join(settings.MODELS_DIR, "preschool")
    models: Dict[str, Any] = {}
    for target, fname in PRESCHOOL_MODELS.items():
        path = os.path.join(folder, fname)
        m = model_cache.get(path)
        if m is not None:
            models[target] = m
    return models


def predict_preschool(features: Dict[str, Any]) -> Dict[str, Any]:
    df = dataframe_for_model(features, PRESCHOOL_FEATURES)
    models = _load_preschool_models()
    preds: Dict[str, Any] = {}

    for target, model in models.items():
        y = model.predict(df)[0]
        if target == "nutrition_flag":
            preds[target] = int(round(float(y)))
        elif target == "growth_percentile":
            preds[target] = clip_float(float(y), 0.0, 100.0)
        else:
            preds[target] = clip_float(float(y), 0.0, 1.0)
    for t in PRESCHOOL_MODELS.keys():
        preds.setdefault(t, None)
    return preds
