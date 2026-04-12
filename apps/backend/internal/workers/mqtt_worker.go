// Package workers contains background goroutines for external data ingestion.
package workers

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"radare-datarecon/apps/backend/internal/cache"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
)

// MQTTConfig holds all parameters required to start the MQTT worker.
type MQTTConfig struct {
	BrokerURL   string
	ClientID    string
	TopicPrefix string
	Username    string
	Password    string
}

// StartMQTTWorker connects to the broker and subscribes to
// {TopicPrefix}/# in a background goroutine.
// The goroutine runs until ctx is cancelled.
// Returns immediately with no error if BrokerURL is empty.
func StartMQTTWorker(ctx context.Context, cfg MQTTConfig) error {
	if cfg.BrokerURL == "" {
		slog.Info("MQTT_BROKER_URL not set — MQTT worker disabled")
		return nil
	}

	opts := mqtt.NewClientOptions().
		AddBroker(cfg.BrokerURL).
		SetClientID(cfg.ClientID).
		SetAutoReconnect(true).
		SetConnectRetry(true).
		SetConnectRetryInterval(5 * time.Second).
		SetOnConnectHandler(func(c mqtt.Client) {
			slog.Info("MQTT connected", "broker", cfg.BrokerURL)
			cache.TouchConnector(ctx, "mqtt")

			topic := fmt.Sprintf("%s/#", cfg.TopicPrefix)
			if t := c.Subscribe(topic, 1, func(_ mqtt.Client, msg mqtt.Message) {
				handleMessage(ctx, cfg.TopicPrefix, msg)
			}); t.Wait() && t.Error() != nil {
				slog.Warn("MQTT subscribe failed", "topic", topic, "error", t.Error())
			}
		}).
		SetConnectionLostHandler(func(_ mqtt.Client, err error) {
			slog.Warn("MQTT connection lost", "error", err)
		})

	if cfg.Username != "" {
		opts.SetUsername(cfg.Username).SetPassword(cfg.Password)
	}

	client := mqtt.NewClient(opts)
	if t := client.Connect(); t.WaitTimeout(10*time.Second) && t.Error() != nil {
		return fmt.Errorf("mqtt connect: %w", t.Error())
	}

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		defer client.Disconnect(250)

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if client.IsConnected() {
					cache.TouchConnector(ctx, "mqtt")
				}
			}
		}
	}()

	return nil
}

// handleMessage processes a single MQTT message.
// Topic format: {prefix}/{external_name}
// Payload: a UTF-8 encoded float64.
func handleMessage(ctx context.Context, prefix string, msg mqtt.Message) {
	cache.TouchConnector(ctx, "mqtt")

	// Extract external name from topic.
	topic := msg.Topic()
	externalName := topic
	if len(prefix)+1 < len(topic) {
		externalName = topic[len(prefix)+1:]
	}

	value, err := strconv.ParseFloat(string(msg.Payload()), 64)
	if err != nil {
		slog.Debug("MQTT non-numeric payload, skipping", "topic", topic)
		return
	}

	repo := repositories.NewExternalTagMappingRepository(database.CoreDB)
	mapping, err := repo.FindByExternalName(models.ConnectorMQTT, externalName)
	if err != nil {
		// Unknown tag — not an error, just unmapped.
		return
	}

	if err := cache.SetTagValue(ctx, mapping.TagID, value); err != nil {
		slog.Warn("Failed to cache tag value from MQTT",
			"tag_id", mapping.TagID,
			"external_name", externalName,
			"error", err,
		)
	}
}
