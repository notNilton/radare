package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/database"
	"strconv"
	"strings"
)

type userSummary struct {
	ID           uint         `json:"id"`
	Username     string       `json:"username"`
	Name         string       `json:"name"`
	ContactEmail string       `json:"contact_email"`
	Role         models.Role  `json:"role"`
}

// ListUsers returns all users in the system. Requires admin role.
func ListUsers(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodGet {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	var users []models.User
	if err := database.CoreDB.Omit("password").Order("id asc").Find(&users).Error; err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar usuários"}
	}

	summaries := make([]userSummary, len(users))
	for i, u := range users {
		summaries[i] = userSummary{
			ID:           u.ID,
			Username:     u.Username,
			Name:         u.Name,
			ContactEmail: u.ContactEmail,
			Role:         u.Role,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(summaries)
}

type updateRoleRequest struct {
	Role models.Role `json:"role"`
}

// UpdateUserRole changes the role of any user. Requires admin role.
func UpdateUserRole(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodPatch {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	rawID := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	rawID = strings.TrimSuffix(rawID, "/role")
	rawID = strings.Trim(rawID, "/")
	parsed, err := strconv.ParseUint(rawID, 10, 64)
	if err != nil || parsed == 0 {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do usuário inválido"}
	}
	targetID := uint(parsed)

	var req updateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}

	switch req.Role {
	case models.RoleAdmin, models.RoleOperador, models.RoleAuditor:
	default:
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Role inválida: use admin, operador ou auditor"}
	}

	if err := database.CoreDB.Model(&models.User{}).
		Where("id = ?", targetID).
		Update("role", req.Role).Error; err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao atualizar role"}
	}

	callerID, _ := authenticatedUserID(r)
	recordAuditLog(callerID, "update_role", "user", strconv.FormatUint(uint64(targetID), 10), map[string]interface{}{
		"new_role": string(req.Role),
	})

	w.WriteHeader(http.StatusNoContent)
	return nil
}
