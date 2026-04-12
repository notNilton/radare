package workers

import (
	"context"
	"fmt"
	"log/slog"
	"radare-datarecon/apps/backend/internal/hub"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/reconciliation"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"

	"gonum.org/v1/gonum/mat"
)

// ReconciliationTask represents a reconciliation job to be processed in the background.
type ReconciliationTask struct {
	Measurements []float64
	Tolerances   []float64
	Constraints  [][]float64
	TagNames     []string
	UserID       uint
	TenantID     *uint
	WorkspaceID  *uint
}

var (
	// ReconciliationQueue is the channel where reconciliation tasks are sent.
	ReconciliationQueue = make(chan ReconciliationTask, 100)
)

// EnqueueReconciliation adds a task to the reconciliation queue.
func EnqueueReconciliation(task ReconciliationTask) {
	select {
	case ReconciliationQueue <- task:
		slog.Debug("Reconciliation task enqueued", "user_id", task.UserID)
	default:
		slog.Warn("Reconciliation queue full, dropping task", "user_id", task.UserID)
	}
}

// StartReconciliationWorker starts a pool of goroutines to process reconciliation tasks.
func StartReconciliationWorker(ctx context.Context, numWorkers int) {
	for i := 0; i < numWorkers; i++ {
		go func(workerID int) {
			slog.Info("Reconciliation worker started", "worker_id", workerID)
			for {
				select {
				case <-ctx.Done():
					slog.Info("Reconciliation worker stopping", "worker_id", workerID)
					return
				case task := <-ReconciliationQueue:
					processTask(ctx, task)
				}
			}
		}(i)
	}
}

func processTask(ctx context.Context, task ReconciliationTask) {
	// Reconstruct constraints matrix
	rows := len(task.Constraints)
	if rows == 0 {
		return
	}
	cols := len(task.Constraints[0])
	constraints := mat.NewDense(rows, cols, nil)
	for i, row := range task.Constraints {
		constraints.SetRow(i, row)
	}

	// Perform reconciliation
	result, err := reconciliation.Reconcile(task.Measurements, task.Tolerances, constraints)
	if err != nil {
		slog.Error("Background reconciliation failed", "error", err, "user_id", task.UserID)
		hub.Default.Broadcast(hub.TypeReconciliationError, map[string]interface{}{
			"error":   fmt.Sprintf("Background reconciliation failed: %v", err),
			"user_id": task.UserID,
		})
		return
	}

	// Calculate corrections
	corrections := make([]float64, len(task.Measurements))
	for i := range task.Measurements {
		corrections[i] = result.ReconciledValues[i] - task.Measurements[i]
	}

	// Determine status
	status := "Inconsistente"
	if result.GlobalTest.StatisticalValidity {
		status = "Consistente"
	}

	outlierTag := ""
	if result.GlobalTest.OutlierIndex >= 0 && result.GlobalTest.OutlierIndex < len(task.TagNames) {
		outlierTag = task.TagNames[result.GlobalTest.OutlierIndex]
	}

	// Resolve the latest workspace version when the caller provides a workspace_id.
	var workspaceVersionID *uint
	if task.WorkspaceID != nil && *task.WorkspaceID > 0 {
		vRepo := repositories.NewWorkspaceVersionRepository(database.CoreDB)
		if latest, err := vRepo.LatestByWorkspace(*task.WorkspaceID); err == nil {
			workspaceVersionID = &latest.ID
		}
	}

	// Save to DB
	repository := repositories.NewReconciliationRepository(database.CoreDB)
	dbRecon := models.Reconciliation{
		UserID:              task.UserID,
		TenantID:            task.TenantID,
		WorkspaceVersionID:  workspaceVersionID,
		Measurements:        task.Measurements,
		Tolerances:          task.Tolerances,
		Constraints:         task.Constraints,
		ReconciledValues:    result.ReconciledValues,
		Corrections:         corrections,
		ConsistencyStatus:   status,
		ChiSquare:           result.GlobalTest.Statistic,
		CriticalValue:       result.GlobalTest.CriticalValue,
		StatisticalValidity: result.GlobalTest.StatisticalValidity,
		ConfidenceScore:     result.GlobalTest.ConfidenceScore,
		OutlierIndex:        result.GlobalTest.OutlierIndex,
		OutlierTag:          outlierTag,
		OutlierContribution: result.GlobalTest.OutlierContribution,
	}

	if err := repository.Create(&dbRecon); err != nil {
		slog.Error("Failed to save background reconciliation", "error", err, "user_id", task.UserID)
	}

	// Log snapshot
	database.LogReconciliationSnapshot(database.LogDB, &task.UserID, task.WorkspaceID, status, result.GlobalTest.Statistic, result.GlobalTest.ConfidenceScore, map[string]interface{}{
		"measurements":      task.Measurements,
		"tolerances":        task.Tolerances,
		"constraints":       task.Constraints,
		"reconciled_values": result.ReconciledValues,
		"corrections":       corrections,
		"outlier_index":     result.GlobalTest.OutlierIndex,
		"outlier_tag":       outlierTag,
		"background":        true,
	})

	// Broadcast result
	hub.Default.Broadcast(hub.TypeReconciliationResult, map[string]interface{}{
		"status":               status,
		"chi_square":           result.GlobalTest.Statistic,
		"critical_value":       result.GlobalTest.CriticalValue,
		"statistical_validity": result.GlobalTest.StatisticalValidity,
		"confidence_score":     result.GlobalTest.ConfidenceScore,
		"outlier_index":        result.GlobalTest.OutlierIndex,
		"outlier_tag":          outlierTag,
		"outlier_contribution": result.GlobalTest.OutlierContribution,
		"user_id":              task.UserID,
		"background":           true,
	})

	slog.Info("Background reconciliation completed", "user_id", task.UserID, "status", status)
}
