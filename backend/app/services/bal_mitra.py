import os
from functools import lru_cache
from typing import Any, Dict, List

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate

load_dotenv()

_SERVICES_DIR = os.path.dirname(__file__)
_APP_DIR = os.path.dirname(_SERVICES_DIR)
_DEFAULT_DB_PATH = os.path.join(_APP_DIR, "chatVectorDB")
DB_PATH = os.getenv("BAL_MITRA_FAISS_PATH", _DEFAULT_DB_PATH)


@lru_cache(maxsize=1)
def load_rag():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1)
    prompt = PromptTemplate(
        input_variables=["context", "child_profile", "nutrition", "growth", "illness", "question"],
        template=(
            "You are Bal Mitra, a pediatric health assistant for the Sanrakshya app.\n\n"
            "Your role:\n"
            "- Guide parents of children between 0 and 10 years.\n"
            "- Use WHO/UNICEF and standard pediatric guidelines wherever possible.\n\n"
            "Context sources (may be partial):\n"
            "WHO_CONTEXT:\n{context}\n\n"
            "CHILD_PROFILE:\n{child_profile}\n\n"
            "NUTRITION_SUMMARY:\n{nutrition}\n\n"
            "GROWTH_SUMMARY:\n{growth}\n\n"
            "ILLNESS_SUMMARY:\n{illness}\n\n"
            "Rules:\n"
            "1. Speak in warm, simple, parent-friendly language. Avoid medical jargon. and Dont mention mom/dad just parent like any word\n"
            "2. Focus only on the child in CHILD_PROFILE.\n"
            "3. Prefer WHO_CONTEXT when it is relevant and never contradict it.\n"
            "4. If WHO_CONTEXT is empty or does not cover the topic, rely on your internal knowledge\n"
            "   based on WHO/UNICEF and recognized pediatric bodies. Say briefly when you rely on\n"
            "   general guidelines instead of the provided context.\n"
            "5. Do not diagnose or prescribe medicines. Encourage consulting a pediatrician for\n"
            "   any worrying or persistent symptoms.\n"
            "6. Avoid hallucinations and do not invent facts. If unsure, clearly say you are unsure.\n"
            "7. Use the nutrition and growth summaries to make advice concrete, but do not recompute\n"
            "   exact numbers.\n"
            "8. Give structured, step-wise, practical advice for parents.\n"
            "9. Make your summary and main advice specific to this child (use the name and age from\n"
            "   CHILD_PROFILE when available). Avoid long generic lists of many severe symptoms;\n"
            "   focus on only a few key points, unless the parent clearly asks for a full list of\n"
            "   warning signs.\n"
            "10. Never say that the child definitely has or does not have a specific disease (for\n"
            "    example, do not say 'it is unlikely he has dengue'). Explain that symptoms can have\n"
            "    many possible causes and recommend that a pediatrician make any diagnosis.\n\n"
            "Answer format:\n"
            "- Do not write a heading like 'Summary:'. Start directly with 1–2 friendly sentences\n"
            "  that mention the child when possible.\n"
            "- Then give bullet points or numbered steps.\n"
            "- End with a short reassurance and, if needed, a suggestion to meet a pediatrician.\n\n"
            "Question from parent:\n{question}\n\n"
            "Now answer as Bal Mitra."
        ),
    )
    return retriever, llm, prompt


def _build_child_profile_text(context: Dict[str, Any]) -> str:
    child = context.get("child") or {}
    if not child:
        return ""
    name = child.get("full_name") or ""
    gender = child.get("gender") or ""
    age_years = child.get("age_years")
    age_months = child.get("age_months")
    parts: List[str] = []
    # Use first name-like field plus age/gender to personalize response
    if name:
        parts.append(f"Name: {name}")
    if isinstance(age_years, (int, float)) and age_years >= 0:
        if isinstance(age_months, (int, float)) and age_months >= 0:
            parts.append(f"Age: {age_years:.2f} years ({int(age_months)} months)")
        else:
            parts.append(f"Age: {age_years:.2f} years")
    if gender:
        parts.append(f"Gender: {gender}")
    return "; ".join(parts)


