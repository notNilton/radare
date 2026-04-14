package repositories

import (
	"radare-datarecon/apps/backend/internal/models"

	"gorm.io/gorm"
)

type ExternalTagMappingRepository struct {
	db *gorm.DB
}

func NewExternalTagMappingRepository(db *gorm.DB) *ExternalTagMappingRepository {
	return &ExternalTagMappingRepository{db: db}
}

func (r *ExternalTagMappingRepository) Create(m *models.ExternalTagMapping) error {
	return r.db.Create(m).Error
}

func (r *ExternalTagMappingRepository) ListByTenant(tenantID uint) ([]models.ExternalTagMapping, error) {
	var mappings []models.ExternalTagMapping
	err := r.db.Where("tenant_id = ?", tenantID).Order("connector_type, external_name").Find(&mappings).Error
	return mappings, err
}

func (r *ExternalTagMappingRepository) ListByConnector(connector models.ConnectorType) ([]models.ExternalTagMapping, error) {
	var mappings []models.ExternalTagMapping
	err := r.db.
		Where("connector_type = ?", connector).
		Order("external_name").
		Find(&mappings).Error
	return mappings, err
}

// ListByConnector returns mappings filtered by connector type.
func (r *ExternalTagMappingRepository) ListByConnectorAndTenant(connector models.ConnectorType, tenantID uint) ([]models.ExternalTagMapping, error) {
	var mappings []models.ExternalTagMapping
	err := r.db.
		Where("connector_type = ? AND tenant_id = ?", connector, tenantID).
		Order("external_name").
		Find(&mappings).Error
	return mappings, err
}

func (r *ExternalTagMappingRepository) FindByExternalName(connectorType models.ConnectorType, externalName string) (*models.ExternalTagMapping, error) {
	var m models.ExternalTagMapping
	err := r.db.
		Where("connector_type = ? AND external_name = ?", connectorType, externalName).
		First(&m).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ExternalTagMappingRepository) FindByExternalNameAndTenant(connectorType models.ConnectorType, externalName string, tenantID uint) (*models.ExternalTagMapping, error) {
	var m models.ExternalTagMapping
	err := r.db.
		Where("connector_type = ? AND external_name = ? AND tenant_id = ?", connectorType, externalName, tenantID).
		First(&m).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ExternalTagMappingRepository) DeleteByTenant(id uint, tenantID uint) error {
	return r.db.Where("tenant_id = ?", tenantID).Delete(&models.ExternalTagMapping{}, id).Error
}
