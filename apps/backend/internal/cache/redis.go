// Package cache manages the Redis connection and provides helpers for
// reading and writing industrial tag current values at high throughput.
package cache

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client is the shared Redis client. It is nil when Redis is not configured.
var Client *redis.Client

const (
	tagValueKeyPrefix    = "tag:current:"
	connectorKeyPrefix   = "connector:status:"
	tagValueTTL          = 24 * time.Hour
	connectorStatusTTL   = 2 * time.Minute
)

// Connect initialises the global Redis client from the provided URL.
// If the URL is empty the function returns without error so the app can
// run without Redis (values fall back to zero / not-found).
func Connect(url string) error {
	if url == "" {
		slog.Info("REDIS_URL not set — running without Redis cache")
		return nil
	}

	opts, err := redis.ParseURL(url)
	if err != nil {
		return fmt.Errorf("invalid REDIS_URL: %w", err)
	}

	Client = redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Client.Ping(ctx).Err(); err != nil {
		Client = nil
		return fmt.Errorf("redis ping failed: %w", err)
	}

	slog.Info("Connected to Redis", "url", url)
	return nil
}

// Disconnect closes the Redis connection gracefully.
func Disconnect() {
	if Client != nil {
		_ = Client.Close()
	}
}

// IsAvailable reports whether Redis is connected and ready.
func IsAvailable() bool {
	return Client != nil
}

// SetTagValue writes the current value for a tag into Redis.
func SetTagValue(ctx context.Context, tagID uint, value float64) error {
	if Client == nil {
		return nil
	}
	key := tagValueKeyPrefix + strconv.FormatUint(uint64(tagID), 10)
	return Client.Set(ctx, key, value, tagValueTTL).Err()
}

// GetTagValue reads the current value for a tag from Redis.
// Returns (0, false) when Redis is unavailable or the key does not exist.
func GetTagValue(ctx context.Context, tagID uint) (float64, bool) {
	if Client == nil {
		return 0, false
	}
	key := tagValueKeyPrefix + strconv.FormatUint(uint64(tagID), 10)
	raw, err := Client.Get(ctx, key).Result()
	if err != nil {
		return 0, false
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

// GetAllTagValues returns a map of tagID → value for all cached tags.
func GetAllTagValues(ctx context.Context) map[uint]float64 {
	result := map[uint]float64{}
	if Client == nil {
		return result
	}

	keys, err := Client.Keys(ctx, tagValueKeyPrefix+"*").Result()
	if err != nil {
		return result
	}

	for _, key := range keys {
		raw, err := Client.Get(ctx, key).Result()
		if err != nil {
			continue
		}
		v, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			continue
		}
		rawID := key[len(tagValueKeyPrefix):]
		id, err := strconv.ParseUint(rawID, 10, 64)
		if err != nil {
			continue
		}
		result[uint(id)] = v
	}

	return result
}

// TouchConnector records a heartbeat for a named connector (e.g. "mqtt").
func TouchConnector(ctx context.Context, name string) {
	if Client == nil {
		return
	}
	key := connectorKeyPrefix + name
	_ = Client.Set(ctx, key, time.Now().UTC().Format(time.RFC3339), connectorStatusTTL).Err()
}

// ConnectorLastSeen returns the last heartbeat time for a connector, or zero
// if not available / expired.
func ConnectorLastSeen(ctx context.Context, name string) (time.Time, bool) {
	if Client == nil {
		return time.Time{}, false
	}
	key := connectorKeyPrefix + name
	raw, err := Client.Get(ctx, key).Result()
	if err != nil {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
