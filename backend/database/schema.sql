-- =============================================================================
-- SecureVision Edge — SQLite Schema
-- =============================================================================
-- All five tables required by the application.
-- Run through init_db.py — do not execute this file directly in production.
--
-- Foreign key enforcement must be switched on per-connection:
--   PRAGMA foreign_keys = ON;
-- =============================================================================

PRAGMA foreign_keys = ON;


-- ---------------------------------------------------------------------------
-- Table: components
-- Master registry of every physical aerospace component being tracked.
-- One component → many inspections, many defect_history rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS components (
    id                   INTEGER  PRIMARY KEY AUTOINCREMENT,

    -- Unique human-readable ID matching the frontend, e.g. "CMP-737-LWLE-042"
    component_id         TEXT     NOT NULL UNIQUE,

    -- Full descriptive name, e.g. "Left Wing Leading Edge"
    name                 TEXT     NOT NULL DEFAULT '',

    -- Aircraft type, e.g. "Boeing 737-800"
    aircraft_model       TEXT     NOT NULL,

    -- Tail/registration number, e.g. "N7842B"
    tail_number          TEXT     NOT NULL DEFAULT '',

    -- Accumulated flight hours since last overhaul
    flight_hours         INTEGER  NOT NULL DEFAULT 0,

    -- Number of pressurisation / load cycles accumulated
    stress_cycles        INTEGER  NOT NULL DEFAULT 0,

    -- Peak temperature exposure recorded this period (°C)
    temperature_exposure REAL     NOT NULL DEFAULT 0.0,

    -- Operational status: safe | monitor | recheck | ground
    status               TEXT     NOT NULL DEFAULT 'safe',

    -- AI-computed risk score 0–100
    risk_score           REAL     NOT NULL DEFAULT 0.0,

    created_at           TIMESTAMP NOT NULL DEFAULT (datetime('now'))
);


-- ---------------------------------------------------------------------------
-- Table: inspections
-- One row per AI analysis run on a component image.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    id               INTEGER   PRIMARY KEY AUTOINCREMENT,

    -- Component that was inspected (references components.component_id)
    component_id     TEXT      NOT NULL,

    -- When the inspection was performed
    inspection_date  TIMESTAMP NOT NULL DEFAULT (datetime('now')),

    -- File path to the uploaded image inside backend/uploads/
    image_path       TEXT      NOT NULL DEFAULT '',

    -- Primary defect found by the AI, e.g. "Fatigue Crack"
    defect_type      TEXT      NOT NULL DEFAULT 'None',

    -- Severity level: low | medium | high | critical
    severity         TEXT      NOT NULL DEFAULT 'low',

    -- AI model confidence for the primary finding (0.0 – 1.0)
    confidence_score REAL      NOT NULL DEFAULT 0.0,

    -- Human-readable AI recommendation for the maintenance team
    recommendation   TEXT      NOT NULL DEFAULT '',

    created_at       TIMESTAMP NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (component_id) REFERENCES components(component_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ---------------------------------------------------------------------------
-- Table: defect_history
-- Time-series measurement points for each defect on each component.
-- Enables growth-rate calculation and risk prediction over time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defect_history (
    id                  INTEGER   PRIMARY KEY AUTOINCREMENT,

    -- Component this defect belongs to
    component_id        TEXT      NOT NULL,

    -- Defect classification being tracked
    defect_type         TEXT      NOT NULL,

    -- Risk score at the previous measurement point (0–100)
    previous_score      REAL      NOT NULL DEFAULT 0.0,

    -- Risk score at this measurement point (0–100)
    current_score       REAL      NOT NULL DEFAULT 0.0,

    -- Rate of score change per flight cycle (AI-computed)
    growth_rate         REAL      NOT NULL DEFAULT 0.0,

    -- Predicted date when risk will exceed the critical threshold (80)
    predicted_risk_date TIMESTAMP,

    FOREIGN KEY (component_id) REFERENCES components(component_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ---------------------------------------------------------------------------
-- Table: audit_trail
-- Tamper-evident, hash-chained ledger of every significant action.
-- Each row stores its own SHA-256 hash and the hash of the previous row
-- so the full chain can be re-verified at any time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_trail (
    id               INTEGER   PRIMARY KEY AUTOINCREMENT,

    -- Inspection that triggered this event (NULL for system-level events)
    inspection_id    INTEGER,

    -- SHA-256 hex digest covering this record's canonical content
    hash_value       TEXT      NOT NULL,

    -- SHA-256 hex digest of the immediately preceding audit record
    -- NULL for the very first (genesis) record
    previous_hash    TEXT,

    -- "verified" | "anomaly" — result of hash-chain verification
    integrity_status TEXT      NOT NULL DEFAULT 'verified',

    timestamp        TIMESTAMP NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (inspection_id) REFERENCES inspections(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);


-- ---------------------------------------------------------------------------
-- Table: fleet_summary
-- Single-row cache of aggregated fleet-wide statistics.
-- The backend refreshes this row after every inspection or status change.
-- Dashboards read from here instead of running expensive aggregation queries.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fleet_summary (
    id                INTEGER   PRIMARY KEY AUTOINCREMENT,

    -- Number of components currently in the system
    total_components  INTEGER   NOT NULL DEFAULT 0,

    -- Cumulative number of inspections across all time
    total_inspections INTEGER   NOT NULL DEFAULT 0,

    -- Components currently at "ground" (critical / grounded) status
    critical_defects  INTEGER   NOT NULL DEFAULT 0,

    -- Fleet-wide weighted average risk score (0–100)
    fleet_risk_score  REAL      NOT NULL DEFAULT 0.0,

    -- When this summary was last recomputed
    last_updated      TIMESTAMP NOT NULL DEFAULT (datetime('now'))
);
