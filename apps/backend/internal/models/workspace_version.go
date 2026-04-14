package models

import "time"

// WorkspaceVersion is an immutable snapshot of a workspace topology.
// A new version is created on every save, preserving the full history
// of graph changes for traceability in reconciliation results.
type WorkspaceVersion struct {
	ID          uint                   `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time              `json:"created_at"`
	TenantID    uint                   `gorm:"not null;index" json:"tenant_id"`
	WorkspaceID uint                   `gorm:"not null;index" json:"workspace_id"`
	Workspace   Workspace              `gorm:"foreignKey:WorkspaceID" json:"-"`
	VersionNum  int                    `gorm:"not null" json:"version_num"`
	Data        map[string]interface{} `gorm:"serializer:json;type:jsonb;not null" json:"data"`
}
