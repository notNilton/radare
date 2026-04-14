package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/database"
)

// DashboardStats representa as estatísticas resumidas para o dashboard.
type DashboardStats struct {
	TotalReconciliations int64   `json:"total_reconciliations"`
	ConsistentPercentage float64 `json:"consistent_percentage"`
	TotalTags            int64   `json:"total_tags"`
}

// GetDashboardStats retorna as estatísticas para o usuário autenticado.
func GetDashboardStats(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	var stats DashboardStats

	// Conta total de reconciliações
	database.CoreDB.Model(&models.Reconciliation{}).Where("user_id = ? AND tenant_id = ?", uint(userID), tenantID).Count(&stats.TotalReconciliations)

	// Conta consistentes
	var consistentCount int64
	database.CoreDB.Model(&models.Reconciliation{}).Where("user_id = ? AND tenant_id = ? AND consistency_status = ?", uint(userID), tenantID, "Consistente").Count(&consistentCount)

	if stats.TotalReconciliations > 0 {
		stats.ConsistentPercentage = (float64(consistentCount) / float64(stats.TotalReconciliations)) * 100
	}

	// Conta tags
	database.CoreDB.Model(&models.Tag{}).Where("tenant_id = ?", tenantID).Count(&stats.TotalTags)

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(stats)
}
