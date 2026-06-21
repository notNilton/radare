// Package workers contains background goroutines for external data ingestion.
package workers

import (
	"context"
	"log/slog"
	"time"

	"radare-datarecon/apps/backend/internal/cache"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"

	"gorm.io/gorm"
)

// StartSchedulerWorker queries all workspaces with a non-empty schedule_interval
// and spawns a per-workspace goroutine that runs reconciliation on each tick.
// Each goroutine exits cleanly when ctx is cancelled.
func StartSchedulerWorker(ctx context.Context, db *gorm.DB) {
	go func() {
		// Give the rest of the application a moment to initialise before the
		// first workspace scan.
		select {
		case <-ctx.Done():
			return
		case <-time.After(5 * time.Second):
		}

		slog.Info("Scheduler worker started")
		scheduleWorkspaces(ctx, db)
	}()
}

// scheduleWorkspaces fetches all workspaces with a ScheduleInterval set and
// spawns a ticker goroutine for each one.
func scheduleWorkspaces(ctx context.Context, db *gorm.DB) {
	var workspaces []models.Workspace
	if err := db.Where("schedule_interval != '' AND schedule_interval IS NOT NULL").Find(&workspaces).Error; err != nil {
		slog.Warn("Scheduler worker: failed to query scheduled workspaces", "error", err)
		return
	}

	slog.Info("Scheduler worker: found scheduled workspaces", "count", len(workspaces))

	for _, ws := range workspaces {
		ws := ws // capture loop variable
		dur, err := time.ParseDuration(ws.ScheduleInterval)
		if err != nil {
			slog.Warn("Scheduler worker: invalid schedule_interval, skipping",
				"workspace_id", ws.ID,
				"schedule_interval", ws.ScheduleInterval,
				"error", err,
			)
			continue
		}

		go runScheduledWorkspace(ctx, db, ws, dur)
	}
}

// runScheduledWorkspace ticks at the given interval and enqueues a reconciliation
// task using the latest tag values from Redis.
func runScheduledWorkspace(ctx context.Context, db *gorm.DB, ws models.Workspace, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	slog.Info("Scheduler worker: started ticker for workspace",
		"workspace_id", ws.ID,
		"interval", interval,
	)

	for {
		select {
		case <-ctx.Done():
			slog.Info("Scheduler worker: stopping ticker for workspace", "workspace_id", ws.ID)
			return
		case <-ticker.C:
			runWorkspaceReconciliation(ctx, db, ws)
		}
	}
}

// runWorkspaceReconciliation fetches the latest tag values for the workspace
// and enqueues a reconciliation task.
func runWorkspaceReconciliation(ctx context.Context, db *gorm.DB, ws models.Workspace) {
	// Fetch all tags for this tenant.
	tagRepo := repositories.NewTagRepository(db)
	tags, err := tagRepo.ListByTenant(ws.TenantID)
	if err != nil {
		slog.Warn("Scheduler: failed to fetch tags", "workspace_id", ws.ID, "error", err)
		return
	}

	if len(tags) == 0 {
		slog.Debug("Scheduler: no tags for workspace", "workspace_id", ws.ID)
		return
	}

	// Gather current measurements from Redis.
	measurements := make([]float64, 0, len(tags))
	tagNames := make([]string, 0, len(tags))

	for _, tag := range tags {
		val, ok := cache.GetTagValue(ctx, tag.ID)
		if !ok {
			// Skip tags without a current value.
			continue
		}
		measurements = append(measurements, val)
		tagNames = append(tagNames, tag.Name)
	}

	if len(measurements) == 0 {
		slog.Debug("Scheduler: no cached values for workspace tags", "workspace_id", ws.ID)
		return
	}

	// Build default tolerances (5%) and a simple conservation constraint
	// (sum of all = sum of all, i.e. identity row — serves as a no-op placeholder
	// when the workspace data does not supply explicit constraints).
	tolerances := make([]float64, len(measurements))
	for i := range tolerances {
		tolerances[i] = 0.05
	}

	// Default single constraint: sum of measurements == 0 (identity placeholder).
	constraint := make([]float64, len(measurements))
	for i := range constraint {
		constraint[i] = 1.0
	}
	constraints := [][]float64{constraint}

	wsID := ws.ID
	tenantID := ws.TenantID

	EnqueueReconciliation(ReconciliationTask{
		Measurements: measurements,
		Tolerances:   tolerances,
		Constraints:  constraints,
		TagNames:     tagNames,
		UserID:       ws.OwnerID,
		TenantID:     &tenantID,
		WorkspaceID:  &wsID,
	})

	slog.Info("Scheduler: enqueued reconciliation for workspace",
		"workspace_id", ws.ID,
		"measurements", len(measurements),
	)
}
