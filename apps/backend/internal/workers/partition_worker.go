package workers

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// StartPartitionWorker ensures that monthly partitions for the reconciliations
// table exist for the current month and the next `ahead` months. It runs once
// at startup and then checks again on the 1st of each month.
//
// If the reconciliations table is not partitioned (e.g., migration 012 has not
// been applied yet), the SQL is a no-op because CREATE TABLE … PARTITION OF
// simply fails silently inside the IF NOT EXISTS guard.
func StartPartitionWorker(ctx context.Context, db *gorm.DB) {
	// Ensure partitions exist immediately on startup.
	ensureMonthlyPartitions(db, 13)

	go func() {
		// Check daily; the actual work is only done on month boundaries.
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				if t.Day() <= 2 { // run on 1st and 2nd to account for timezone drift
					ensureMonthlyPartitions(db, 13)
				}
			}
		}
	}()
}

// StartPartitionPruningWorker runs daily and calls prune_old_reconciliation_partitions(N)
// on coreDB to drop partitions older than PARTITION_RETENTION_DAYS (default 90).
func StartPartitionPruningWorker(ctx context.Context, db *gorm.DB) {
	retentionDays := 90
	if raw := os.Getenv("PARTITION_RETENTION_DAYS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			retentionDays = parsed
		}
	}

	go func() {
		// Run once shortly after startup.
		select {
		case <-ctx.Done():
			return
		case <-time.After(10 * time.Second):
		}
		pruneOldPartitions(db, retentionDays)

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				pruneOldPartitions(db, retentionDays)
			}
		}
	}()
}

func pruneOldPartitions(db *gorm.DB, retentionDays int) {
	slog.Info("Partition pruning: running", "retention_days", retentionDays)
	if err := db.Exec("SELECT prune_old_reconciliation_partitions(?)", retentionDays).Error; err != nil {
		slog.Warn("Partition pruning: SQL function failed (may not exist yet)", "error", err)
		return
	}
	slog.Info("Partition pruning: completed", "retention_days", retentionDays)
}

// ensureMonthlyPartitions creates up to `months` monthly partition tables
// starting from the current month. Existing partitions are silently skipped.
func ensureMonthlyPartitions(db *gorm.DB, months int) {
	now := time.Now().UTC()
	for i := range months {
		month := now.AddDate(0, i, 0)
		start := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 1, 0)

		partName := fmt.Sprintf("reconciliations_%d_%02d", start.Year(), int(start.Month()))
		sql := fmt.Sprintf(
			`CREATE TABLE IF NOT EXISTS %s PARTITION OF reconciliations `+
				`FOR VALUES FROM ('%s') TO ('%s')`,
			partName,
			start.Format("2006-01-02"),
			end.Format("2006-01-02"),
		)

		if err := db.Exec(sql).Error; err != nil {
			// This is a no-op if the table is not yet partitioned; log at Debug.
			slog.Debug("Partition ensure skipped", "name", partName, "error", err)
		} else {
			slog.Debug("Partition ensured", "name", partName)
		}
	}
}
