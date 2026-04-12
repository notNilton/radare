-- Bootstrap audit log entries for the demo/development environment.
-- These entries simulate the initial setup actions performed by the admin user.
-- In production this table fills organically — these seeds are dev-only.

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
VALUES
  (1, 'create', 'user',      '1',  '{"note": "bootstrap admin created"}'),
  (1, 'create', 'tag',       '1',  '{"name": "FI-101", "unit": "m3/h"}'),
  (1, 'create', 'tag',       '2',  '{"name": "FI-102", "unit": "m3/h"}'),
  (1, 'create', 'workspace', '1',  '{"name": "Processo Demo"}')
ON CONFLICT DO NOTHING;

-- Bootstrap a reconciliation run snapshot for the demo workspace.
INSERT INTO reconciliation_runs (user_id, workspace_id, status, chi_square, confidence_score, payload)
VALUES
  (1, 1, 'Consistente', 2.34, 0.92,
   '{"measurements": [100, 60, 40], "reconciled_values": [100.1, 59.8, 40.3]}'::jsonb)
ON CONFLICT DO NOTHING;
