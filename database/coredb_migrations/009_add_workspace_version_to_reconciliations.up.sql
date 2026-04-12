ALTER TABLE reconciliations
    ADD COLUMN IF NOT EXISTS workspace_version_id BIGINT NULL
        REFERENCES workspace_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reconciliations_workspace_version_id
    ON reconciliations (workspace_version_id);
