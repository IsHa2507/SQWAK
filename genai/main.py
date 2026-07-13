"""
main.py
The API surface the backend calls. One endpoint: POST /inspect
"""

from fastapi import FastAPI
from pydantic import BaseModel

from retriever import init_db
from langgraph_agent import run_inspection

app = FastAPI(title="Squawk GenAI Module")


class DetectionInput(BaseModel):
    part_id: str
    defect: str
    confidence: float


@app.on_event("startup")
def startup():
    init_db()


@app.post("/inspect")
def inspect(payload: DetectionInput):
    return run_inspection(
        part_id=payload.part_id,
        defect=payload.defect,
        confidence=payload.confidence,
    )


@app.get("/health")
def health():
    return {"status": "ok"}