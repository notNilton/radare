package models

import "time"

// APIKey represents a long-lived secret used by external connectors to push
// data to the ingest endpoint without a JWT session.
//
// Raw key format: "rdre_" + 40 hex characters (total 45 chars).
// Only the first 12 characters (prefix) are stored in plain text for fast
// indexed lookups. The full key is stored as a bcrypt hash.
type APIKey struct {
	ID          uint       `gorm:"primarykey"           json:"id"`
	CreatedAt   time.Time  `                            json:"created_at"`
	RevokedAt   *time.Time `gorm:"index"                json:"revoked_at,omitempty"`
	LastUsedAt  *time.Time `                            json:"last_used_at,omitempty"`
	UserID      uint       `gorm:"not null;index"       json:"-"`
	Name        string     `gorm:"not null"             json:"name"`
	Prefix      string     `gorm:"uniqueIndex;not null" json:"prefix"`
	KeyHash     string     `gorm:"not null"             json:"-"`
}

// IsActive returns true when the key has not been revoked.
func (k *APIKey) IsActive() bool {
	return k.RevokedAt == nil
}
