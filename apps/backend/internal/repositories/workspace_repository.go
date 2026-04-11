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

func (r *WorkspaceRepository) ListByOwner(ownerID uint) ([]models.Workspace, error) {
	var workspaces []models.Workspace
	if err := r.db.Where("owner_id = ?", ownerID).Order("updated_at desc").Find(&workspaces).Error; err != nil {
		return nil, err
	}

	return workspaces, nil
}

func (r *WorkspaceRepository) GetByOwner(id uint, ownerID uint) (*models.Workspace, error) {
	var workspace models.Workspace
	if err := r.db.Where("id = ? AND owner_id = ?", id, ownerID).First(&workspace).Error; err != nil {
		return nil, err
	}

	return &workspace, nil
}

func (r *WorkspaceRepository) Create(workspace *models.Workspace) error {
	return r.db.Create(workspace).Error
}

func (r *WorkspaceRepository) UpdateByOwner(workspace *models.Workspace) error {
	return r.db.Model(&models.Workspace{}).
		Where("id = ? AND owner_id = ?", workspace.ID, workspace.OwnerID).
		Updates(map[string]interface{}{
			"name":        workspace.Name,
			"description": workspace.Description,
			"data":        workspace.Data,
		}).Error
}

func (r *WorkspaceRepository) DeleteByOwner(id uint, ownerID uint) error {
	return r.db.Where("id = ? AND owner_id = ?", id, ownerID).Delete(&models.Workspace{}).Error
}
