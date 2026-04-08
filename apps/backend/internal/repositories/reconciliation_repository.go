package repositories

import (
	"time"

	"radare-datarecon/backend/internal/models"

	"gorm.io/gorm"
)

type ReconciliationHistoryFilter struct {
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	PageSize  int
}

type ReconciliationRepository struct {
	db *gorm.DB
}

func NewReconciliationRepository(db *gorm.DB) *ReconciliationRepository {
	return &ReconciliationRepository{db: db}
}

func (r *ReconciliationRepository) Create(reconciliation *models.Reconciliation) error {
	return r.db.Create(reconciliation).Error
}

func (r *ReconciliationRepository) ListByUser(userID uint, filter ReconciliationHistoryFilter) ([]models.Reconciliation, int64, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	query := r.db.Model(&models.Reconciliation{}).Where("user_id = ?", userID)

	if filter.Status != "" {
		query = query.Where("consistency_status = ?", filter.Status)
	}
	if filter.StartDate != nil {
		query = query.Where("created_at >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("created_at <= ?", *filter.EndDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var history []models.Reconciliation
	if err := query.Order("created_at desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&history).Error; err != nil {
		return nil, 0, err
	}

	return history, total, nil
}

func (r *ReconciliationRepository) ListAllByUser(userID uint) ([]models.Reconciliation, error) {
	var history []models.Reconciliation
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&history).Error; err != nil {
		return nil, err
	}

	return history, nil
}
