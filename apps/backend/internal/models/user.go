// Package models define as estruturas de dados (modelos) da aplicação.
package models

import "gorm.io/gorm"

// Address representa o endereço de um usuário.
// Esta estrutura é incorporada na estrutura do usuário.
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	ZipCode string `json:"zip_code"`
	Country string `json:"country"`
}

// Role defines the access level for a user in the system.
// - admin:    full management (users, tags, workspaces, reconciliation)
// - operador: execution and editing (tags, workspaces, reconciliation)
// - auditor:  read-only access (history and audit logs)
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperador Role = "operador"
	RoleAuditor  Role = "auditor"
)

// Theme defines the UI theme preference for a user.
type Theme string

const (
	ThemeDark       Theme = "dark"
	ThemeLight      Theme = "light"
	ThemeIndustrial Theme = "industrial"
)

// User representa um usuário no sistema.
// Contém informações de autenticação e detalhes do perfil.
type User struct {
	gorm.Model
	TenantID     *uint   `gorm:"index" json:"tenant_id,omitempty"`
	Username     string  `gorm:"uniqueIndex;not null" validate:"required,min=3,max=32"`
	Password     string  `gorm:"not null" json:"-" validate:"required,min=6"`
	Name         string  `json:"name" validate:"required"`
	ContactEmail string  `gorm:"not null;default:'no-email-provided'" json:"contact_email" validate:"required,email"`
	Address      Address `gorm:"embedded"`
	ProfileIcon  string  `json:"profile_icon"`
	Role         Role    `gorm:"not null;default:'operador'" json:"role"`
	Theme        Theme   `gorm:"not null;default:'dark'" json:"theme"`
}
