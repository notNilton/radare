package middleware

import (
	"context"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type apiKeyRow struct {
	ID       uint
	UserID   uint
	TenantID *uint
	KeyHash  string
}

// apiKeyPrefixFrom returns the first 12 chars of a raw API key.
// Used as the lookup key in the api_keys table index.
func apiKeyPrefixFrom(raw string) string {
	if len(raw) <= 12 {
		return raw
	}
	return raw[:12]
}

// NewAPIKeyMiddleware returns a middleware that authenticates requests using
// the X-Radare-Api-Key header. On success it injects userID, role="operador"
// and tenantID into the request context, identical to what JWTAuth provides.
//
// Intended for ingest endpoints that external connectors call without a session.
func NewAPIKeyMiddleware(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := r.Header.Get("X-Radare-Api-Key")
			if raw == "" {
				http.Error(w, "API key required (X-Radare-Api-Key header)", http.StatusUnauthorized)
				return
			}

			prefix := apiKeyPrefixFrom(raw)

			var row apiKeyRow
			err := db.Table("api_keys").
				Select("api_keys.id, api_keys.user_id, api_keys.key_hash, users.tenant_id").
				Joins("JOIN users ON users.id = api_keys.user_id").
				Where("api_keys.prefix = ? AND api_keys.revoked_at IS NULL", prefix).
				First(&row).Error
			if err != nil {
				http.Error(w, "Invalid API key", http.StatusUnauthorized)
				return
			}

			if err := bcrypt.CompareHashAndPassword([]byte(row.KeyHash), []byte(raw)); err != nil {
				http.Error(w, "Invalid API key", http.StatusUnauthorized)
				return
			}

			// Update last_used_at without blocking the request.
			go func() {
				now := time.Now().UTC()
				db.Table("api_keys").Where("id = ?", row.ID).Update("last_used_at", now)
			}()

			ctx := context.WithValue(r.Context(), "userID", float64(row.UserID))
			ctx = context.WithValue(ctx, "role", "operador")
			ctx = context.WithValue(ctx, "tenantID", row.TenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// JWTOrAPIKeyMiddleware tries JWT authentication first; if no Authorization
// header is present it falls back to API key authentication via X-Radare-Api-Key.
// This allows the ingest endpoint to be called from both browsers (JWT) and
// external connectors (API key).
func JWTOrAPIKeyMiddleware(jwtSecret string, db *gorm.DB) func(http.Handler) http.Handler {
	jwtAuth := NewAuthMiddleware(jwtSecret)
	apiKeyAuth := NewAPIKeyMiddleware(db)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("Authorization") != "" {
				jwtAuth(next).ServeHTTP(w, r)
			} else {
				apiKeyAuth(next).ServeHTTP(w, r)
			}
		})
	}
}
