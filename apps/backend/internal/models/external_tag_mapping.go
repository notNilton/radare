package models

import "gorm.io/gorm"

// ConnectorType identifies the source protocol of an external tag value.
type ConnectorType string

const (
	ConnectorMQTT     ConnectorType = "mqtt"
	ConnectorInfluxDB ConnectorType = "influxdb"
	ConnectorManual   ConnectorType = "manual"
)

// ExternalTagMapping links an external tag identifier (e.g. an MQTT topic
// payload key or an InfluxDB field name) to an internal Tag.
// One internal tag can have multiple external sources.
type ExternalTagMapping struct {
	gorm.Model
	TenantID      uint          `gorm:"not null;index" json:"tenant_id"`
	TagID         uint          `gorm:"not null;index" json:"tag_id"`
	Tag           Tag           `gorm:"foreignKey:TagID" json:"-"`
	ConnectorType ConnectorType `gorm:"not null" json:"connector_type"`
	ExternalName  string        `gorm:"not null" json:"external_name"`
	Topic         string        `gorm:"not null;default:''" json:"topic"`
}
