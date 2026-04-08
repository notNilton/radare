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

// User representa um usuário no sistema.
// Contém informações de autenticação e detalhes do perfil.
type User struct {
	gorm.Model
	Username     string  `gorm:"uniqueIndex;not null" validate:"required,min=3,max=32"`
	Password     string  `gorm:"not null" validate:"required,min=6"`
	Name         string  `json:"name" validate:"required"`
	ContactEmail string  `gorm:"not null;default:'no-email-provided'" validate:"required,email"`
	Address      Address `gorm:"embedded"`
	ProfileIcon  string  `json:"profile_icon"`
}

