CREATE TABLE IF NOT EXISTS workspaces (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    name TEXT NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workspaces_deleted_at ON workspaces (deleted_at);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces (owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_updated_at
    ON workspaces (owner_id, updated_at DESC);
