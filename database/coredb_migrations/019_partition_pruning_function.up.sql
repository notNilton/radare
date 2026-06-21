-- Migration 019: Partition pruning function for reconciliation tables.
--
-- prune_old_reconciliation_partitions(retention_days INTEGER DEFAULT 90)
--   Scans pg_inherits to find all child partitions whose names match the
--   pattern 'reconciliations_YYYY_MM'. Drops any partition whose month falls
--   outside the retention window. Returns the names of dropped tables.
--
-- Exceptions per partition are caught and logged to a NOTICE; the loop
-- continues so a single bad partition does not abort the entire prune.

CREATE OR REPLACE FUNCTION prune_old_reconciliation_partitions(
    retention_days INTEGER DEFAULT 90
)
RETURNS TABLE(dropped_table TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    r              RECORD;
    partition_date DATE;
    cutoff_date    DATE;
    part_name      TEXT;
BEGIN
    cutoff_date := CURRENT_DATE - retention_days;

    FOR r IN
        SELECT c.relname AS partition_name
        FROM pg_inherits i
        JOIN pg_class p ON p.oid = i.inhparent
        JOIN pg_class c ON c.oid = i.inhrelid
        WHERE p.relname LIKE 'reconciliation%'
          AND c.relname ~ '^reconciliations_[0-9]{4}_[0-9]{2}$'
        ORDER BY c.relname
    LOOP
        part_name := r.partition_name;
        BEGIN
            -- Extract date from partition name pattern reconciliations_YYYY_MM
            partition_date := TO_DATE(
                SUBSTRING(part_name FROM '[0-9]{4}_[0-9]{2}$'),
                'YYYY_MM'
            );

            IF partition_date < DATE_TRUNC('month', cutoff_date::TIMESTAMP) THEN
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', part_name);
                dropped_table := part_name;
                RETURN NEXT;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'prune_old_reconciliation_partitions: skipping % — %', part_name, SQLERRM;
        END;
    END LOOP;
END;
$$;
