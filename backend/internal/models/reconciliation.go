package models

import (
	"gorm.io/gorm"
)

// Reconciliation representa o registro de uma operação de reconciliação realizada por um usuário.
type Reconciliation struct {
	gorm.Model
	UserID            uint        `gorm:"not null" json:"user_id"`
	User              User        `gorm:"foreignKey:UserID"`
	Measurements      []float64   `gorm:"serializer:json" json:"measurements"`
	Tolerances        []float64   `gorm:"serializer:json" json:"tolerances"`
	Constraints       [][]float64 `gorm:"serializer:json" json:"constraints"`
	ReconciledValues  []float64   `gorm:"serializer:json" json:"reconciled_values"`
	Corrections       []float64   `gorm:"serializer:json" json:"corrections"`
	ConsistencyStatus string      `json:"consistency_status"`
}
