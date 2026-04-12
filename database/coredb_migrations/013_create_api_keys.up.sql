-- API keys allow external connectors (MQTT bridges, scripts) to push data
-- to /api/ingest/values without a JWT session.
-- Key format: rdre_<40 random hex chars>
-- prefix column stores the first 12 characters for O(1) lookup by index.
-- key_hash stores the bcrypt hash of the full raw key.

CREATE TABLE IF NOT EXISTS api_keys (
    id           BIGSERIAL    PRIMARY KEY,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    revoked_at   TIMESTAMPTZ  NULL,
    last_used_at TIMESTAMPTZ  NULL,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT         NOT NULL,
    prefix       TEXT         NOT NULL,
    key_hash     TEXT         NOT NULL,
    CONSTRAINT uq_api_keys_prefix UNIQUE (prefix)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix  ON api_keys (prefix);
