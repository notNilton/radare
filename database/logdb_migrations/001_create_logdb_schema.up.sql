-- LogDB Schema: observability tables isolated from the main Postgres instance.
--
-- IMPORTANT: No foreign keys reference tables in the main DB.
-- user_id is stored as plain BIGINT for cross-DB traceability.

CREATE TABLE IF NOT EXISTS audit_logs (
    id            BIGSERIAL    PRIMARY KEY,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ  NULL,
    user_id       BIGINT       NOT NULL,
    action        TEXT         NOT NULL,
    resource_type TEXT         NOT NULL,
    resource_id   TEXT         NOT NULL DEFAULT '',
    details       JSONB        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted_at
    ON audit_logs (deleted_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at
    ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
    ON audit_logs (resource_type, resource_id);

-- Immutable reconciliation execution snapshots for observability / replay.
CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id               BIGSERIAL        PRIMARY KEY,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    user_id          BIGINT           NULL,
    workspace_id     BIGINT           NULL,
    status           TEXT             NOT NULL,
    chi_square       DOUBLE PRECISION NOT NULL DEFAULT 0,
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    payload          JSONB            NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_created_at
    ON reconciliation_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_user_id
    ON reconciliation_runs (user_id);
