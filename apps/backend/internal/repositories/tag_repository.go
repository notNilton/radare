package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type TagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) ListByTenant(tenantID uint) ([]models.Tag, error) {
	var tags []models.Tag
	if err := r.db.Where("tenant_id = ?", tenantID).Order("id asc").Find(&tags).Error; err != nil {
		return nil, err
	}

	return tags, nil
}

func (r *TagRepository) Create(tag *models.Tag) error {
	return r.db.Create(tag).Error
}

func (r *TagRepository) DeleteByIDAndTenant(id string, tenantID uint) error {
	return r.db.Where("tenant_id = ?", tenantID).Delete(&models.Tag{}, id).Error
}
