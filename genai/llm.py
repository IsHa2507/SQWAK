"""
llm.py
Thin wrapper around the LLM call.
"""

import json
from langchain_groq import ChatGroq

_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)


def call_llm(prompt: str) -> str:
    response = _llm.invoke(prompt)
    return response.content


def parse_verdict(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        data = json.loads(cleaned)
        verdict = data.get("verdict", "RECHECK").upper()
        explanation = data.get("explanation", "No explanation provided.")
        if verdict not in {"CLEAR", "MONITOR", "RECHECK", "GROUND"}:
            verdict = "RECHECK"
        return {"verdict": verdict, "explanation": explanation}
    except json.JSONDecodeError:
        return {
            "verdict": "RECHECK",
            "explanation": f"Could not parse model output automatically. Raw output: {raw_text[:200]}"
        }