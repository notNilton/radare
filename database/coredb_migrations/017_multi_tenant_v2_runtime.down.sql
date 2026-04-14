DROP POLICY IF EXISTS tenant_self ON tenants;

DROP POLICY IF EXISTS tenant_isolation ON webhooks;
DROP POLICY IF EXISTS tenant_isolation ON idempotency_keys;
DROP POLICY IF EXISTS tenant_isolation ON reconciliation_results;
DROP POLICY IF EXISTS tenant_isolation ON reconciliation_runs_core;
DROP POLICY IF EXISTS tenant_isolation ON reconciliation_templates;
DROP POLICY IF EXISTS tenant_isolation ON api_keys;
DROP POLICY IF EXISTS tenant_isolation ON external_tag_mappings;
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
DROP POLICY IF EXISTS tenant_isolation ON reconciliations;
DROP POLICY IF EXISTS tenant_isolation ON workspace_versions;
DROP POLICY IF EXISTS tenant_isolation ON workspaces;
DROP POLICY IF EXISTS tenant_isolation ON tags;
DROP POLICY IF EXISTS tenant_isolation ON users;
DROP POLICY IF EXISTS tenant_isolation ON equipment;
DROP POLICY IF EXISTS tenant_isolation ON units;
DROP POLICY IF EXISTS tenant_isolation ON sites;

ALTER TABLE webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs_core DISABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE external_tag_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS idempotency_keys;
DROP TABLE IF EXISTS reconciliation_results;
DROP TABLE IF EXISTS reconciliation_runs_core;
DROP TABLE IF EXISTS reconciliation_templates;

DROP INDEX IF EXISTS idx_api_keys_tenant_prefix;
DROP INDEX IF EXISTS idx_external_tag_mappings_tenant_connector_name;
DROP INDEX IF EXISTS idx_tags_tenant_name;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
ALTER TABLE external_tag_mappings ADD CONSTRAINT external_tag_mappings_connector_type_external_name_key UNIQUE (connector_type, external_name);
CREATE INDEX IF NOT EXISTS idx_external_tag_mappings_connector_name
    ON external_tag_mappings(connector_type, external_name)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_workspaces_equipment_id;
DROP INDEX IF EXISTS idx_workspaces_unit_id;
DROP INDEX IF EXISTS idx_workspaces_site_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS equipment_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS unit_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS site_id;

DROP INDEX IF EXISTS idx_equipment_tenant_id;
DROP INDEX IF EXISTS idx_units_tenant_id;
DROP INDEX IF EXISTS idx_sites_tenant_id;
ALTER TABLE equipment DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE units DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE api_keys ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE external_tag_mappings ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE reconciliations ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE workspace_versions ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE workspaces ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE tags ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;
