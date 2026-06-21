package handlers

import (
	"encoding/csv"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/database"
)

// ReconciliationByIDRouter dispatches sub-resource requests under /api/reconciliations/{id}/.
func ReconciliationByIDRouter(w http.ResponseWriter, r *http.Request) error {
	path := r.URL.Path
	switch {
	case strings.HasSuffix(path, "/export/csv"):
		return ExportReconciliationByIDCSV(w, r)
	case strings.HasSuffix(path, "/export/excel"):
		return ExportReconciliationByIDExcel(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "Rota não encontrada"}
	}
}

// ExportReconciliationByIDCSV handles GET /api/reconciliations/{id}/export/csv.
// It streams a CSV file containing per-tag reconciliation data for the given record.
func ExportReconciliationByIDCSV(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodGet {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	_, authOK := authenticatedUserID(r)
	if !authOK {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, tenantOK := middleware.TenantIDFromContext(r.Context())
	if !tenantOK {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	reconID, err := reconciliationIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID de reconciliação inválido"}
	}

	var rec models.Reconciliation
	if err := database.CoreDB.
		Where("id = ? AND tenant_id = ?", reconID, tenantID).
		First(&rec).Error; err != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "Reconciliação não encontrada"}
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"reconciliation_%d.csv\"", reconID))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	_ = writer.Write([]string{
		"tag_name",
		"measured_value",
		"reconciled_value",
		"adjustment",
		"adjustment_pct",
		"chi_contribution",
		"tolerance",
	})

	n := len(rec.ReconciledValues)
	for i := 0; i < n; i++ {
		tagName := fmt.Sprintf("tag_%d", i)
		if i < len(rec.OutlierTag) {
			// OutlierTag is a single string — use TagNames embedded in Corrections index.
		}
		// Use index-based names; actual tag names are not stored per-row in the model.
		measured := 0.0
		if i < len(rec.Measurements) {
			measured = rec.Measurements[i]
		}
		reconciled := rec.ReconciledValues[i]
		adjustment := reconciled - measured
		adjPct := 0.0
		if measured != 0 {
			adjPct = (adjustment / measured) * 100
		}
		tolerance := 0.0
		if i < len(rec.Tolerances) {
			tolerance = rec.Tolerances[i]
		}
		sigma := math.Abs(measured) * tolerance
		chiContrib := 0.0
		if sigma > 0 {
			chiContrib = math.Pow(adjustment/sigma, 2)
		}

		_ = writer.Write([]string{
			tagName,
			strconv.FormatFloat(measured, 'f', 6, 64),
			strconv.FormatFloat(reconciled, 'f', 6, 64),
			strconv.FormatFloat(adjustment, 'f', 6, 64),
			strconv.FormatFloat(adjPct, 'f', 4, 64),
			strconv.FormatFloat(chiContrib, 'f', 6, 64),
			strconv.FormatFloat(tolerance, 'f', 6, 64),
		})
	}

	return nil
}

// reconciliationIDFromPath extracts the numeric ID from paths like
// /api/reconciliations/{id}/export/csv or /api/reconciliations/{id}/export/excel.
func reconciliationIDFromPath(path string) (uint, error) {
	after := strings.TrimPrefix(path, "/api/reconciliations/")
	seg := strings.SplitN(after, "/", 2)[0]
	seg = strings.Trim(seg, "/")
	parsed, err := strconv.ParseUint(seg, 10, 64)
	if err != nil || parsed == 0 {
		return 0, fmt.Errorf("invalid id: %s", seg)
	}
	return uint(parsed), nil
}
