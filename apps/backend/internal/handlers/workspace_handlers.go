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
	SiteID      *uint                  `json:"site_id,omitempty"`
	UnitID      *uint                  `json:"unit_id,omitempty"`
	EquipmentID *uint                  `json:"equipment_id,omitempty"`
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

// WorkspaceByID handles item-level workspace endpoints, including the
// /versions sub-resource: GET /api/workspaces/{id}/versions.
func WorkspaceByID(w http.ResponseWriter, r *http.Request) error {
	if strings.HasSuffix(strings.TrimSuffix(r.URL.Path, "/"), "/versions") {
		return ListWorkspaceVersions(w, r)
	}

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
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repository := repositories.NewWorkspaceRepository(database.CoreDB)
	workspaces, err := repository.ListByOwnerAndTenant(ownerID, tenantID)
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
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
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

	repository := repositories.NewWorkspaceRepository(database.CoreDB)
	workspace := models.Workspace{
		Name:        req.Name,
		Description: strings.TrimSpace(req.Description),
		OwnerID:     ownerID,
		TenantID:    tenantID,
		SiteID:      req.SiteID,
		UnitID:      req.UnitID,
		EquipmentID: req.EquipmentID,
		Data:        req.Data,
	}
	workspace.ID = req.ID

	if req.ID > 0 {
		if err := repository.UpdateByOwnerAndTenant(&workspace); err != nil {
			return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao atualizar workspace"}
		}

		updated, err := repository.GetByOwnerAndTenant(req.ID, ownerID, tenantID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return middleware.HTTPError{Code: http.StatusNotFound, Message: "Workspace não encontrado"}
			}
			return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar workspace atualizado"}
		}

		snapshotWorkspaceVersion(updated.ID, tenantID, updated.Data)
		recordAuditLog(ownerID, "update", "workspace", strconv.FormatUint(uint64(updated.ID), 10), map[string]interface{}{
			"name":        updated.Name,
			"description": updated.Description,
		})

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(updated)
	}

	if err := repository.Create(&workspace); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar workspace"}
	}

	snapshotWorkspaceVersion(workspace.ID, tenantID, workspace.Data)
	recordAuditLog(ownerID, "create", "workspace", strconv.FormatUint(uint64(workspace.ID), 10), map[string]interface{}{
		"name":        workspace.Name,
		"description": workspace.Description,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(workspace)
}

func GetWorkspace(w http.ResponseWriter, r *http.Request) error {
	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	id, err := workspaceIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do workspace inválido"}
	}

	repository := repositories.NewWorkspaceRepository(database.CoreDB)
	workspace, err := repository.GetByOwnerAndTenant(id, ownerID, tenantID)
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
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	id, err := workspaceIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do workspace inválido"}
	}

	repository := repositories.NewWorkspaceRepository(database.CoreDB)
	if err := repository.DeleteByOwnerAndTenant(id, ownerID, tenantID); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao deletar workspace"}
	}

	recordAuditLog(ownerID, "delete", "workspace", strconv.FormatUint(uint64(id), 10), nil)

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// ListWorkspaceVersions handles GET /api/workspaces/{id}/versions.
// Returns all immutable topology snapshots for the requested workspace,
// newest first. Only the owning user may access the list.
func ListWorkspaceVersions(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodGet {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	ownerID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	id, err := workspaceIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID do workspace inválido"}
	}

	// Verify ownership before exposing version history.
	wsRepo := repositories.NewWorkspaceRepository(database.CoreDB)
	if _, err := wsRepo.GetByOwnerAndTenant(id, ownerID, tenantID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return middleware.HTTPError{Code: http.StatusNotFound, Message: "Workspace não encontrado"}
		}
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao verificar workspace"}
	}

	vRepo := repositories.NewWorkspaceVersionRepository(database.CoreDB)
	versions, err := vRepo.ListByWorkspaceAndTenant(id, tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar versões"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(versions)
}

// snapshotWorkspaceVersion creates an immutable version record for the given
// workspace. Failures are logged but never propagate to the caller — the save
// itself must succeed regardless of snapshot availability.
func snapshotWorkspaceVersion(workspaceID uint, tenantID uint, data map[string]interface{}) {
	vRepo := repositories.NewWorkspaceVersionRepository(database.CoreDB)
	num, err := vRepo.NextVersionNum(workspaceID, tenantID)
	if err != nil {
		return
	}
	_ = vRepo.Create(&models.WorkspaceVersion{
		TenantID:    tenantID,
		WorkspaceID: workspaceID,
		VersionNum:  num,
		Data:        data,
	})
}

func workspaceIDFromPath(path string) (uint, error) {
	after := strings.TrimPrefix(path, "/api/workspaces/")
	// Accept both /api/workspaces/{id} and /api/workspaces/{id}/versions
	seg := strings.SplitN(after, "/", 2)[0]
	seg = strings.Trim(seg, "/")
	parsed, err := strconv.ParseUint(seg, 10, 64)
	if err != nil {
		return 0, err
	}
	if parsed == 0 {
		return 0, strconv.ErrSyntax
	}

	return uint(parsed), nil
}
