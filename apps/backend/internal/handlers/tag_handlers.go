package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
)

// GetTags retorna todas as tags cadastradas.
func GetTags(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	tagRepository := repositories.NewTagRepository(database.CoreDB)

	tags, err := tagRepository.ListByTenant(tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar tags"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(tags)
}

// CreateTag cria uma nova tag.
func CreateTag(w http.ResponseWriter, r *http.Request) error {
	userID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	var tag models.Tag
	if err := json.NewDecoder(r.Body).Decode(&tag); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}
	tag.TenantID = tenantID

	tagRepository := repositories.NewTagRepository(database.CoreDB)
	if err := tagRepository.Create(&tag); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar tag"}
	}

	recordAuditLog(userID, "create", "tag", strconv.FormatUint(uint64(tag.ID), 10), map[string]interface{}{
		"name": tag.Name,
		"unit": tag.Unit,
	})

	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(tag)
}

// DeleteTag remove uma tag pelo ID.
func DeleteTag(w http.ResponseWriter, r *http.Request) error {
	userID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID da tag é obrigatório"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	tagRepository := repositories.NewTagRepository(database.CoreDB)
	if err := tagRepository.DeleteByIDAndTenant(id, tenantID); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao deletar tag"}
	}

	recordAuditLog(userID, "delete", "tag", id, nil)

	w.WriteHeader(http.StatusNoContent)
	return nil
}
