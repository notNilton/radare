INSERT INTO reconciliations (
    user_id,
    measurements,
    tolerances,
    constraints,
    reconciled_values,
    corrections,
    consistency_status,
    chi_square,
    critical_value,
    statistical_validity,
    confidence_score,
    outlier_index,
    outlier_tag,
    outlier_contribution
)
SELECT
    users.id,
    '[161, 79, 80]'::jsonb,
    '[0.05, 0.01, 0.01]'::jsonb,
    '[[1, -1, -1]]'::jsonb,
    '[159.03826744527493, 79.01889305640067, 80.01937438887425]'::jsonb,
    '[-1.9617325547250744, 0.01889305640067107, 0.019374388874254578]'::jsonb,
    'Consistente',
    0.0605449652320537,
    3.841458820694124,
    TRUE,
    0.8056366649194435,
    0,
    'M1',
    0.05938651466020857
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reconciliations
      WHERE reconciliations.user_id = users.id
        AND reconciliations.measurements = '[161, 79, 80]'::jsonb
        AND reconciliations.constraints = '[[1, -1, -1]]'::jsonb
  );

INSERT INTO reconciliations (
    user_id,
    measurements,
    tolerances,
    constraints,
    reconciled_values,
    corrections,
    consistency_status,
    chi_square,
    critical_value,
    statistical_validity,
    confidence_score,
    outlier_index,
    outlier_tag,
    outlier_contribution
)
SELECT
    users.id,
    '[101, 11, 19, 32, 41, 14, 15, 10, 21, 16, 15, 54, 48]'::jsonb,
    '[0.01, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.01, 0.01]'::jsonb,
    '[[-1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, -1, 0, 1, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 1, 0], [0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, -1, -1, -1, 0, 0, 1]]'::jsonb,
    '[101.41383, 10.75716, 21.00486, 30.64682, 39.00498, 15.63168, 15.01515, 10.75716, 21.00486, 15.63168, 15.01515, 54.01515, 47.39422]'::jsonb,
    '[0.41383, -0.24284, 2.00486, -1.35318, -1.99502, 1.63168, 0.01515, 0.75716, 0.00486, -0.36832, 0.01515, 0.01515, -0.60578]'::jsonb,
    'Inconsistente',
    16.011813487841128,
    15.50731305586545,
    FALSE,
    0.0420,
    5,
    'A6',
    5.433040734693879
FROM users
WHERE users.username = 'nilton.naab@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM reconciliations
      WHERE reconciliations.user_id = users.id
        AND reconciliations.measurements = '[101, 11, 19, 32, 41, 14, 15, 10, 21, 16, 15, 54, 48]'::jsonb
  );
