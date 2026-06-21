-- Migration 018: Add webhook and scheduling columns to workspaces.
--
-- webhook_url: optional URL to POST reconciliation results to after a run.
-- schedule_interval: cron-style or duration string (e.g. '*/15 * * * *', '1h')
--   that drives automated reconciliation scheduling. Empty string means disabled.

ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS webhook_url TEXT;

ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS schedule_interval TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN workspaces.webhook_url IS
    'Optional HTTP(S) endpoint that receives a POST with the reconciliation result payload after each run. NULL means disabled.';

COMMENT ON COLUMN workspaces.schedule_interval IS
    'Cron expression or duration string controlling automatic reconciliation runs (e.g. ''*/15 * * * *'', ''1h''). Empty string disables scheduling.';
