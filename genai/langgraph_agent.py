"""
langgraph_agent.py
The workflow: receive detection -> retrieve history (RAG) -> build prompt ->
call LLM -> parse response -> return final report.
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

from retriever import get_history, save_inspection
from prompts import build_prompt
from llm import call_llm, parse_verdict


class InspectionState(TypedDict):
    part_id: str
    defect: str
    confidence: float
    history: Optional[list]
    prompt: Optional[str]
    raw_llm_output: Optional[str]
    verdict: Optional[str]
    explanation: Optional[str]


def retrieve_node(state: InspectionState) -> InspectionState:
    state["history"] = get_history(state["part_id"])
    return state


def prompt_node(state: InspectionState) -> InspectionState:
    state["prompt"] = build_prompt(
        part_id=state["part_id"],
        defect=state["defect"],
        confidence=state["confidence"],
        history=state["history"],
    )
    return state


def llm_node(state: InspectionState) -> InspectionState:
    raw = call_llm(state["prompt"])
    state["raw_llm_output"] = raw
    parsed = parse_verdict(raw)
    state["verdict"] = parsed["verdict"]
    state["explanation"] = parsed["explanation"]
    return state


def build_agent():
    graph = StateGraph(InspectionState)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("prepare_prompt", prompt_node)
    graph.add_node("call_llm", llm_node)

    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "prepare_prompt")
    graph.add_edge("prepare_prompt", "call_llm")
    graph.add_edge("call_llm", END)

    return graph.compile()


def run_inspection(part_id: str, defect: str, confidence: float) -> dict:
    agent = build_agent()
    result = agent.invoke({
        "part_id": part_id,
        "defect": defect,
        "confidence": confidence,
    })

    report = {
        "part_id": part_id,
        "defect": defect,
        "confidence": confidence,
        "history_count": len(result["history"]),
        "verdict": result["verdict"],
        "explanation": result["explanation"],
    }

    save_inspection(part_id, defect, confidence, result["verdict"])
    return report


if __name__ == "__main__":
    report = run_inspection("WING-B7-042", "Crack", 0.91)
    print(report)