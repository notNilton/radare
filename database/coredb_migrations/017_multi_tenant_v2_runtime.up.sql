INSERT INTO tenants (name, slug, status)
VALUES ('Nilbyte Internal', 'nilbyte', 'active')
ON CONFLICT (slug) DO NOTHING;

WITH default_tenant AS (
    SELECT id FROM tenants WHERE slug = 'nilbyte' LIMIT 1
)
UPDATE users SET tenant_id = (SELECT id FROM default_tenant) WHERE tenant_id IS NULL;

WITH default_tenant AS (
    SELECT id FROM tenants WHERE slug = 'nilbyte' LIMIT 1
)
UPDATE tags SET tenant_id = (SELECT id FROM default_tenant) WHERE tenant_id IS NULL;

UPDATE workspaces
SET tenant_id = users.tenant_id
FROM users
WHERE workspaces.owner_id = users.id AND workspaces.tenant_id IS NULL;

WITH default_tenant AS (
    SELECT id FROM tenants WHERE slug = 'nilbyte' LIMIT 1
)
UPDATE workspaces SET tenant_id = (SELECT id FROM default_tenant) WHERE tenant_id IS NULL;

UPDATE workspace_versions
SET tenant_id = workspaces.tenant_id
FROM workspaces
WHERE workspace_versions.workspace_id = workspaces.id AND workspace_versions.tenant_id IS NULL;

UPDATE reconciliations
SET tenant_id = users.tenant_id
FROM users
WHERE reconciliations.user_id = users.id AND reconciliations.tenant_id IS NULL;

UPDATE audit_logs
SET tenant_id = users.tenant_id
FROM users
WHERE audit_logs.user_id = users.id AND audit_logs.tenant_id IS NULL;

UPDATE external_tag_mappings
SET tenant_id = tags.tenant_id
FROM tags
WHERE external_tag_mappings.tag_id = tags.id AND external_tag_mappings.tenant_id IS NULL;

UPDATE api_keys
SET tenant_id = users.tenant_id
FROM users
WHERE api_keys.user_id = users.id AND api_keys.tenant_id IS NULL;

ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workspaces ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workspace_versions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reconciliations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE external_tag_mappings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE api_keys ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE units ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);

UPDATE units
SET tenant_id = sites.tenant_id
FROM sites
WHERE units.site_id = sites.id AND units.tenant_id IS NULL;

UPDATE equipment
SET tenant_id = units.tenant_id
FROM units
WHERE equipment.unit_id = units.id AND equipment.tenant_id IS NULL;

ALTER TABLE units ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE equipment ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tenant_id ON equipment(tenant_id);

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS equipment_id BIGINT REFERENCES equipment(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_site_id ON workspaces(site_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_unit_id ON workspaces(unit_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_equipment_id ON workspaces(equipment_id);

CREATE TABLE IF NOT EXISTS reconciliation_templates (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id BIGINT NULL REFERENCES workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    graph JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_templates_tenant_id
    ON reconciliation_templates(tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS reconciliation_runs_core (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id BIGINT NULL REFERENCES reconciliation_templates(id) ON DELETE SET NULL,
    workspace_version_id BIGINT NULL REFERENCES workspace_versions(id) ON DELETE SET NULL,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    idempotency_key TEXT NOT NULL DEFAULT '',
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_reconciliation_runs_core_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_core_tenant_created_at
    ON reconciliation_runs_core(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_core_status
    ON reconciliation_runs_core(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS reconciliation_results (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_id BIGINT NULL REFERENCES reconciliation_runs_core(id) ON DELETE SET NULL,
    reconciliation_id BIGINT NULL,
    tag_id BIGINT NULL REFERENCES tags(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT '',
    measurement DOUBLE PRECISION NULL,
    reconciled_value DOUBLE PRECISION NULL,
    correction DOUBLE PRECISION NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_results_tenant_created_at
    ON reconciliation_results(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_tenant_tag_created_at
    ON reconciliation_results(tenant_id, tag_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    scope TEXT NOT NULL,
    key TEXT NOT NULL,
    request_hash TEXT NOT NULL DEFAULT '',
    status_code INTEGER NOT NULL DEFAULT 0,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (tenant_id, scope, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_scope
    ON idempotency_keys(tenant_id, scope, created_at DESC);

CREATE TABLE IF NOT EXISTS webhooks (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL DEFAULT '',
    event_type TEXT NOT NULL DEFAULT 'reconciliation.run.completed',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_active
    ON webhooks(tenant_id, active);

ALTER TABLE tags DROP CONSTRAINT IF EXISTS idx_tags_name;
DROP INDEX IF EXISTS idx_tags_name;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_tenant_name
    ON tags(tenant_id, name)
    WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_external_tag_mappings_connector_name;
ALTER TABLE external_tag_mappings DROP CONSTRAINT IF EXISTS external_tag_mappings_connector_type_external_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_external_tag_mappings_tenant_connector_name
    ON external_tag_mappings(tenant_id, connector_type, external_name)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_tenant_prefix
    ON api_keys(tenant_id, prefix)
    WHERE revoked_at IS NULL;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'sites', 'units', 'equipment', 'users', 'tags', 'workspaces',
        'workspace_versions', 'reconciliations', 'audit_logs',
        'external_tag_mappings', 'api_keys', 'reconciliation_templates',
        'reconciliation_runs_core', 'reconciliation_results',
        'idempotency_keys', 'webhooks'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::BIGINT) WITH CHECK (tenant_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::BIGINT)',
            table_name
        );
    END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_self ON tenants;
CREATE POLICY tenant_self ON tenants
    USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::BIGINT)
    WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::BIGINT);
