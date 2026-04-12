package repositories

import (
	"radare-datarecon/apps/backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type APIKeyRepository struct {
	db *gorm.DB
}

func NewAPIKeyRepository(db *gorm.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

func (r *APIKeyRepository) Create(key *models.APIKey) error {
	return r.db.Create(key).Error
}

func (r *APIKeyRepository) ListByUser(userID uint) ([]models.APIKey, error) {
	var keys []models.APIKey
	err := r.db.
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Order("created_at DESC").
		Find(&keys).Error
	return keys, err
}

// FindByPrefix looks up an active key by its plain-text prefix (first 12 chars).
func (r *APIKeyRepository) FindByPrefix(prefix string) (*models.APIKey, error) {
	var key models.APIKey
	err := r.db.
		Where("prefix = ? AND revoked_at IS NULL", prefix).
		First(&key).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

func (r *APIKeyRepository) Revoke(id uint, userID uint) error {
	now := time.Now().UTC()
	return r.db.
		Model(&models.APIKey{}).
		Where("id = ? AND user_id = ? AND revoked_at IS NULL", id, userID).
		Update("revoked_at", now).Error
}

// TouchLastUsed updates last_used_at to now.
func (r *APIKeyRepository) TouchLastUsed(id uint) {
	now := time.Now().UTC()
	r.db.Model(&models.APIKey{}).Where("id = ?", id).Update("last_used_at", now)
}
