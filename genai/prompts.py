"""
prompts.py
Builds the prompt sent to the LLM.
"""

SYSTEM_INSTRUCTIONS = """You are an experienced aircraft maintenance inspector.
You will be given the CURRENT defect detection for a part, and its PAST inspection history.
You must choose exactly ONE verdict: CLEAR, MONITOR, RECHECK, or GROUND.

Verdict guidance:
- CLEAR: no meaningful defect, or fully consistent with prior clear inspections.
- MONITOR: minor defect, stable or slow-growing across history, no urgent action needed.
- RECHECK: defect is growing across inspections, or confidence/severity is borderline — needs a closer follow-up soon.
- GROUND: defect is severe, worsening fast, or history shows repeated escalation — part is unsafe to fly as-is.

Base your decision on BOTH the current detection AND the trend visible in past inspections —
a defect that looks minor in isolation may warrant GROUND if history shows it's been steadily worsening.

Return ONLY valid JSON, no markdown fences, no preamble, matching exactly:
{"verdict": "CLEAR|MONITOR|RECHECK|GROUND", "explanation": "<2-4 sentences, plain language>"}
"""


def build_prompt(part_id: str, defect: str, confidence: float, history: list[dict]) -> str:
    if history:
        history_summary = "\n".join(
            f"- {h['inspection_date']}: defect='{h['defect_found']}', "
            f"confidence={h['confidence']}, verdict={h['previous_verdict']}, "
            f"notes='{h.get('inspector_notes','')}'"
            for h in history
        )
    else:
        history_summary = "No prior inspection history for this part."

    return f"""{SYSTEM_INSTRUCTIONS}

PART ID: {part_id}

CURRENT DETECTION:
- Defect: {defect}
- Confidence: {confidence}

PAST INSPECTIONS (most recent first):
{history_summary}

Respond with the JSON object only.
"""