package models

import "gorm.io/gorm"

// Workspace stores a saved React Flow process topology for a user.
type Workspace struct {
	gorm.Model
	TenantID    uint                   `gorm:"not null;index" json:"tenant_id"`
	SiteID      *uint                  `gorm:"index" json:"site_id,omitempty"`
	UnitID      *uint                  `gorm:"index" json:"unit_id,omitempty"`
	EquipmentID *uint                  `gorm:"index" json:"equipment_id,omitempty"`
	Name        string                 `gorm:"not null" json:"name"`
	Description string                 `json:"description"`
	OwnerID     uint                   `gorm:"not null" json:"owner_id"`
	Owner       User                   `gorm:"foreignKey:OwnerID" json:"-"`
	Data        map[string]interface{} `gorm:"serializer:json;type:jsonb;not null" json:"data"`
}
