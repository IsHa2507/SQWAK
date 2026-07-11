"""
seed_data.py
============
Inserts realistic aerospace dummy data into securevision.db.
Records mirror the frontend mock data so the UI works end-to-end
immediately without a live AI model.

Usage
-----
    python seed_data.py            # insert once (skips if data exists)
    python seed_data.py --force    # wipe and re-insert

Integration
-----------
Call seed() from a FastAPI lifespan, Django data migration, or test fixture.
"""

import argparse
import hashlib
import logging
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from init_db import DB_FILE, get_connection, init_database  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("seed_data")

# ---------------------------------------------------------------------------
# ① Component records — 8 airframe parts across 5 aircraft types
# ---------------------------------------------------------------------------
COMPONENTS = [
    ("CMP-737-LWLE-042", "Left Wing Leading Edge",    "Boeing 737-800",  "N7842B", 18420, 22100, 142.0, "ground",  91.0),
    ("CMP-787-ENG2-017", "Engine 2 Nacelle Panel",    "Boeing 787-9",    "N8917X",  9810, 11430, 198.0, "recheck", 74.0),
    ("CMP-A320-FLAP-031","Flap Track Beam #3",         "Airbus A320neo",  "F-WXZQ", 12670, 34500,  88.0, "monitor", 58.0),
    ("CMP-A350-FUSE-009","Fuselage Frame Segment 19",  "Airbus A350-900", "F-WZGG",  4320,  5100,  65.0, "safe",    22.0),
    ("CMP-E190-HTAIL-006","Horizontal Stabilizer RH",  "Embraer E190",    "PR-AXG",  7200,  8800,  72.0, "safe",    31.0),
    ("CMP-737-RWLE-043", "Right Wing Leading Edge",    "Boeing 737-800",  "N7842B", 18420, 22100, 138.0, "recheck", 67.0),
    ("CMP-787-WBOX-022", "Wing Box Lower Skin",        "Boeing 787-9",    "N8917X",  9810, 11430,  95.0, "monitor", 45.0),
    ("CMP-A320-APU-014", "APU Exhaust Duct",           "Airbus A320neo",  "D-AVVB", 15300, 40200, 320.0, "ground",  88.0),
]

# ---------------------------------------------------------------------------
# ② Inspections — one primary scan per component
# ---------------------------------------------------------------------------
INSPECTIONS = [
    # (component_id, inspection_date, image_path, defect_type, severity, confidence, recommendation)
    ("CMP-737-LWLE-042", "2026-07-10 09:14:22", "", "Fatigue Crack",     "critical", 0.97,
     "Immediate grounding. Crack in Sector 3A exceeds 2.5 mm limit. Ultrasonic NDT and panel replacement required."),
    ("CMP-A320-APU-014", "2026-07-09 14:22:10", "", "Thermal Crack",     "critical", 0.95,
     "Exhaust duct thermal cracking at weld seam. Remove from service pending MRO assessment."),
    ("CMP-787-ENG2-017", "2026-07-08 11:05:30", "", "Thermal Fatigue",   "high",     0.89,
     "Thermal fatigue on nacelle inner surface. Enhanced inspection within 30 flight cycles."),
    ("CMP-737-RWLE-043", "2026-07-07 16:40:00", "", "Corrosion Blister", "high",     0.88,
     "Blistering on leading-edge skin. Chemical treatment and re-inspect within 10 cycles."),
    ("CMP-A320-FLAP-031","2026-07-06 08:15:00", "", "Wear Groove",       "medium",   0.82,
     "Wear groove on track beam within serviceable limits. Monitor at each A-check."),
    ("CMP-787-WBOX-022", "2026-06-30 10:00:00", "", "Delamination Spot", "medium",   0.78,
     "Minor composite delamination. Within limits — re-inspect in 50 cycles."),
    ("CMP-E190-HTAIL-006","2026-07-03 16:45:00", "", "Paint Chip",       "low",      0.91,
     "Superficial paint chip. No structural concern. Touch up at next painting."),
    ("CMP-A350-FUSE-009","2026-07-05 11:00:00", "", "Minor Scratch",     "low",      0.94,
     "Hairline scratch within negligible damage limits. Log for record only."),
]

