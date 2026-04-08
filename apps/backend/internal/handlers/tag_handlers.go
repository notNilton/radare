package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
)

// GetTags retorna todas as tags cadastradas.
func GetTags(w http.ResponseWriter, r *http.Request) error {
	tagRepository := repositories.NewTagRepository(database.DB)

	tags, err := tagRepository.List()
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar tags"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(tags)
}

// CreateTag cria uma nova tag.
func CreateTag(w http.ResponseWriter, r *http.Request) error {
	var tag models.Tag
	if err := json.NewDecoder(r.Body).Decode(&tag); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}

	tagRepository := repositories.NewTagRepository(database.DB)
	if err := tagRepository.Create(&tag); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar tag"}
	}

	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(tag)
}

// DeleteTag remove uma tag pelo ID.
func DeleteTag(w http.ResponseWriter, r *http.Request) error {
	id := r.URL.Query().Get("id")
	if id == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID da tag é obrigatório"}
	}

	tagRepository := repositories.NewTagRepository(database.DB)
	if err := tagRepository.DeleteByID(id); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao deletar tag"}
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}
