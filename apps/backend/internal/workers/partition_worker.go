package workers

import (
	"context"
	"fmt"
	"log/slog"
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
