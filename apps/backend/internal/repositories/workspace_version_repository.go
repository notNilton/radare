package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type WorkspaceVersionRepository struct {
	db *gorm.DB
}

func NewWorkspaceVersionRepository(db *gorm.DB) *WorkspaceVersionRepository {
	return &WorkspaceVersionRepository{db: db}
}

// Create persists a new version snapshot.
func (r *WorkspaceVersionRepository) Create(v *models.WorkspaceVersion) error {
	return r.db.Create(v).Error
}

// NextVersionNum returns the next sequential version number for the given workspace.
func (r *WorkspaceVersionRepository) NextVersionNum(workspaceID uint, tenantID uint) (int, error) {
	var max int
	err := r.db.Model(&models.WorkspaceVersion{}).
		Where("workspace_id = ? AND tenant_id = ?", workspaceID, tenantID).
		Select("COALESCE(MAX(version_num), 0)").
		Scan(&max).Error
	return max + 1, err
}

// LatestByWorkspace returns the most recent version for a workspace.
func (r *WorkspaceVersionRepository) LatestByWorkspaceAndTenant(workspaceID uint, tenantID uint) (*models.WorkspaceVersion, error) {
	var v models.WorkspaceVersion
	err := r.db.
		Where("workspace_id = ? AND tenant_id = ?", workspaceID, tenantID).
		Order("version_num DESC").
		First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// ListByWorkspace returns all versions for a workspace, newest first.
func (r *WorkspaceVersionRepository) ListByWorkspaceAndTenant(workspaceID uint, tenantID uint) ([]models.WorkspaceVersion, error) {
	var versions []models.WorkspaceVersion
	err := r.db.
		Where("workspace_id = ? AND tenant_id = ?", workspaceID, tenantID).
		Order("version_num DESC").
		Find(&versions).Error
	return versions, err
}
