package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type AuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) Create(auditLog *models.AuditLog) error {
	return r.db.Create(auditLog).Error
}

func (r *AuditLogRepository) ListByUser(userID uint, limit int) ([]models.AuditLog, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	var auditLogs []models.AuditLog
	if err := r.db.
		Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(limit).
		Find(&auditLogs).Error; err != nil {
		return nil, err
	}

	return auditLogs, nil
}
