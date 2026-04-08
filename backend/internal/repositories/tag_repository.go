package repositories

import (
	"radare-datarecon/backend/internal/models"

	"gorm.io/gorm"
)

type TagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) List() ([]models.Tag, error) {
	var tags []models.Tag
	if err := r.db.Order("id asc").Find(&tags).Error; err != nil {
		return nil, err
	}

	return tags, nil
}

func (r *TagRepository) Create(tag *models.Tag) error {
	return r.db.Create(tag).Error
}

func (r *TagRepository) DeleteByID(id string) error {
	return r.db.Delete(&models.Tag{}, id).Error
}