# ---------------------------------------------------------------------------
# ③ Defect history — growth measurements over time
# ---------------------------------------------------------------------------
DEFECT_HISTORY = [
    # (component_id, defect_type, previous_score, current_score, growth_rate, predicted_risk_date)
    ("CMP-737-LWLE-042", "Paint Delamination", 0.0,  12.0, 0.05, None),
    ("CMP-737-LWLE-042", "Surface Dent",      12.0,  28.0, 0.12, None),
    ("CMP-737-LWLE-042", "Corrosion Pit",     28.0,  55.0, 0.21, "2026-09-01 00:00:00"),
    ("CMP-737-LWLE-042", "Fatigue Crack",     55.0,  91.0, 0.38, "2026-07-20 00:00:00"),

    ("CMP-787-ENG2-017", "Fastener Wear",      0.0,  15.0, 0.04, None),
    ("CMP-787-ENG2-017", "Micro-crack",       15.0,  40.0, 0.14, None),
    ("CMP-787-ENG2-017", "Thermal Fatigue",   40.0,  74.0, 0.29, "2026-10-15 00:00:00"),

    ("CMP-A320-FLAP-031","Corrosion Film",     0.0,  20.0, 0.06, None),
    ("CMP-A320-FLAP-031","Wear Groove",       20.0,  58.0, 0.18, "2027-01-10 00:00:00"),

    ("CMP-A320-APU-014", "Weld Porosity",      0.0,  35.0, 0.15, None),
    ("CMP-A320-APU-014", "Oxidation Scale",   35.0,  62.0, 0.24, "2026-09-20 00:00:00"),
    ("CMP-A320-APU-014", "Thermal Crack",     62.0,  88.0, 0.35, "2026-07-25 00:00:00"),

    ("CMP-E190-HTAIL-006","Sealant Crack",     0.0,  18.0, 0.04, None),
    ("CMP-E190-HTAIL-006","Paint Chip",       18.0,  31.0, 0.06, None),

    ("CMP-737-RWLE-043", "Surface Scratch",    0.0,  22.0, 0.05, None),
    ("CMP-737-RWLE-043", "Corrosion Blister", 22.0,  67.0, 0.26, "2026-11-01 00:00:00"),

    ("CMP-787-WBOX-022", "Delamination Spot",  0.0,  45.0, 0.10, None),
    ("CMP-A350-FUSE-009","Minor Scratch",       0.0,  22.0, 0.02, None),
]


