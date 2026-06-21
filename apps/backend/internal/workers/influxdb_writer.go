// Package workers contains background goroutines for external data ingestion.
package workers

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"strings"
	"time"

	"radare-datarecon/apps/backend/internal/reconciliation"
)

// InfluxDBWriter writes reconciliation results to InfluxDB using the line protocol
// over plain HTTP. No external client library is required.
type InfluxDBWriter struct {
	url    string
	token  string
	org    string
	bucket string
	client *http.Client
}

// NewInfluxDBWriter creates a writer configured from the given parameters.
// Returns nil (disabled) when url is empty.
func NewInfluxDBWriter(url, token, org, bucket string) *InfluxDBWriter {
	if url == "" {
		return nil
	}
	return &InfluxDBWriter{
		url:    strings.TrimRight(url, "/"),
		token:  token,
		org:    org,
		bucket: bucket,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// ReconciliationWriteInput holds the data needed to write a reconciliation result.
type ReconciliationWriteInput struct {
	WorkspaceID string
	Result      *reconciliation.ReconcileResult
	Measurements []float64
	Tolerances   []float64
	TagNames     []string
}

// Write serialises the reconciliation result as InfluxDB line protocol and posts
// it to the /api/v2/write endpoint. Errors are logged but never returned — the
// caller should not fail because the write failed.
func (w *InfluxDBWriter) Write(input ReconciliationWriteInput) {
	if w == nil {
		return
	}

	lines := buildLineProtocol(input)
	if len(lines) == 0 {
		return
	}

	body := strings.Join(lines, "\n")
	endpoint := fmt.Sprintf("%s/api/v2/write?org=%s&bucket=%s&precision=s", w.url, w.org, w.bucket)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBufferString(body))
	if err != nil {
		slog.Warn("InfluxDB writer: failed to build request", "error", err)
		return
	}
	req.Header.Set("Authorization", "Token "+w.token)
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")

	resp, err := w.client.Do(req)
	if err != nil {
		slog.Warn("InfluxDB writer: HTTP request failed", "error", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		slog.Warn("InfluxDB writer: unexpected status", "status", resp.StatusCode, "workspace_id", input.WorkspaceID)
		return
	}

	slog.Debug("InfluxDB writer: wrote reconciliation result", "workspace_id", input.WorkspaceID, "lines", len(lines))
}

// buildLineProtocol produces one line-protocol record per tag measurement.
// Measurement name: radare_reconciled
// Tags: tag_name=<name>, workspace_id=<id>
// Fields: measured, reconciled, adjustment, chi_contribution
func buildLineProtocol(input ReconciliationWriteInput) []string {
	n := len(input.Result.ReconciledValues)
	if n == 0 {
		return nil
	}

	ts := fmt.Sprintf("%d", time.Now().Unix())
	lines := make([]string, 0, n)

	for i := 0; i < n; i++ {
		measured := 0.0
		if i < len(input.Measurements) {
			measured = input.Measurements[i]
		}
		reconciled := input.Result.ReconciledValues[i]
		adjustment := reconciled - measured

		chiContrib := 0.0
		if measured != 0 && i < len(input.Tolerances) {
			sigma := math.Abs(measured) * input.Tolerances[i]
			if sigma > 0 {
				chiContrib = math.Pow((reconciled-measured)/sigma, 2)
			}
		}

		tagName := fmt.Sprintf("tag_%d", i)
		if i < len(input.TagNames) && input.TagNames[i] != "" {
			tagName = influxEscapeTag(input.TagNames[i])
		}

		wsID := influxEscapeTag(input.WorkspaceID)

		line := fmt.Sprintf(
			"radare_reconciled,tag_name=%s,workspace_id=%s measured=%g,reconciled=%g,adjustment=%g,chi_contribution=%g %s",
			tagName, wsID, measured, reconciled, adjustment, chiContrib, ts,
		)
		lines = append(lines, line)
	}

	return lines
}

// influxEscapeTag escapes spaces and commas in tag values per InfluxDB line protocol rules.
func influxEscapeTag(s string) string {
	s = strings.ReplaceAll(s, " ", "\\ ")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, "=", "\\=")
	return s
}
