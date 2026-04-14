package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

const apiKeyPrefix = "rdre_"
const apiKeyRawLength = 40 // hex chars after the prefix

// CreateAPIKey generates a new API key for the authenticated user.
// The full raw key is returned only once in the response — it is NOT stored
// in plain text and cannot be recovered after this request.
func CreateAPIKey(w http.ResponseWriter, r *http.Request) error {
	userID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Name) == "" {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Campo 'name' é obrigatório"}
	}

	// Generate cryptographically-random key: rdre_<40 hex chars>
	raw := make([]byte, apiKeyRawLength/2)
	if _, err := rand.Read(raw); err != nil {
		return fmt.Errorf("failed to generate key entropy: %w", err)
	}
	fullKey := apiKeyPrefix + hex.EncodeToString(raw)
	prefix := fullKey[:12] // "rdre_XXXXXXX" — 12 chars

	hash, err := bcrypt.GenerateFromPassword([]byte(fullKey), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash key: %w", err)
	}

	key := models.APIKey{
		TenantID: tenantID,
		UserID:   userID,
		Name:     strings.TrimSpace(req.Name),
		Prefix:   prefix,
		KeyHash:  string(hash),
	}

	repo := repositories.NewAPIKeyRepository(database.CoreDB)
	if err := repo.Create(&key); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao criar chave"}
	}

	recordAuditLog(userID, "create", "api_key", strconv.FormatUint(uint64(key.ID), 10), map[string]interface{}{
		"name":   key.Name,
		"prefix": key.Prefix,
	})

	// Return the full raw key only once.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	return json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         key.ID,
		"name":       key.Name,
		"prefix":     key.Prefix,
		"created_at": key.CreatedAt,
		"key":        fullKey, // shown only once
	})
}

// ListAPIKeys returns all active API keys for the authenticated user (no raw key).
func ListAPIKeys(w http.ResponseWriter, r *http.Request) error {
	userID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repo := repositories.NewAPIKeyRepository(database.CoreDB)
	keys, err := repo.ListByUserAndTenant(userID, tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar chaves"}
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(keys)
}

// RevokeAPIKey marks a key as revoked. Only the owning user can revoke their keys.
// The key ID is read from the URL suffix: DELETE /api/api-keys/{id}
func RevokeAPIKey(w http.ResponseWriter, r *http.Request) error {
	userID, ok := authenticatedUserID(r)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	if r.Method != http.MethodDelete {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Method not allowed"}
	}

	rawID := strings.TrimPrefix(r.URL.Path, "/api/api-keys/")
	keyID, err := strconv.ParseUint(rawID, 10, 64)
	if err != nil || keyID == 0 {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID inválido"}
	}

	repo := repositories.NewAPIKeyRepository(database.CoreDB)
	if err := repo.RevokeByTenant(uint(keyID), userID, tenantID); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao revogar chave"}
	}

	recordAuditLog(userID, "revoke", "api_key", strconv.FormatUint(uint64(keyID), 10), nil)

	w.WriteHeader(http.StatusNoContent)
	return nil
}
