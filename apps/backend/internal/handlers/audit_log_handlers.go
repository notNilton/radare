package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
)

func ListAuditLogs(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	limit := 100
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed <= 0 {
			return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Limite inválido"}
		}
		limit = parsed
	}

	auditLogRepository := repositories.NewAuditLogRepository(database.LogDB)
	auditLogs, err := auditLogRepository.ListByUser(ownerID, limit)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar logs de auditoria"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(auditLogs)
}

func recordAuditLog(userID uint, action string, resourceType string, resourceID string, details map[string]interface{}) {
	if details == nil {
		details = map[string]interface{}{}
	}

	auditLogRepository := repositories.NewAuditLogRepository(database.LogDB)
	if err := auditLogRepository.Create(&models.AuditLog{
		UserID:       userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
	}); err != nil {
		slog.Warn("Failed to record audit log",
			"action", action,
			"resource_type", resourceType,
			"resource_id", resourceID,
			"error", err,
		)
	}
}
