DROP INDEX IF EXISTS idx_reconciliations_workspace_version_id;
ALTER TABLE reconciliations DROP COLUMN IF EXISTS workspace_version_id;
