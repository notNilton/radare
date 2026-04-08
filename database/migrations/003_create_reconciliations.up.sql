CREATE TABLE IF NOT EXISTS reconciliations (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    measurements JSONB NOT NULL DEFAULT '[]'::jsonb,
    tolerances JSONB NOT NULL DEFAULT '[]'::jsonb,
    constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
    reconciled_values JSONB NOT NULL DEFAULT '[]'::jsonb,
    corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
    consistency_status TEXT
);

CREATE INDEX IF NOT EXISTS idx_reconciliations_deleted_at ON reconciliations (deleted_at);
CREATE INDEX IF NOT EXISTS idx_reconciliations_user_id ON reconciliations (user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_created_at ON reconciliations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliations_user_status_created_at
    ON reconciliations (user_id, consistency_status, created_at DESC);
