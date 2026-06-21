package repositories

import (
	"time"

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

// AuditLogFilter holds optional filter parameters for advanced audit log queries.
type AuditLogFilter struct {
	UserID       *uint
	Action       string
	ResourceType string
	From         *time.Time
	To           *time.Time
	Page         int
	PageSize     int
}

// ListFiltered returns audit logs matching the given filter with pagination.
// Returns (logs, total, error).
func (r *AuditLogRepository) ListFiltered(filter AuditLogFilter) ([]models.AuditLog, int64, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}
	if pageSize > 200 {
		pageSize = 200
	}

	query := r.db.Model(&models.AuditLog{})

	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.Action != "" {
		query = query.Where("action ILIKE ?", "%"+filter.Action+"%")
	}
	if filter.ResourceType != "" {
		query = query.Where("resource_type = ?", filter.ResourceType)
	}
	if filter.From != nil {
		query = query.Where("created_at >= ?", *filter.From)
	}
	if filter.To != nil {
		query = query.Where("created_at <= ?", *filter.To)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var auditLogs []models.AuditLog
	if err := query.
		Order("created_at desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&auditLogs).Error; err != nil {
		return nil, 0, err
	}

	return auditLogs, total, nil
}
