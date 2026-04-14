package workers

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"radare-datarecon/apps/backend/internal/cache"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
)

// InfluxConfig holds the connection parameters for an InfluxDB 2.x instance.
type InfluxConfig struct {
	URL          string
	Token        string
	Org          string
	Bucket       string
	PollInterval time.Duration
}

// StartInfluxWorker polls InfluxDB for the latest values of mapped tags.
// It expects mappings of connector_type=influxdb where:
// - Topic = measurement name (defaults to ExternalName when empty)
// - ExternalName = field name
//
// The worker is best-effort: failures are logged and skipped.
func StartInfluxWorker(ctx context.Context, cfg InfluxConfig) error {
	if cfg.URL == "" {
		slog.Info("INFLUX_URL not set — Influx worker disabled")
		return nil
	}
	if cfg.Token == "" || cfg.Org == "" || cfg.Bucket == "" {
		slog.Warn("Influx worker disabled — missing INFLUX_TOKEN/ORG/BUCKET")
		return nil
	}

	interval := cfg.PollInterval
	if interval <= 0 {
		interval = 30 * time.Second
	}

	client := &http.Client{Timeout: 12 * time.Second}

	go func() {
		// Ping once immediately on startup so the connector shows online right away.
		if pingInflux(ctx, client, cfg) {
			cache.TouchConnector(ctx, "influxdb")
		}

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if pingInflux(ctx, client, cfg) {
					cache.TouchConnector(ctx, "influxdb")
				}
				pollInflux(ctx, client, cfg)
			}
		}
	}()

	return nil
}

// pingInflux performs a cheap health check against the InfluxDB /health endpoint.
func pingInflux(ctx context.Context, client *http.Client, cfg InfluxConfig) bool {
	url := strings.TrimRight(cfg.URL, "/") + "/health"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false
	}
	resp, err := client.Do(req)
	if err != nil {
		slog.Debug("InfluxDB health check failed", "error", err)
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode < 400
}

func pollInflux(ctx context.Context, client *http.Client, cfg InfluxConfig) {
	repo := repositories.NewExternalTagMappingRepository(database.CoreDB)
	mappings, err := repo.ListByConnector(models.ConnectorInfluxDB)
	if err != nil {
		slog.Warn("Influx worker failed to list mappings", "error", err)
		return
	}

	for _, mapping := range mappings {
		measurement := mapping.Topic
		if measurement == "" {
			measurement = mapping.ExternalName
		}
		field := mapping.ExternalName

		value, ok := queryInfluxLatest(ctx, client, cfg, measurement, field)
		if !ok {
			continue
		}

		if err := cache.SetTagValue(ctx, mapping.TagID, value); err != nil {
			slog.Warn("Influx worker failed to cache tag value",
				"tag_id", mapping.TagID,
				"measurement", measurement,
				"field", field,
				"error", err,
			)
			continue
		}

		cache.TouchConnector(ctx, "influxdb")
	}
}

func queryInfluxLatest(ctx context.Context, client *http.Client, cfg InfluxConfig, measurement string, field string) (float64, bool) {
	query := fmt.Sprintf(
		`from(bucket: "%s")
|> range(start: -5m)
|> filter(fn: (r) => r._measurement == "%s" and r._field == "%s")
|> last()`,
		cfg.Bucket,
		escapeFlux(measurement),
		escapeFlux(field),
	)

	queryURL := strings.TrimRight(cfg.URL, "/") + "/api/v2/query?org=" + url.QueryEscape(cfg.Org)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, queryURL, bytes.NewBufferString(query))
	if err != nil {
		return 0, false
	}
	req.Header.Set("Authorization", "Token "+cfg.Token)
	req.Header.Set("Content-Type", "application/vnd.flux")
	req.Header.Set("Accept", "application/csv")

	resp, err := client.Do(req)
	if err != nil {
		slog.Debug("Influx query failed", "error", err)
		return 0, false
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		slog.Debug("Influx query rejected", "status", resp.Status)
		return 0, false
	}

	value, ok := parseInfluxCSV(resp.Body)
	return value, ok
}

func parseInfluxCSV(reader io.Reader) (float64, bool) {
	csvReader := csv.NewReader(reader)
	csvReader.FieldsPerRecord = -1

	var headers []string
	for {
		record, err := csvReader.Read()
		if err != nil {
			return 0, false
		}
		if len(record) == 0 || strings.HasPrefix(record[0], "#") {
			continue
		}
		if headers == nil {
			headers = record
			continue
		}

		valueIdx := indexOf(headers, "_value")
		if valueIdx == -1 || valueIdx >= len(record) {
			return 0, false
		}
		raw := record[valueIdx]
		val, err := parseFloat(raw)
		if err != nil {
			return 0, false
		}
		return val, true
	}
}

func indexOf(values []string, target string) int {
	for i, v := range values {
		if v == target {
			return i
		}
	}
	return -1
}

func parseFloat(raw string) (float64, error) {
	raw = strings.TrimSpace(raw)
	return strconv.ParseFloat(raw, 64)
}

func escapeFlux(value string) string {
	return strings.ReplaceAll(value, `"`, `\"`)
}
