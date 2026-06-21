-- LogDB Migration 002: Log retention configuration and enforcement function.
--
-- log_retention_config: stores per-table retention policy in days.
-- apply_log_retention(): iterates over the config and hard-deletes rows older
--   than the configured window from each table. Returns (table_name, rows_deleted).

CREATE TABLE IF NOT EXISTS log_retention_config (
    id             SERIAL       PRIMARY KEY,
    table_name     TEXT         NOT NULL UNIQUE,
    retention_days INTEGER      NOT NULL DEFAULT 180,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default retention for every public table that has a created_at column.
INSERT INTO log_retention_config (table_name, retention_days)
SELECT t.table_name, 180
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_schema = t.table_schema
    AND c.table_name  = t.table_name
    AND c.column_name = 'created_at'
WHERE t.table_schema = 'public'
  AND t.table_type   = 'BASE TABLE'
ON CONFLICT (table_name) DO NOTHING;

CREATE OR REPLACE FUNCTION apply_log_retention()
RETURNS TABLE(table_name TEXT, rows_deleted BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
    r        RECORD;
    deleted  BIGINT;
    cutoff   TIMESTAMPTZ;
BEGIN
    FOR r IN
        SELECT lrc.table_name, lrc.retention_days
        FROM log_retention_config lrc
        ORDER BY lrc.table_name
    LOOP
        BEGIN
            cutoff := NOW() - (r.retention_days || ' days')::INTERVAL;
            EXECUTE format(
                'WITH del AS (DELETE FROM %I WHERE created_at < $1 RETURNING 1) SELECT count(*) FROM del',
                r.table_name
            ) INTO deleted USING cutoff;
            table_name   := r.table_name;
            rows_deleted := COALESCE(deleted, 0);
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'apply_log_retention: skipping % — %', r.table_name, SQLERRM;
        END;
    END LOOP;
END;
$$;
