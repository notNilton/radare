package models

import "gorm.io/gorm"

// AuditLog stores governance events for sensitive configuration changes.
type AuditLog struct {
	gorm.Model
	TenantID     uint                   `gorm:"index" json:"tenant_id"`
	UserID       uint                   `gorm:"not null" json:"user_id"`
	User         User                   `gorm:"foreignKey:UserID" json:"-"`
	Action       string                 `gorm:"not null" json:"action"`
	ResourceType string                 `gorm:"not null" json:"resource_type"`
	ResourceID   string                 `gorm:"not null;default:''" json:"resource_id"`
	Details      map[string]interface{} `gorm:"serializer:json;type:jsonb;not null" json:"details"`
}
