package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type HierarchyRepository struct {
	db *gorm.DB
}

func NewHierarchyRepository(db *gorm.DB) *HierarchyRepository {
	return &HierarchyRepository{db: db}
}

func (r *HierarchyRepository) ListSites(tenantID uint) ([]models.Site, error) {
	var sites []models.Site
	err := r.db.Where("tenant_id = ?", tenantID).Order("name asc").Find(&sites).Error
	return sites, err
}

func (r *HierarchyRepository) CreateSite(site *models.Site) error {
	return r.db.Create(site).Error
}

func (r *HierarchyRepository) ListUnits(tenantID uint, siteID uint) ([]models.Unit, error) {
	var units []models.Unit
	query := r.db.Where("tenant_id = ?", tenantID)
	if siteID > 0 {
		query = query.Where("site_id = ?", siteID)
	}
	err := query.Order("name asc").Find(&units).Error
	return units, err
}

func (r *HierarchyRepository) CreateUnit(unit *models.Unit) error {
	return r.db.Create(unit).Error
}

func (r *HierarchyRepository) SiteExists(tenantID uint, siteID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Site{}).Where("tenant_id = ? AND id = ?", tenantID, siteID).Count(&count).Error
	return count > 0, err
}

func (r *HierarchyRepository) ListEquipment(tenantID uint, unitID uint) ([]models.Equipment, error) {
	var equipment []models.Equipment
	query := r.db.Where("tenant_id = ?", tenantID)
	if unitID > 0 {
		query = query.Where("unit_id = ?", unitID)
	}
	err := query.Order("name asc").Find(&equipment).Error
	return equipment, err
}

func (r *HierarchyRepository) CreateEquipment(equipment *models.Equipment) error {
	return r.db.Create(equipment).Error
}

func (r *HierarchyRepository) UnitExists(tenantID uint, unitID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Unit{}).Where("tenant_id = ? AND id = ?", tenantID, unitID).Count(&count).Error
	return count > 0, err
}
