-- Down: revert to a plain non-partitioned table (data is preserved via copy).
-- WARNING: this operation rewrites the table and may take time on large datasets.

-- Copy data out of the partitioned table before dropping it.
CREATE TABLE reconciliations_restore AS
    SELECT * FROM reconciliations;

-- Drop the partitioned table and all child partitions.
DROP TABLE reconciliations CASCADE;

-- Recreate simple non-partitioned table.
CREATE TABLE reconciliations (
    id                   BIGSERIAL        PRIMARY KEY,
    created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ      NULL,
    user_id              BIGINT           NOT NULL,
    workspace_version_id BIGINT           NULL,
    measurements         JSONB            NOT NULL DEFAULT '[]'::jsonb,
    tolerances           JSONB            NOT NULL DEFAULT '[]'::jsonb,
    constraints          JSONB            NOT NULL DEFAULT '[]'::jsonb,
    reconciled_values    JSONB            NOT NULL DEFAULT '[]'::jsonb,
    corrections          JSONB            NOT NULL DEFAULT '[]'::jsonb,
    consistency_status   TEXT,
    chi_square           DOUBLE PRECISION NOT NULL DEFAULT 0,
    critical_value       DOUBLE PRECISION NOT NULL DEFAULT 0,
    statistical_validity BOOLEAN          NOT NULL DEFAULT TRUE,
    confidence_score     DOUBLE PRECISION NOT NULL DEFAULT 0,
    outlier_index        BIGINT           NOT NULL DEFAULT -1,
    outlier_tag          TEXT             NOT NULL DEFAULT '',
    outlier_contribution DOUBLE PRECISION NOT NULL DEFAULT 0
);

INSERT INTO reconciliations SELECT * FROM reconciliations_restore;
SELECT setval('reconciliations_id_seq', COALESCE(MAX(id), 1)) FROM reconciliations_restore;
DROP TABLE reconciliations_restore;

CREATE INDEX idx_reconciliations_deleted_at ON reconciliations (deleted_at);
CREATE INDEX idx_reconciliations_user_id    ON reconciliations (user_id);
CREATE INDEX idx_reconciliations_created_at ON reconciliations (created_at DESC);
CREATE INDEX idx_reconciliations_user_status_created_at
    ON reconciliations (user_id, consistency_status, created_at DESC);
