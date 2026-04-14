package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
	"strings"
)

type siteRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type unitRequest struct {
	SiteID      uint   `json:"site_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type equipmentRequest struct {
	UnitID      uint   `json:"unit_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func SitesV2(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		return listSites(w, r)
	case http.MethodPost:
		return createSite(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
}

func UnitsV2(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		return listUnits(w, r)
	case http.MethodPost:
		return createUnit(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
}

func EquipmentV2(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		return listEquipment(w, r)
	case http.MethodPost:
		return createEquipment(w, r)
	default:
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
}

func listSites(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repo := repositories.NewHierarchyRepository(database.CoreDB)
	sites, err := repo.ListSites(tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar sites"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(sites)
}

func createSite(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	var req siteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Nome do site é obrigatório"}
	}

	site := models.Site{TenantID: tenantID, Name: req.Name, Description: strings.TrimSpace(req.Description)}
	repo := repositories.NewHierarchyRepository(database.CoreDB)
	if err := repo.CreateSite(&site); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar site"}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(site)
}

func listUnits(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}
	siteID, err := optionalUintQuery(r, "site_id")
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "site_id inválido"}
	}

	repo := repositories.NewHierarchyRepository(database.CoreDB)
	units, err := repo.ListUnits(tenantID, siteID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar units"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(units)
}

func createUnit(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	var req unitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.SiteID == 0 || req.Name == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "site_id e name são obrigatórios"}
	}

	repo := repositories.NewHierarchyRepository(database.CoreDB)
	exists, err := repo.SiteExists(tenantID, req.SiteID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao validar site"}
	}
	if !exists {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "Site não encontrado"}
	}

	unit := models.Unit{TenantID: tenantID, SiteID: req.SiteID, Name: req.Name, Description: strings.TrimSpace(req.Description)}
	if err := repo.CreateUnit(&unit); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar unit"}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(unit)
}

func listEquipment(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}
	unitID, err := optionalUintQuery(r, "unit_id")
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "unit_id inválido"}
	}

	repo := repositories.NewHierarchyRepository(database.CoreDB)
	equipment, err := repo.ListEquipment(tenantID, unitID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar equipment"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(equipment)
}

func createEquipment(w http.ResponseWriter, r *http.Request) error {
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	var req equipmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.UnitID == 0 || req.Name == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "unit_id e name são obrigatórios"}
	}

	repo := repositories.NewHierarchyRepository(database.CoreDB)
	exists, err := repo.UnitExists(tenantID, req.UnitID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao validar unit"}
	}
	if !exists {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "Unit não encontrada"}
	}

	equipment := models.Equipment{TenantID: tenantID, UnitID: req.UnitID, Name: req.Name, Description: strings.TrimSpace(req.Description)}
	if err := repo.CreateEquipment(&equipment); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar equipment"}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(equipment)
}

func optionalUintQuery(r *http.Request, key string) (uint, error) {
	raw := strings.TrimSpace(r.URL.Query().Get(key))
	if raw == "" {
		return 0, nil
	}
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(parsed), nil
}
