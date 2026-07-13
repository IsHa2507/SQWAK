"""
db_utils.py
===========
Database connection utilities and CRUD helpers for SecureVision Edge.

Design goals
------------
- Backend-agnostic: works with raw Python, FastAPI, or Django.
- Every public function accepts an optional `db_path` so callers can point
  to a test database without monkey-patching globals.
- Functions return plain dicts (converted from sqlite3.Row) so callers
  never need to import sqlite3 themselves.

Quick-start
-----------
    from db_utils import fetch_all, insert_inspection

    components = fetch_all("SELECT * FROM components ORDER BY risk_score DESC")
    new_id     = insert_inspection(
        component_id="CMP-737-LWLE-042",
        image_path="uploads/img_001.jpg",
        defect_type="Fatigue Crack",
        severity="critical",
        confidence_score=0.97,
        recommendation="Ground immediately.",
    )
"""

import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Bootstrap path so this file can be imported from any working directory
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from init_db import DB_FILE, get_connection  # noqa: E402

log = logging.getLogger("db_utils")


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def execute_query(
    sql: str,
    params: tuple | list | dict = (),
    db_path: Path = DB_FILE,
) -> int:
    """
    Execute an INSERT / UPDATE / DELETE statement.

    Returns the lastrowid for INSERT statements, or the number of rows
    affected for UPDATE / DELETE.

    Parameters
    ----------
    sql     : str            Parameterised SQL statement.
    params  : tuple|list|dict  Bind parameters (? positional or :name named).
    db_path : Path           Database file to connect to.

    Example
    -------
        execute_query(
            "UPDATE components SET status = ? WHERE component_id = ?",
            ("ground", "CMP-737-LWLE-042"),
        )
    """
    with get_connection(db_path) as conn:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid if cur.lastrowid else cur.rowcount


def fetch_all(
    sql: str,
    params: tuple | list | dict = (),
    db_path: Path = DB_FILE,
) -> list[dict]:
    """
    Run a SELECT and return every matching row as a list of dicts.

    Returns an empty list when no rows match — never raises on zero results.

    Example
    -------
        rows = fetch_all(
            "SELECT * FROM inspections WHERE severity = ?", ("critical",)
        )
    """
    with get_connection(db_path) as conn:
        cur = conn.execute(sql, params)
        return [dict(row) for row in cur.fetchall()]


def fetch_one(
    sql: str,
    params: tuple | list | dict = (),
    db_path: Path = DB_FILE,
) -> dict | None:
    """
    Run a SELECT and return the first matching row as a dict, or None.

    Example
    -------
        component = fetch_one(
            "SELECT * FROM components WHERE component_id = ?",
            ("CMP-737-LWLE-042",),
        )
    """
    with get_connection(db_path) as conn:
        row = conn.execute(sql, params).fetchone()
        return dict(row) if row else None


# ---------------------------------------------------------------------------
# Domain-level helpers
# ---------------------------------------------------------------------------

