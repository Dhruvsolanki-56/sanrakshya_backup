# -------------------------------------------------
# 2. Imports
# -------------------------------------------------
from groq import Groq
import json
import re
from typing import Optional, Dict
from app.core.config import settings

# -------------------------------------------------
# 3. Client setup (API key from env)
# -------------------------------------------------
_API_KEY = (
    getattr(settings, "GROQ_API_KEY", None)
    or getattr(settings, "GEMINI_API_KEY", None)
)

client = Groq(api_key=_API_KEY) if _API_KEY else None

# Common zero nutrients payload
_ZERO = {
    "energy_kcal": 0.0,
    "protein_g": 0.0,
    "carb_g": 0.0,
    "fat_g": 0.0,
    "iron_mg": 0.0,
    "calcium_mg": 0.0,
    "vitamin_a_mcg": 0.0,
    "vitamin_c_mg": 0.0,
}

# -------------------------------------------------
# 4. Core function – robust JSON parse, scaled to grams
# -------------------------------------------------
def get_nutrition(food_desc: str, grams: float) -> Optional[Dict[str, float]]:
    """
    Uses an LLM to estimate nutrition for the described food per given grams.
    Returns a dict of nutrient fields; falls back to zeros if anything fails.
    """
    if client is None:
        print("AI nutrition estimation error: LLM client not configured (missing GROQ_API_KEY/GEMINI_API_KEY)")
        return None

    prompt = f"""Nutrition expert for Indian foods. Identify "{food_desc}" as standard form (e.g., dahi = plain full-fat curd).
If recipe, break down ingredients/portions per 100g.
Estimate PER 100g (USDA/Indian data, 2 decimals). Include ALL relevant: fat for dairy, carbs for grains, no zeros unless absent.

Respond with JSON ONLY - start with {{ and end with }}:
{{"energy_kcal": <float>, "protein_g": <float>, "carb_g": <float>, "fat_g": <float>, "iron_mg": <float>, "calcium_mg": <float>, "vitamin_a_mcg": <float>, "vitamin_c_mg": <float>}}"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_tokens=150,
            stream=False,
        )
        output_text = chat_completion.choices[0].message.content.strip()

        # Extract JSON object
        json_match = re.search(r"\{.*\}", output_text, re.DOTALL)
        if not json_match:
            print(f"AI nutrition estimation error: model did not return JSON. Raw: {output_text[:200]}")
            return None
        data = json.loads(json_match.group())

        # Ensure floats
        for k in list(data.keys()):
            try:
                data[k] = float(data[k])
            except Exception:
                data[k] = 0.0

        # Scale per provided grams from per-100g
        scale = (grams or 0.0) / 100.0
        for k in _ZERO.keys():
            v = float(data.get(k, 0.0) or 0.0)
            data[k] = round(v * scale, 2)

        # Ensure all keys present
        for k, v in _ZERO.items():
            data.setdefault(k, v)
        return data  # success
    except Exception as e:
        print(f"AI nutrition estimation error for '{food_desc}' ({grams}g): {repr(e)}")
        return None

# -------------------------------------------------
# 5. Public API expected by CRUD
# -------------------------------------------------
def estimate_nutrition(food_desc: str, grams: float) -> Optional[Dict[str, float]]:
    """Wrapper used by CRUD. Returns dict on success; None on failure."""
    return get_nutrition(food_desc, grams)