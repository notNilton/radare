package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/backend/internal/database"
	"radare-datarecon/backend/internal/middleware"
	"radare-datarecon/backend/internal/models"
)

// GetTags retorna todas as tags cadastradas.
func GetTags(w http.ResponseWriter, r *http.Request) error {
	var tags []models.Tag
	if result := database.DB.Find(&tags); result.Error != nil {
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

	if result := database.DB.Create(&tag); result.Error != nil {
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

	if result := database.DB.Delete(&models.Tag{}, id); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao deletar tag"}
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}