# ---------------------------------------------------------------------------
# Hash helper
# ---------------------------------------------------------------------------
def _sha256_short(text: str) -> str:
    """Return first 16 hex chars of SHA-256 digest for compact display."""
    return hashlib.sha256(text.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Insert functions
# ---------------------------------------------------------------------------
def _insert_components(conn: sqlite3.Connection) -> None:
    conn.executemany(
        "INSERT OR IGNORE INTO components "
        "(component_id, name, aircraft_model, tail_number, "
        " flight_hours, stress_cycles, temperature_exposure, status, risk_score) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        COMPONENTS,
    )
    log.info("Inserted %d components.", len(COMPONENTS))


def _insert_inspections(conn: sqlite3.Connection) -> dict[str, int]:
    """Returns {component_id: last_inserted_inspection_id}."""
    id_map: dict[str, int] = {}
    for row in INSPECTIONS:
        cur = conn.execute(
            "INSERT INTO inspections "
            "(component_id, inspection_date, image_path, defect_type, "
            " severity, confidence_score, recommendation) "
            "VALUES (?,?,?,?,?,?,?)",
            row,
        )
        id_map[row[0]] = cur.lastrowid
    log.info("Inserted %d inspections.", len(INSPECTIONS))
    return id_map


def _insert_defect_history(conn: sqlite3.Connection) -> None:
    conn.executemany(
        "INSERT INTO defect_history "
        "(component_id, defect_type, previous_score, current_score, "
        " growth_rate, predicted_risk_date) "
        "VALUES (?,?,?,?,?,?)",
        DEFECT_HISTORY,
    )
    log.info("Inserted %d defect history rows.", len(DEFECT_HISTORY))


def _insert_audit_trail(conn: sqlite3.Connection, id_map: dict[str, int]) -> None:
    """Build a 10-entry hash-chained audit log and insert it."""
    events = [
        ("CMP-737-LWLE-042", "Inspection Submitted", "Eng. Hayes",    "2026-07-10 09:14:22"),
        ("CMP-737-LWLE-042", "Risk Score Updated",   "AI Model v4.2", "2026-07-10 09:15:00"),
        ("CMP-A320-APU-014", "Inspection Submitted", "Eng. Nakamura", "2026-07-09 14:22:10"),
        ("CMP-A320-APU-014", "Work Order Created",   "Eng. Nakamura", "2026-07-09 14:23:05"),
        ("CMP-787-ENG2-017", "Inspection Submitted", "Eng. Torres",   "2026-07-08 11:05:30"),
        ("CMP-787-ENG2-017", "Status Changed",       "Eng. Torres",   "2026-07-08 11:06:12"),
        ("CMP-737-RWLE-043", "Inspection Submitted", "Eng. Hayes",    "2026-07-07 16:40:00"),
        ("ALL",              "Fleet Sync",           "System",        "2026-07-06 09:00:00"),
        ("CMP-A350-FUSE-009","Inspection Submitted", "Eng. Patel",    "2026-07-05 13:15:22"),
        ("CMP-E190-HTAIL-006","Inspection Submitted","Eng. Chen",     "2026-07-03 17:30:00"),
    ]

    # index 4 is the intentional anomaly row
    ANOMALY_INDEX = 4

    previous_hash: str | None = None
    rows = []
    for i, (cid, action, user, ts) in enumerate(events):
        insp_id   = id_map.get(cid)
        content   = f"{i}|{cid}|{action}|{ts}"
        hash_val  = _sha256_short(content)
        integrity = "anomaly" if i == ANOMALY_INDEX else "verified"
        rows.append((insp_id, hash_val, previous_hash, integrity, ts))
        previous_hash = hash_val

    conn.executemany(
        "INSERT INTO audit_trail "
        "(inspection_id, hash_value, previous_hash, integrity_status, timestamp) "
        "VALUES (?,?,?,?,?)",
        rows,
    )
    log.info("Inserted %d audit trail records.", len(rows))


def _refresh_fleet_summary(conn: sqlite3.Connection) -> None:
    """Recompute and update the singleton fleet_summary row."""
    conn.execute(
        """UPDATE fleet_summary SET
               total_components  = (SELECT COUNT(*)                   FROM components),
               total_inspections = (SELECT COUNT(*)                   FROM inspections),
               critical_defects  = (SELECT COUNT(*)                   FROM components WHERE status = 'ground'),
               fleet_risk_score  = (SELECT ROUND(AVG(risk_score), 2)  FROM components),
               last_updated      = datetime('now')
           WHERE id = 1"""
    )
    row = conn.execute("SELECT * FROM fleet_summary WHERE id = 1").fetchone()
    log.info(
        "Fleet summary: %d components | %d inspections | risk %.1f | grounded %d",
        row["total_components"], row["total_inspections"],
        row["fleet_risk_score"],  row["critical_defects"],
    )


def _clear_tables(conn: sqlite3.Connection) -> None:
    for t in ("audit_trail", "defect_history", "inspections", "components"):
        conn.execute(f"DELETE FROM {t}")
        conn.execute(f"DELETE FROM sqlite_sequence WHERE name = '{t}'")
    log.warning("Cleared all seed tables.")


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def seed(db_path: Path = DB_FILE, force: bool = False) -> None:
    """
    Seed the database with sample data.

    Parameters
    ----------
    db_path : Path   Path to the SQLite file.
    force   : bool   Delete existing rows before inserting when True.
    """
    init_database(db_path=db_path, reset=False)
    conn = get_connection(db_path)

    try:
        n = conn.execute("SELECT COUNT(*) FROM components").fetchone()[0]
        if n > 0 and not force:
            log.info("%d components already present. Pass --force to re-seed.", n)
            return

        if force:
            _clear_tables(conn)

        _insert_components(conn)
        id_map = _insert_inspections(conn)
        _insert_defect_history(conn)
        _insert_audit_trail(conn, id_map)
        _refresh_fleet_summary(conn)
        conn.commit()
        log.info("Seeding complete.")

    except Exception:
        conn.rollback()
        log.exception("Seeding failed — transaction rolled back.")
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed the SecureVision Edge database with sample aerospace data."
    )
    parser.add_argument("--force", action="store_true",
                        help="Wipe existing rows and re-insert.")
    parser.add_argument("--db", type=Path, default=DB_FILE, metavar="PATH",
                        help=f"SQLite file (default: {DB_FILE}).")
    args = parser.parse_args()
    seed(db_path=args.db, force=args.force)
