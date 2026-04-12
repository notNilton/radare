package models

import "gorm.io/gorm"

// Tenant represents a customer or organization in the system.
type Tenant struct {
	gorm.Model
	Name   string `gorm:"not null" json:"name"`
	Slug   string `gorm:"uniqueIndex;not null" json:"slug"`
	Status string `gorm:"not null;default:'active'" json:"status"`
}

// Site represents a physical location or plant within a tenant.
type Site struct {
	gorm.Model
	TenantID    uint   `gorm:"not null;index" json:"tenant_id"`
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
}

// Unit represents a process unit or area within a site.
type Unit struct {
	gorm.Model
	SiteID      uint   `gorm:"not null;index" json:"site_id"`
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
}

// Equipment represents a specific piece of machinery or instrument within a unit.
type Equipment struct {
	gorm.Model
	UnitID      uint   `gorm:"not null;index" json:"unit_id"`
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
}
