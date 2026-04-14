DROP INDEX IF EXISTS idx_api_keys_tenant_id;
DROP INDEX IF EXISTS idx_external_tag_mappings_tenant_id;
DROP INDEX IF EXISTS idx_workspace_versions_tenant_id;
DROP INDEX IF EXISTS idx_audit_logs_tenant_id;
DROP INDEX IF EXISTS idx_workspaces_tenant_id;
DROP INDEX IF EXISTS idx_reconciliations_tenant_id;
DROP INDEX IF EXISTS idx_tags_tenant_id;
DROP INDEX IF EXISTS idx_users_tenant_id;

ALTER TABLE api_keys DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE external_tag_mappings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE workspace_versions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE reconciliations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tags DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