def insert_inspection(
    component_id:    str,
    image_path:      str       = "",
    defect_type:     str       = "None",
    severity:        str       = "low",
    confidence_score: float    = 0.0,
    recommendation:  str       = "",
    inspection_date: str | None = None,
    db_path:         Path      = DB_FILE,
) -> int:
    """
    Insert a new inspection record and return its auto-generated id.

    Also updates the fleet_summary total_inspections counter.

    Parameters
    ----------
    component_id     : TEXT   Must exist in the components table.
    image_path       : TEXT   Relative path inside backend/uploads/.
    defect_type      : TEXT   Primary AI finding, e.g. "Fatigue Crack".
    severity         : TEXT   "low" | "medium" | "high" | "critical".
    confidence_score : REAL   Model confidence 0.0 – 1.0.
    recommendation   : TEXT   Human-readable maintenance recommendation.
    inspection_date  : TEXT   ISO-8601 string; defaults to current UTC time.
    db_path          : Path   Database file.

    Returns
    -------
    int   Row id of the newly inserted inspection.

    Example
    -------
        inspection_id = insert_inspection(
            component_id="CMP-737-LWLE-042",
            image_path="uploads/scan_001.jpg",
            defect_type="Fatigue Crack",
            severity="critical",
            confidence_score=0.97,
            recommendation="Ground immediately.",
        )
    """
    if inspection_date is None:
        inspection_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    with get_connection(db_path) as conn:
        cur = conn.execute(
            """INSERT INTO inspections
               (component_id, inspection_date, image_path, defect_type,
                severity, confidence_score, recommendation)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (component_id, inspection_date, image_path,
             defect_type, severity, confidence_score, recommendation),
        )
        new_id = cur.lastrowid

        # Keep fleet_summary in sync
        conn.execute(
            """UPDATE fleet_summary
               SET total_inspections = (SELECT COUNT(*) FROM inspections),
                   last_updated      = datetime('now')
               WHERE id = 1"""
        )
        conn.commit()

    log.info("Inserted inspection id=%d for component %s.", new_id, component_id)
    return new_id


def get_component_history(
    component_id: str,
    db_path:      Path = DB_FILE,
) -> dict:
    """
    Return a combined profile for one component including its full
    inspection history and defect growth measurements.

    Parameters
    ----------
    component_id : str   The component_id string (e.g. "CMP-737-LWLE-042").
    db_path      : Path  Database file.

    Returns
    -------
    dict with keys:
        "component"      : dict | None   — the components row
        "inspections"    : list[dict]    — all inspections, newest first
        "defect_history" : list[dict]    — all defect measurements

    Example
    -------
        profile = get_component_history("CMP-737-LWLE-042")
        print(profile["component"]["risk_score"])
        for ins in profile["inspections"]:
            print(ins["severity"], ins["inspection_date"])
    """
    component = fetch_one(
        "SELECT * FROM components WHERE component_id = ?",
        (component_id,),
        db_path,
    )
    inspections = fetch_all(
        "SELECT * FROM inspections WHERE component_id = ? ORDER BY inspection_date DESC",
        (component_id,),
        db_path,
    )
    defect_history = fetch_all(
        "SELECT * FROM defect_history WHERE component_id = ? ORDER BY rowid ASC",
        (component_id,),
        db_path,
    )

    return {
        "component":      component,
        "inspections":    inspections,
        "defect_history": defect_history,
    }


# ---------------------------------------------------------------------------
# Convenience read helpers (commonly needed by API routes)
# ---------------------------------------------------------------------------

def get_all_components(db_path: Path = DB_FILE) -> list[dict]:
    """Return all components ordered by risk_score descending."""
    return fetch_all(
        "SELECT * FROM components ORDER BY risk_score DESC",
        db_path=db_path,
    )


def get_fleet_summary(db_path: Path = DB_FILE) -> dict | None:
    """Return the singleton fleet_summary row."""
    return fetch_one("SELECT * FROM fleet_summary WHERE id = 1", db_path=db_path)


def get_audit_trail(limit: int = 50, db_path: Path = DB_FILE) -> list[dict]:
    """Return the most recent audit records, newest first."""
    return fetch_all(
        "SELECT * FROM audit_trail ORDER BY timestamp DESC LIMIT ?",
        (limit,),
        db_path,
    )


def update_component_status(
    component_id: str,
    status:       str,
    risk_score:   float | None = None,
    db_path:      Path         = DB_FILE,
) -> None:
    """
    Update a component's operational status and optionally its risk_score.

    Parameters
    ----------
    component_id : str    Target component.
    status       : str    "safe" | "monitor" | "recheck" | "ground".
    risk_score   : float  New risk score (0–100); omit to leave unchanged.

    Example
    -------
        update_component_status("CMP-737-LWLE-042", "ground", risk_score=93.5)
    """
    if risk_score is not None:
        execute_query(
            "UPDATE components SET status = ?, risk_score = ? WHERE component_id = ?",
            (status, risk_score, component_id),
            db_path,
        )
    else:
        execute_query(
            "UPDATE components SET status = ? WHERE component_id = ?",
            (status, component_id),
            db_path,
        )

    # Refresh fleet summary after status change
    execute_query(
        """UPDATE fleet_summary SET
               critical_defects = (SELECT COUNT(*) FROM components WHERE status = 'ground'),
               fleet_risk_score = (SELECT ROUND(AVG(risk_score), 2) FROM components),
               last_updated     = datetime('now')
           WHERE id = 1""",
        db_path=db_path,
    )
    log.info("Updated component %s → status=%s.", component_id, status)
