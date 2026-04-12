ALTER TABLE reconciliations
    DROP COLUMN IF EXISTS outlier_contribution,
    DROP COLUMN IF EXISTS outlier_tag,
    DROP COLUMN IF EXISTS outlier_index,
    DROP COLUMN IF EXISTS confidence_score,
    DROP COLUMN IF EXISTS statistical_validity,
    DROP COLUMN IF EXISTS critical_value,
    DROP COLUMN IF EXISTS chi_square;
