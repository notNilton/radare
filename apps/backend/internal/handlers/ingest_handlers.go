package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/cache"
	"radare-datarecon/apps/backend/internal/hub"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"time"
)

// IngestValueRequest is the body for a manual tag value push.
type IngestValueRequest struct {
	TagID          uint    `json:"tag_id"`
	Value          float64 `json:"value"`
	IdempotencyKey string  `json:"idempotency_key"`
}

// IngestTagValue handles POST /api/ingest/values.
// Writes the provided value to the Redis cache for the given tag.
// Requires at least operador role.
func IngestTagValue(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodPost {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	var req IngestValueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	if req.TagID == 0 {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "tag_id é obrigatório"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}
	if req.IdempotencyKey == "" {
		req.IdempotencyKey = r.Header.Get("Idempotency-Key")
	}
	if req.IdempotencyKey == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Idempotency-Key é obrigatório"}
	}

	if err := recordIdempotencyKey(tenantID, "ingest.values", req.IdempotencyKey); err != nil {
		return middleware.HTTPError{Code: http.StatusConflict, Message: "Chave de idempotência já utilizada"}
	}

	if err := cache.SetTagValue(r.Context(), req.TagID, req.Value); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao salvar valor no cache"}
	}

	// Record heartbeat for the manual connector.
	cache.TouchConnector(r.Context(), "manual")
	hub.Default.Broadcast(hub.TypeIngestValue, map[string]interface{}{
		"tag_id": req.TagID,
		"value":  req.Value,
	})

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// ConnectorStatus represents the health of a single connector.
type ConnectorStatus struct {
	Name     string     `json:"name"`
	Status   string     `json:"status"`
	LastSeen *time.Time `json:"last_seen,omitempty"`
}

// GetConnectivityStatus handles GET /api/connectivity/status.
// Returns the health of Redis and each configured connector.
func GetConnectivityStatus(w http.ResponseWriter, r *http.Request) error {
	connectors := []string{"mqtt", "influxdb", "manual"}
	statuses := make([]ConnectorStatus, 0, len(connectors)+1)

	// Redis itself.
	redisStatus := "offline"
	if cache.IsAvailable() {
		redisStatus = "online"
	}
	statuses = append(statuses, ConnectorStatus{Name: "redis", Status: redisStatus})

	// Per-connector heartbeats stored in Redis.
	for _, name := range connectors {
		s := ConnectorStatus{Name: name, Status: "offline"}
		if t, ok := cache.ConnectorLastSeen(r.Context(), name); ok {
			s.Status = "online"
			s.LastSeen = &t
		}
		statuses = append(statuses, s)
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(map[string]interface{}{
		"connectors": statuses,
	})
}

// ListExternalTagMappings handles GET /api/ingest/mappings.
func ListExternalTagMappings(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodGet {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repo := repositories.NewExternalTagMappingRepository(database.CoreDB)
	mappings, err := repo.ListByTenant(tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar mapeamentos"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(mappings)
}

type createMappingRequest struct {
	TagID         uint                 `json:"tag_id"`
	ConnectorType models.ConnectorType `json:"connector_type"`
	ExternalName  string               `json:"external_name"`
	Topic         string               `json:"topic"`
}

// CreateExternalTagMapping handles POST /api/ingest/mappings.
func CreateExternalTagMapping(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodPost {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	var req createMappingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Corpo da requisição inválido"}
	}
	if req.TagID == 0 || req.ExternalName == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "tag_id e external_name são obrigatórios"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	switch req.ConnectorType {
	case models.ConnectorMQTT, models.ConnectorInfluxDB, models.ConnectorManual:
	default:
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "connector_type inválido"}
	}

	mapping := &models.ExternalTagMapping{
		TenantID:      tenantID,
		TagID:         req.TagID,
		ConnectorType: req.ConnectorType,
		ExternalName:  req.ExternalName,
		Topic:         req.Topic,
	}

	repo := repositories.NewExternalTagMappingRepository(database.CoreDB)
	if err := repo.Create(mapping); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar mapeamento"}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(mapping)
}

func recordIdempotencyKey(tenantID uint, scope string, key string) error {
	return database.CoreDB.Exec(
		`INSERT INTO idempotency_keys (tenant_id, scope, key) VALUES (?, ?, ?)`,
		tenantID,
		scope,
		key,
	).Error
}