def _build_nutrition_text(context: Dict[str, Any]) -> str:
    data = context.get("nutrition") or {}
    if not data:
        return ""
    parts: List[str] = []
    if data.get("has_data"):
        age_months = data.get("age_months")
        if age_months is not None:
            parts.append(f"Weekly nutrition summary available around age {age_months} months.")
        needed = data.get("needed_nutrients") or []
        if needed:
            parts.append("Key nutrients that may be low: " + ", ".join(str(x) for x in needed))
        adequacy = data.get("adequacy") or {}
        if adequacy:
            low_keys: List[str] = []
            for k, v in adequacy.items():
                if isinstance(v, str) and ("low" in v.lower() or "inadequate" in v.lower()):
                    low_keys.append(str(k))
            if low_keys:
                parts.append("Nutrients needing attention: " + ", ".join(low_keys))
        msg = data.get("message")
        if msg:
            parts.append(str(msg))
    else:
        msg = data.get("message")
        if msg:
            parts.append(str(msg))
        else:
            parts.append("No detailed nutrition logs available yet.")
    return " ".join(parts)


def _build_growth_text(context: Dict[str, Any]) -> str:
    g = context.get("growth") or {}
    if not g:
        return ""
    parts: List[str] = []
    log_date = g.get("log_date")
    if log_date:
        parts.append(f"Latest measurement on {log_date}:")
    height = g.get("height_cm")
    weight = g.get("weight_kg")
    bmi = g.get("bmi")
    muac = g.get("muac_cm")
    sleep = g.get("avg_sleep_hours_per_day")
    sub_parts: List[str] = []
    if height is not None:
        sub_parts.append(f"height {height} cm")
    if weight is not None:
        sub_parts.append(f"weight {weight} kg")
    if bmi is not None:
        sub_parts.append(f"BMI {bmi}")
    if muac is not None:
        sub_parts.append(f"MUAC {muac} cm")
    if sleep is not None:
        sub_parts.append(f"average sleep {sleep} hours/day")
    if sub_parts:
        parts.append(", ".join(sub_parts))
    return " ".join(parts)


def _build_illness_text(context: Dict[str, Any]) -> str:
    rows = context.get("current_illnesses") or []
    if not rows:
        return "No current illness logs reported by the parent."
    segments: List[str] = []
    symptom_keys = [
        "fever",
        "cold",
        "cough",
        "sore_throat",
        "headache",
        "stomach_ache",
        "nausea",
        "vomiting",
        "diarrhea",
        "rash",
        "fatigue",
        "loss_of_appetite",
    ]
    for r in rows:
        symptoms: List[str] = []
        for key in symptom_keys:
            if r.get(key):
                symptoms.append(key.replace("_", " "))
        desc_parts: List[str] = []
        if symptoms:
            desc_parts.append("Symptoms: " + ", ".join(symptoms))
        temp = r.get("temperature_c")
        if temp is not None:
            desc_parts.append(f"temperature: {temp} °C")
        severity = r.get("severity")
        if severity:
            desc_parts.append(f"severity: {severity}")
        if desc_parts:
            segments.append("; ".join(desc_parts))
    return " | ".join(segments)


def _build_retrieval_query(question: str, child_profile: str, nutrition: str, growth: str, illness: str) -> str:
    parts: List[str] = [question]
    if child_profile:
        parts.append("Child details: " + child_profile)
    if nutrition:
        parts.append("Nutrition: " + nutrition)
    if growth:
        parts.append("Growth: " + growth)
    if illness:
        parts.append("Illness: " + illness)
    return "\n\n".join(parts)


def ask_bal_mitra(question: str, child_context: Dict[str, Any]) -> str:
    try:
        retriever, llm, prompt = load_rag()
    except Exception as e:
        return (
            "Bal Mitra is having some trouble on the technical side and cannot answer right now. "
            "Please try again in a little while. For any urgent concern, please contact your child's "
            "pediatrician or local health provider."
        )

    child_profile = _build_child_profile_text(child_context)
    nutrition_text = _build_nutrition_text(child_context)
    growth_text = _build_growth_text(child_context)
    illness_text = _build_illness_text(child_context)

    retrieval_query = _build_retrieval_query(
        question,
        child_profile,
        nutrition_text,
        growth_text,
        illness_text,
    )

    try:
        docs = retriever.get_relevant_documents(retrieval_query)
    except Exception:
        docs = []

    context_text = "\n\n".join(d.page_content for d in docs) if docs else ""

    try:
        rendered = prompt.format(
            context=context_text,
            child_profile=child_profile or "Not available",
            nutrition=nutrition_text or "Not available",
            growth=growth_text or "Not available",
            illness=illness_text or "Not available",
            question=question,
        )
    except Exception:
        rendered = question

    try:
        response = llm.invoke(rendered)
        content = getattr(response, "content", None)
        if isinstance(content, str):
            return content
        return str(response)
    except Exception as e:
        return (
            "Bal Mitra could not complete this reply due to a technical issue. "
            "Please try again later, and for anything serious or worrying, reach out to your child's "
            "pediatrician."
        )
