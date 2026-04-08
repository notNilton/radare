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

	var stats DashboardStats

	// Conta total de reconciliações
	database.DB.Model(&models.Reconciliation{}).Where("user_id = ?", uint(userID)).Count(&stats.TotalReconciliations)

	// Conta consistentes
	var consistentCount int64
	database.DB.Model(&models.Reconciliation{}).Where("user_id = ? AND consistency_status = ?", uint(userID), "Consistente").Count(&consistentCount)

	if stats.TotalReconciliations > 0 {
		stats.ConsistentPercentage = (float64(consistentCount) / float64(stats.TotalReconciliations)) * 100
	}

	// Conta tags
	database.DB.Model(&models.Tag{}).Count(&stats.TotalTags)

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(stats)
}
