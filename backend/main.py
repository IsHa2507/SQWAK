"""
main.py
=======
Backend entry point for SecureVision Edge / Squawk.

Wires together: frontend requests -> detection -> genai reasoning -> database.

Run
---
    uvicorn main:app --reload
"""

import logging
import sys
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).resolve().parent))

from database.db_utils import (
    get_all_components,
    get_audit_trail,
    get_component_history,
    get_fleet_summary,
    insert_inspection,
)
from database.init_db import DB_FILE, init_database
from database.seed_data import seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("main")

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_PATH = Path(__file__).parent / "model" / "best.pt"
GENAI_URL = "http://localhost:8001"

VERDICT_TO_SEVERITY = {
    "CLEAR": "low", "MONITOR": "medium", "RECHECK": "high", "GROUND": "critical",
}


# ---------------------------------------------------------------------------
# Detection — real model if best.pt is present, otherwise a clearly-labelled
# placeholder so the rest of the pipeline is testable right now.
# ---------------------------------------------------------------------------
_yolo_model = None
if MODEL_PATH.exists():
    from ultralytics import YOLO
    _yolo_model = YOLO(str(MODEL_PATH))
    log.info("Loaded real detection model from %s", MODEL_PATH)
else:
    log.warning("No model found at %s — using placeholder detection until best.pt is added.", MODEL_PATH)


def run_detection(image_bytes: bytes) -> dict:
    if _yolo_model is not None:
        from PIL import Image
        import io

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = _yolo_model.predict(image, conf=0.25, verbose=False)[0]

        if len(results.boxes) == 0:
            return {"defect_type": "No Defect", "confidence": 0.0, "bbox": None, "all_defects": []}

        best_box = max(results.boxes, key=lambda b: float(b.conf))
        x1, y1, x2, y2 = best_box.xyxy[0].tolist()
        return {
            "defect_type": _yolo_model.names[int(best_box.cls)],
            "confidence": round(float(best_box.conf), 4),
            "bbox": {"x": round(x1), "y": round(y1), "w": round(x2 - x1), "h": round(y2 - y1)},
            "all_defects": [
                {
                    "type": _yolo_model.names[int(b.cls)],
                    "confidence": round(float(b.conf), 4),
                    "bbox": {
                        "x": round(b.xyxy[0][0].item()), "y": round(b.xyxy[0][1].item()),
                        "w": round((b.xyxy[0][2] - b.xyxy[0][0]).item()),
                        "h": round((b.xyxy[0][3] - b.xyxy[0][1]).item()),
                    },
                }
                for b in results.boxes
            ],
        }

    # Placeholder path — clearly labelled so nobody mistakes this for a real result
    return {
        "defect_type": "Surface Crack (PLACEHOLDER — best.pt not loaded)",
        "confidence": 0.84,
        "bbox": {"x": 120, "y": 80, "w": 60, "h": 40},
        "all_defects": [],
    }


# ---------------------------------------------------------------------------
# Reasoning — calls the genai service; degrades gracefully if it's unreachable
# (e.g. Groq key not set up yet, or the service just isn't running locally)
# ---------------------------------------------------------------------------
async def run_reasoning(component_id: str, defect_type: str, confidence: float) -> dict:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{GENAI_URL}/inspect",
                json={"part_id": component_id, "defect": defect_type, "confidence": confidence},
            )
            r.raise_for_status()
            return r.json()
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError) as e:
        log.warning("genai service unreachable (%s) — falling back to a safe default verdict.", e)
        return {
            "verdict": "RECHECK",
            "explanation": (
                "Reasoning service was unavailable, so this inspection was flagged for manual "
                "recheck as a safe default rather than an automated verdict."
            ),
        }


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=== SecureVision Edge Backend ===")
    log.info("Database path: %s", DB_FILE)
    init_database(reset=False)
    seed()
    log.info("Backend ready. Detection model loaded: %s", _yolo_model is not None)
    yield


app = FastAPI(title="SecureVision Edge API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "detection_model_loaded": _yolo_model is not None}


@app.get("/api/components")
def components():
    return get_all_components()


@app.get("/api/components/{component_id}")
def component(component_id: str):
    profile = get_component_history(component_id)
    if not profile["component"]:
        raise HTTPException(404, "Component not found")
    return profile


@app.get("/api/fleet-summary")
def fleet_summary():
    return get_fleet_summary()


@app.get("/api/audit")
def audit():
    return get_audit_trail()


@app.post("/api/inspect")
async def inspect(
    component_id: str = Form(...),
    aircraft: str = Form(""),
    notes: str = Form(""),
    image: UploadFile = None,
):
    image_bytes = await image.read() if image else b""
    filename = f"{uuid.uuid4().hex}.jpg"
    if image_bytes:
        (UPLOAD_DIR / filename).write_bytes(image_bytes)

    detection = run_detection(image_bytes)
    reasoning = await run_reasoning(component_id, detection["defect_type"], detection["confidence"])

    inspection_id = insert_inspection(
        component_id=component_id,
        image_path=f"uploads/{filename}" if image_bytes else "",
        defect_type=detection["defect_type"],
        severity=VERDICT_TO_SEVERITY.get(reasoning["verdict"], "medium"),
        confidence_score=detection["confidence"],
        recommendation=reasoning["explanation"],
    )

    return {
        "inspection_id": inspection_id,
        "component_id": component_id,
        "defect_type": detection["defect_type"],
        "confidence": detection["confidence"],
        "bbox": detection["bbox"],
        "all_defects": detection.get("all_defects", []),
        "verdict": reasoning["verdict"],
        "explanation": reasoning["explanation"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)