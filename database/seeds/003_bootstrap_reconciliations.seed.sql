INSERT INTO reconciliations (
    user_id,
    measurements,
    tolerances,
    constraints,
    reconciled_values,
    corrections,
    consistency_status
)
SELECT
    users.id,
    '[161, 79]'::jsonb,
    '[0.05, 0.01]'::jsonb,
    '[[-1, 1]]'::jsonb,
    '[120, 120]'::jsonb,
    '[-41, 41]'::jsonb,
    'Inconsistente'
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reconciliations
      WHERE reconciliations.user_id = users.id
        AND reconciliations.measurements = '[161, 79]'::jsonb
        AND reconciliations.reconciled_values = '[120, 120]'::jsonb
  );

INSERT INTO reconciliations (
    user_id,
    measurements,
    tolerances,
    constraints,
    reconciled_values,
    corrections,
    consistency_status
)
SELECT
    users.id,
    '[100, 100]'::jsonb,
    '[0.02, 0.02]'::jsonb,
    '[[-1, 1]]'::jsonb,
    '[100, 100]'::jsonb,
    '[0, 0]'::jsonb,
    'Consistente'
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reconciliations
      WHERE reconciliations.user_id = users.id
        AND reconciliations.measurements = '[100, 100]'::jsonb
        AND reconciliations.reconciled_values = '[100, 100]'::jsonb
  );
