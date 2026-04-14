package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type WorkspaceRepository struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) *WorkspaceRepository {
	return &WorkspaceRepository{db: db}
}

func (r *WorkspaceRepository) ListByOwnerAndTenant(ownerID uint, tenantID uint) ([]models.Workspace, error) {
	var workspaces []models.Workspace
	if err := r.db.Where("owner_id = ? AND tenant_id = ?", ownerID, tenantID).Order("updated_at desc").Find(&workspaces).Error; err != nil {
		return nil, err
	}

	return workspaces, nil
}

func (r *WorkspaceRepository) GetByOwnerAndTenant(id uint, ownerID uint, tenantID uint) (*models.Workspace, error) {
	var workspace models.Workspace
	if err := r.db.Where("id = ? AND owner_id = ? AND tenant_id = ?", id, ownerID, tenantID).First(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace, nil
}

func (r *WorkspaceRepository) Create(workspace *models.Workspace) error {
	return r.db.Create(workspace).Error
}

func (r *WorkspaceRepository) UpdateByOwnerAndTenant(workspace *models.Workspace) error {
	return r.db.Model(&models.Workspace{}).
		Where("id = ? AND owner_id = ? AND tenant_id = ?", workspace.ID, workspace.OwnerID, workspace.TenantID).
		Updates(map[string]interface{}{
			"name":         workspace.Name,
			"description":  workspace.Description,
			"data":         workspace.Data,
			"site_id":      workspace.SiteID,
			"unit_id":      workspace.UnitID,
			"equipment_id": workspace.EquipmentID,
		}).Error
}

func (r *WorkspaceRepository) DeleteByOwnerAndTenant(id uint, ownerID uint, tenantID uint) error {
	return r.db.Where("id = ? AND owner_id = ? AND tenant_id = ?", id, ownerID, tenantID).Delete(&models.Workspace{}).Error
}
