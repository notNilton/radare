-- Migration 012: Convert reconciliations to a monthly range-partitioned table.
--
-- Strategy:
--   1. Rename existing table to reconciliations_nonpartitioned.
--   2. Release the BIGSERIAL sequence from the old table so it survives DROP.
--   3. Create new PARTITION BY RANGE (created_at) table using the same sequence.
--   4. Create a DEFAULT catch-all partition + monthly partitions (2024-01 → 2027-12).
--   5. Copy all rows from the old table into the new one.
--   6. Advance the sequence past the maximum existing id.
--   7. Drop the old table.
--   8. Re-create indexes on the partitioned table.
--
-- Note: The primary key is (id, created_at) because Postgres requires the
-- partition column to be part of any UNIQUE constraint on a partitioned table.
-- No other table has a FK pointing to reconciliations(id), so this is safe.

-- Step 1 & 2: Rename and release the sequence ownership to avoid cascade drop.
ALTER TABLE reconciliations RENAME TO reconciliations_nonpartitioned;
ALTER SEQUENCE reconciliations_id_seq OWNED BY NONE;

-- Step 3: New partitioned table.
CREATE TABLE reconciliations (
    id                   BIGINT           NOT NULL DEFAULT nextval('reconciliations_id_seq'),
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
    outlier_contribution DOUBLE PRECISION NOT NULL DEFAULT 0,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Transfer sequence ownership to the new table so it won't be orphaned.
ALTER SEQUENCE reconciliations_id_seq OWNED BY reconciliations.id;

-- Step 4a: DEFAULT partition — catches rows outside any named partition window.
CREATE TABLE reconciliations_default PARTITION OF reconciliations DEFAULT;

-- Step 4b: Monthly partitions 2024-01 → 2027-12 (partition worker extends this).
DO $$
DECLARE
    d      DATE := DATE '2024-01-01';
    pname  TEXT;
    pstart TEXT;
    pend   TEXT;
BEGIN
    WHILE d < DATE '2028-01-01' LOOP
        pname  := 'reconciliations_' || TO_CHAR(d, 'YYYY_MM');
        pstart := TO_CHAR(d, 'YYYY-MM-DD');
        pend   := TO_CHAR(d + INTERVAL '1 month', 'YYYY-MM-DD');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF reconciliations '
            'FOR VALUES FROM (%L) TO (%L)',
            pname, pstart, pend
        );
        d := d + INTERVAL '1 month';
    END LOOP;
END $$;

-- Step 5: Copy existing rows (Postgres routes each row to the right partition).
INSERT INTO reconciliations (
    id, created_at, updated_at, deleted_at,
    user_id, workspace_version_id,
    measurements, tolerances, constraints, reconciled_values, corrections,
    consistency_status,
    chi_square, critical_value, statistical_validity,
    confidence_score, outlier_index, outlier_tag, outlier_contribution
)
SELECT
    id, created_at, updated_at, deleted_at,
    user_id, workspace_version_id,
    measurements, tolerances, constraints, reconciled_values, corrections,
    consistency_status,
    chi_square, critical_value, statistical_validity,
    confidence_score, outlier_index, outlier_tag, outlier_contribution
FROM reconciliations_nonpartitioned;

-- Step 6: Advance sequence so new rows get IDs above existing max.
SELECT setval('reconciliations_id_seq', COALESCE(MAX(id), 1))
FROM reconciliations_nonpartitioned;

-- Step 7: Drop old non-partitioned table.
DROP TABLE reconciliations_nonpartitioned;

-- Step 8: Recreate indexes on the partitioned table.
-- Partitioned indexes are automatically inherited by new partitions created later.
CREATE INDEX idx_reconciliations_deleted_at
    ON reconciliations (deleted_at);
CREATE INDEX idx_reconciliations_user_id
    ON reconciliations (user_id);
CREATE INDEX idx_reconciliations_created_at
    ON reconciliations (created_at DESC);
CREATE INDEX idx_reconciliations_user_status_created_at
    ON reconciliations (user_id, consistency_status, created_at DESC);
CREATE INDEX idx_reconciliations_workspace_version_id
    ON reconciliations (workspace_version_id);
