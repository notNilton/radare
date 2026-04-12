package database

import (
	"encoding/json"
	"log/slog"

	"gorm.io/gorm"
)

// LogDB is the secondary observability database — stores audit logs and
// immutable reconciliation run snapshots. It has no foreign keys to CoreDB
// so it can run on an isolated Postgres instance.
//
// Fallback: if LOG_DB_URL is empty, LogDB is aliased to CoreDB so the app
// runs correctly without a second Postgres instance.
var LogDB *gorm.DB

// ConnectLogDB connects the LogDB. If dsn is empty it aliases LogDB to CoreDB.
func ConnectLogDB(dsn string) {
	if dsn == "" {
		slog.Info("LOG_DB_URL not set — LogDB aliased to CoreDB")
		LogDB = CoreDB
		return
	}
	LogDB = connect(dsn, "LogDB")
}

// LogReconciliationSnapshot stores an immutable reconciliation execution payload
// in the LogDB. Silently skipped if LogDB is nil or the table does not exist yet.
func LogReconciliationSnapshot(db *gorm.DB, userID *uint, workspaceID *uint, status string, chiSquare float64, confidenceScore float64, payload map[string]interface{}) {
	if db == nil {
		return
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		slog.Warn("Failed to marshal reconciliation snapshot", "error", err)
		return
	}

	if err := db.Exec(
		`INSERT INTO reconciliation_runs (user_id, workspace_id, status, chi_square, confidence_score, payload)
		 VALUES (?, ?, ?, ?, ?, ?::jsonb)`,
		userID, workspaceID, status, chiSquare, confidenceScore, string(raw),
	).Error; err != nil {
		slog.Warn("Failed to store reconciliation snapshot", "error", err)
	}
}
