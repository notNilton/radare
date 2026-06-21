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
	"time"
)

func ListAuditLogs(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	q := r.URL.Query()

	// Advanced filtering parameters.
	filter := repositories.AuditLogFilter{}

	// user_id — admins may query other users; default to caller.
	if rawUID := q.Get("user_id"); rawUID != "" {
		parsed, err := strconv.ParseUint(rawUID, 10, 64)
		if err != nil {
			return middleware.HTTPError{Code: http.StatusBadRequest, Message: "user_id inválido"}
		}
		uid := uint(parsed)
		filter.UserID = &uid
	} else {
		filter.UserID = &ownerID
	}

	filter.Action = q.Get("action")
	filter.ResourceType = q.Get("resource_type")

	if rawFrom := q.Get("from"); rawFrom != "" {
		t, err := parseAuditDate(rawFrom)
		if err != nil {
			return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Parâmetro 'from' inválido"}
		}
		filter.From = &t
	}
	if rawTo := q.Get("to"); rawTo != "" {
		t, err := parseAuditDate(rawTo)
		if err != nil {
			return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Parâmetro 'to' inválido"}
		}
		filter.To = &t
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(q.Get("page_size"))
	if pageSize <= 0 {
		pageSize = 50
	}
	filter.Page = page
	filter.PageSize = pageSize

	auditLogRepository := repositories.NewAuditLogRepository(database.LogDB)

	// Fall back to the simple legacy path when no advanced params are supplied.
	if filter.Action == "" && filter.ResourceType == "" && filter.From == nil && filter.To == nil {
		limit := pageSize
		if rawLimit := q.Get("limit"); rawLimit != "" {
			parsed, err := strconv.Atoi(rawLimit)
			if err != nil || parsed <= 0 {
				return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Limite inválido"}
			}
			limit = parsed
		}
		auditLogs, err := auditLogRepository.ListByUser(*filter.UserID, limit)
		if err != nil {
			return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar logs de auditoria"}
		}
		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(auditLogs)
	}

	auditLogs, total, err := auditLogRepository.ListFiltered(filter)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar logs de auditoria"}
	}

	response := map[string]interface{}{
		"data":      auditLogs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(response)
}

// parseAuditDate parses ISO date strings (RFC3339 or "2006-01-02").
func parseAuditDate(value string) (time.Time, error) {
	layouts := []string{time.RFC3339, "2006-01-02"}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, nil
		}
	}
	return time.Time{}, &time.ParseError{}
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
