"""
init_db.py
==========
Creates (or safely re-creates) backend/database/securevision.db from schema.sql.

Usage
-----
    python init_db.py            # create / verify — safe to run repeatedly
    python init_db.py --reset    # drop all tables and rebuild from scratch

Integration
-----------
FastAPI  : call init_database() inside the lifespan startup handler.
Django   : call init_database() from AppConfig.ready() or a management command.
Standalone: run this script directly as shown above.

All other modules import get_connection() from this file to obtain a
ready-to-use sqlite3.Connection with foreign keys enabled.
"""

import argparse
import logging
import sqlite3
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Resolved paths — always relative to this file so cwd doesn't matter
# ---------------------------------------------------------------------------
BASE_DIR   = Path(__file__).resolve().parent          # backend/database/
SCHEMA_SQL = BASE_DIR / "schema.sql"
DB_FILE    = BASE_DIR / "securevision.db"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("init_db")


# ---------------------------------------------------------------------------
# Connection factory — import this everywhere instead of calling
# sqlite3.connect() directly so pragma settings are always consistent
# ---------------------------------------------------------------------------
def get_connection(db_path: Path = DB_FILE) -> sqlite3.Connection:
    """
    Return an open sqlite3.Connection with recommended settings applied.

    - row_factory = sqlite3.Row  →  rows behave like dicts (col access by name)
    - foreign_keys = ON          →  referential integrity enforced
    - journal_mode = WAL         →  better read concurrency
    """
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous  = NORMAL")
    return conn


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _load_schema() -> str:
    """Read schema.sql from disk. Exits with an error if the file is missing."""
    if not SCHEMA_SQL.exists():
        log.error("schema.sql not found at %s", SCHEMA_SQL)
        sys.exit(1)
    return SCHEMA_SQL.read_text(encoding="utf-8")


def _drop_all_tables(conn: sqlite3.Connection) -> None:
    """Remove every user table, trigger and index from the database."""
    conn.execute("PRAGMA foreign_keys = OFF")

    rows = conn.execute(
        "SELECT type, name FROM sqlite_master "
        "WHERE type IN ('table','trigger','index') AND name NOT LIKE 'sqlite_%'"
    ).fetchall()

    for row in rows:
        conn.execute(f"DROP {row['type'].upper()} IF EXISTS [{row['name']}]")
        log.info("Dropped %s: %s", row["type"], row["name"])

    conn.execute("PRAGMA foreign_keys = ON")
    conn.commit()


def _apply_schema(conn: sqlite3.Connection) -> None:
    """Execute the full schema SQL against the connection."""
    conn.executescript(_load_schema())
    conn.commit()
    log.info("Schema applied successfully.")


def _seed_fleet_summary(conn: sqlite3.Connection) -> None:
    """Insert the singleton fleet_summary row if it doesn't exist yet."""
    count = conn.execute("SELECT COUNT(*) FROM fleet_summary").fetchone()[0]
    if count == 0:
        conn.execute(
            "INSERT INTO fleet_summary "
            "(total_components, total_inspections, critical_defects, fleet_risk_score) "
            "VALUES (0, 0, 0, 0.0)"
        )
        conn.commit()
        log.info("Inserted fleet_summary sentinel row.")


def _verify(conn: sqlite3.Connection) -> bool:
    """Check all expected tables exist and log their row counts."""
    expected = {"components", "inspections", "defect_history", "audit_trail", "fleet_summary"}
    found = {
        r["name"]
        for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
    }
    missing = expected - found
    if missing:
        log.error("Missing tables: %s", missing)
        return False

    log.info("All tables present:")
    for table in sorted(found):
        n = conn.execute(f"SELECT COUNT(*) FROM [{table}]").fetchone()[0]
        log.info("  %-20s  %d row(s)", table, n)
    return True


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def init_database(db_path: Path = DB_FILE, reset: bool = False) -> sqlite3.Connection:
    """
    Initialise the database and return an open connection.

    Parameters
    ----------
    db_path : Path   Where to create the .db file.
    reset   : bool   If True, all existing data is wiped before re-applying
                     the schema. Use only in development / CI.

    Returns
    -------
    sqlite3.Connection   Ready-to-use connection (caller is responsible for closing).
    """
    log.info("Database: %s", db_path)
    conn = get_connection(db_path)

    if reset:
        log.warning("--reset: dropping all existing tables and data.")
        _drop_all_tables(conn)

    _apply_schema(conn)
    _seed_fleet_summary(conn)

    if not _verify(conn):
        log.error("Initialisation failed.")
        sys.exit(1)

    log.info("Database ready.")
    return conn


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialise the SecureVision Edge SQLite database."
    )
    parser.add_argument(
        "--reset", action="store_true",
        help="Drop all tables and rebuild from schema.sql (destroys existing data).",
    )
    parser.add_argument(
        "--db", type=Path, default=DB_FILE, metavar="PATH",
        help=f"SQLite file path (default: {DB_FILE}).",
    )
    args = parser.parse_args()
    conn = init_database(db_path=args.db, reset=args.reset)
    conn.close()
