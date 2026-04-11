package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

type workspaceRequest struct {
	ID          uint                   `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Data        map[string]interface{} `json:"data"`
}

func authenticatedUserID(r *http.Request) (uint, bool) {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return 0, false
	}

	return uint(userID), true
}

// Workspaces handles the collection endpoint for saved graph layouts.
func Workspaces(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		return ListWorkspaces(w, r)
	case http.MethodPost:
		return SaveWorkspace(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
}

// WorkspaceByID handles item-level workspace endpoints.
func WorkspaceByID(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		return GetWorkspace(w, r)
	case http.MethodDelete:
		return DeleteWorkspace(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
}

func ListWorkspaces(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	repository := repositories.NewWorkspaceRepository(database.DB)
	workspaces, err := repository.ListByOwner(ownerID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar workspaces"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(workspaces)
}

func SaveWorkspace(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	var req workspaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Nome do workspace é obrigatório"}
	}
	if req.Data == nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Dados do workspace são obrigatórios"}
	}

	repository := repositories.NewWorkspaceRepository(database.DB)
	workspace := models.Workspace{
		Name:        req.Name,
		Description: strings.TrimSpace(req.Description),
		OwnerID:     ownerID,
		Data:        req.Data,
	}
	workspace.ID = req.ID

	if req.ID > 0 {
		if err := repository.UpdateByOwner(&workspace); err != nil {
			return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao atualizar workspace"}
		}

		updated, err := repository.GetByOwner(req.ID, ownerID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return middleware.HTTPError{Code: http.StatusNotFound, Message: "Workspace não encontrado"}
			}
			return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar workspace atualizado"}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(updated)
	}

	if err := repository.Create(&workspace); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar workspace"}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(workspace)
}

func GetWorkspace(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	id, err := workspaceIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do workspace inválido"}
	}

	repository := repositories.NewWorkspaceRepository(database.DB)
	workspace, err := repository.GetByOwner(id, ownerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return middleware.HTTPError{Code: http.StatusNotFound, Message: "Workspace não encontrado"}
		}
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar workspace"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(workspace)
}

func DeleteWorkspace(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}

	id, err := workspaceIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do workspace inválido"}
	}

	repository := repositories.NewWorkspaceRepository(database.DB)
	if err := repository.DeleteByOwner(id, ownerID); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao deletar workspace"}
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func workspaceIDFromPath(path string) (uint, error) {
	rawID := strings.TrimPrefix(path, "/api/workspaces/")
	rawID = strings.Trim(rawID, "/")
	parsed, err := strconv.ParseUint(rawID, 10, 64)
	if err != nil {
		return 0, err
	}
	if parsed == 0 {
		return 0, strconv.ErrSyntax
	}

	return uint(parsed), nil
}
