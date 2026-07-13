"""
retriever.py
Retrieval half of RAG: fetch a part's past inspection records from SQLite.
"""

import sqlite3
from datetime import datetime

DB_PATH = "inspection_history.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_id TEXT NOT NULL,
            inspection_date TEXT NOT NULL,
            defect_found TEXT,
            confidence REAL,
            previous_verdict TEXT,
            inspector_notes TEXT
        )
    """)
    conn.commit()
    conn.close()


def get_history(part_id: str, limit: int = 10) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """SELECT * FROM inspections
           WHERE part_id = ?
           ORDER BY inspection_date DESC
           LIMIT ?""",
        (part_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_inspection(part_id: str, defect_found: str, confidence: float,
                     verdict: str, inspector_notes: str = ""):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO inspections
        (part_id, inspection_date, defect_found, confidence, previous_verdict, inspector_notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (part_id, datetime.utcnow().isoformat(), defect_found, confidence, verdict, inspector_notes))
    conn.commit()
    conn.close()


def seed_demo_data():
    demo_records = [
        ("WING-B7-042", "2026-05-01T10:00:00", "Hairline crack", 0.71, "MONITOR", "Small, stable"),
        ("WING-B7-042", "2026-06-01T10:00:00", "Hairline crack", 0.83, "MONITOR", "Slight growth noted"),
        ("WING-B7-042", "2026-07-01T10:00:00", "Crack", 0.89, "RECHECK", "Growth accelerating"),
        ("FUS-C3-011", "2026-06-15T09:00:00", "Corrosion spot", 0.60, "CLEAR", "Surface only"),
        ("LDG-A1-007", "2026-04-20T14:00:00", "Missing fastener", 0.95, "GROUND", "Replaced same day"),
    ]
    conn = sqlite3.connect(DB_PATH)
    for r in demo_records:
        conn.execute("""
            INSERT INTO inspections
            (part_id, inspection_date, defect_found, confidence, previous_verdict, inspector_notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, r)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()
    print("DB initialized and seeded. Try: get_history('WING-B7-042')")
    print(get_history("WING-B7-042"))