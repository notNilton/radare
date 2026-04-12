CREATE TABLE IF NOT EXISTS external_tag_mappings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    connector_type TEXT NOT NULL CHECK (connector_type IN ('mqtt', 'influxdb', 'manual')),
    external_name TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT '',
    UNIQUE (connector_type, external_name)
);

CREATE INDEX IF NOT EXISTS idx_external_tag_mappings_deleted_at
    ON external_tag_mappings (deleted_at);
CREATE INDEX IF NOT EXISTS idx_external_tag_mappings_connector_name
    ON external_tag_mappings (connector_type, external_name)
    WHERE deleted_at IS NULL;
