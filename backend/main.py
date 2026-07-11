"""
main.py
=======
Backend entry point for SecureVision Edge.

Current role
------------
Bootstraps the database on startup and exposes a minimal health-check
so you can verify the server is running.

Future integration
------------------
Replace or extend this file with your FastAPI app or Django project.
The database layer (database/) requires no changes — just import from
db_utils.py in your route/view handlers.

Run
---
    # Development (plain Python)
    python main.py

    # With FastAPI installed
    pip install fastapi uvicorn
    uvicorn main:app --reload
"""

import logging
import sys
from pathlib import Path

# Ensure the database package is importable from here
sys.path.insert(0, str(Path(__file__).resolve().parent))

from database.init_db import DB_FILE, init_database
from database.seed_data import seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("main")


# ---------------------------------------------------------------------------
# Startup — initialise and seed the database
# ---------------------------------------------------------------------------
def startup() -> None:
    """Initialise the database and load seed data if the DB is empty."""
    log.info("=== SecureVision Edge Backend ===")
    log.info("Database path: %s", DB_FILE)
    init_database(reset=False)
    seed()
    log.info("Backend ready.")


# ---------------------------------------------------------------------------
# Optional FastAPI application
# Uncomment the block below once `pip install fastapi uvicorn` is run.
# ---------------------------------------------------------------------------
# from fastapi import FastAPI
# from contextlib import asynccontextmanager
# from database.db_utils import get_all_components, get_fleet_summary, get_audit_trail
#
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     startup()
#     yield
#
# app = FastAPI(title="SecureVision Edge API", lifespan=lifespan)
#
# @app.get("/health")
# def health():
#     return {"status": "ok"}
#
# @app.get("/api/components")
# def components():
#     return get_all_components()
#
# @app.get("/api/fleet-summary")
# def fleet_summary():
#     return get_fleet_summary()
#
# @app.get("/api/audit")
# def audit():
#     return get_audit_trail()


# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    startup()

    # Quick smoke-test: print fleet summary to stdout
    from database.db_utils import get_all_components, get_fleet_summary
    summary = get_fleet_summary()
    if summary:
        log.info(
            "Fleet summary → components: %d | inspections: %d | "
            "risk: %.1f | grounded: %d",
            summary["total_components"],
            summary["total_inspections"],
            summary["fleet_risk_score"],
            summary["critical_defects"],
        )

    components = get_all_components()
    log.info("Top 3 components by risk:")
    for c in components[:3]:
        log.info("  [%s]  %-35s  risk=%.0f  status=%s",
                 c["component_id"], c["name"], c["risk_score"], c["status"])
