// Package workers contains background goroutines for external data ingestion.
package workers

import (
	"context"
	"log/slog"
	"os"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// StartLogDBRetentionWorker runs daily and calls apply_log_retention() on logDB
// to purge records older than LOG_RETENTION_DAYS (default 180).
func StartLogDBRetentionWorker(ctx context.Context, db *gorm.DB) {
	if db == nil {
		slog.Info("LogDB retention worker: no LogDB configured, skipping")
		return
	}

	retentionDays := 180
	if raw := os.Getenv("LOG_RETENTION_DAYS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			retentionDays = parsed
		}
	}

	go func() {
		// Small delay to let the application fully start.
		select {
		case <-ctx.Done():
			return
		case <-time.After(15 * time.Second):
		}
		applyLogRetention(db, retentionDays)

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				applyLogRetention(db, retentionDays)
			}
		}
	}()
}

func applyLogRetention(db *gorm.DB, retentionDays int) {
	slog.Info("LogDB retention: running", "retention_days", retentionDays)

	result := db.Exec("SELECT apply_log_retention(?)", retentionDays)
	if result.Error != nil {
		slog.Warn("LogDB retention: SQL function failed (may not exist yet)", "error", result.Error)
		return
	}

	slog.Info("LogDB retention: completed", "rows_affected", result.RowsAffected, "retention_days", retentionDays)
}
