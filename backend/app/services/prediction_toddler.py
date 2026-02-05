from typing import Any, Dict, List
import os
import numpy as np
import pandas as pd

from app.core.config import settings
from app.services.prediction_common import model_cache, dataframe_for_model, clip_float

# Targets and filenames for toddler
TODDLER_MODELS: Dict[str, str] = {
    "growth_percentile": "toddler_growth_percentile_xgb_model.pkl",
    "nutrition_flag": "toddler_nutrition_flag_xgb_model.pkl",
    "prob_fever": "toddler_prob_fever_xgb_model.pkl",
    "prob_cold": "toddler_prob_cold_xgb_model.pkl",
    "prob_diarrhea": "toddler_prob_diarrhea_xgb_model.pkl",
    "milestones_language_delay_prob": "toddler_milestones_language_delay_prob_xgb_model.pkl",
    "milestones_walking_delay_prob": "toddler_milestones_walking_delay_prob_xgb_model.pkl",
}

# Expected feature columns from training (X = df.drop(columns=targets))
TODDLER_FEATURES: List[str] = [
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
    "milestones_language",
    "milestones_walking",
    "avg_weight_gain",
    "weight_velocity",
    "illness_freq_trend",
]


def _load_toddler_models() -> Dict[str, Any]:
    folder = os.path.join(settings.MODELS_DIR, "toddler")
    models: Dict[str, Any] = {}
    for target, fname in TODDLER_MODELS.items():
        path = os.path.join(folder, fname)
        m = model_cache.get(path)
        if m is not None:
            models[target] = m
    return models


def predict_toddler(features: Dict[str, Any]) -> Dict[str, Any]:
    df = dataframe_for_model(features, TODDLER_FEATURES)
    models = _load_toddler_models()
    preds: Dict[str, Any] = {}

    for target, model in models.items():
        y = model.predict(df)[0]
        if target == "nutrition_flag":
            preds[target] = int(round(float(y)))
        elif target == "growth_percentile":
            preds[target] = clip_float(float(y), 0.0, 100.0)
        else:
            preds[target] = clip_float(float(y), 0.0, 1.0)
    for t in TODDLER_MODELS.keys():
        preds.setdefault(t, None)
    return preds
