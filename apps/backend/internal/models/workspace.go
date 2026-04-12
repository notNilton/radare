package models

import "gorm.io/gorm"

// Workspace stores a saved React Flow process topology for a user.
type Workspace struct {
	gorm.Model
	TenantID    uint                   `gorm:"index" json:"tenant_id"`
	Name        string                 `gorm:"not null" json:"name"`
	Description string                 `json:"description"`
	OwnerID     uint                   `gorm:"not null" json:"owner_id"`
	Owner       User                   `gorm:"foreignKey:OwnerID" json:"-"`
	Data        map[string]interface{} `gorm:"serializer:json;type:jsonb;not null" json:"data"`
}
