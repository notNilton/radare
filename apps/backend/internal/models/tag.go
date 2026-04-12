package models

import "gorm.io/gorm"

// Tag representa uma variável de processo ou ponto de medição.
type Tag struct {
	gorm.Model
	TenantID    uint   `gorm:"index" json:"tenant_id"`
	Name        string `gorm:"uniqueIndex;not null" json:"name"`
	Description string `json:"description"`
	Unit        string `json:"unit"`
}

