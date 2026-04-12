package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSslMode  string
	JWTSecret  string
	ServerPort string

	// Redis — optional; empty string disables caching.
	RedisURL string

	// LogDBURL — optional secondary Postgres for audit logs.
	// If empty, audit logs are written to the main DB.
	LogDBURL string

	// MQTT — optional; empty broker URL disables the worker.
	MQTTBrokerURL   string
	MQTTClientID    string
	MQTTTopicPrefix string
	MQTTUsername    string
	MQTTPassword    string

	// InfluxDB — optional; empty URL disables the worker.
	InfluxURL          string
	InfluxToken        string
	InfluxOrg          string
	InfluxBucket       string
	InfluxPollInterval time.Duration
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, proceeding with system environment variables.")
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "user"),
		DBPassword: getEnv("DB_PASSWORD", "password"),
		DBName:     getEnv("DB_NAME", "radare"),
		DBSslMode:  getEnv("DB_SSLMODE", "disable"),
		JWTSecret:  getEnv("JWT_SECRET", "your_secret_key"),
		ServerPort: getEnv("PORT", "8080"),

		RedisURL: getEnv("REDIS_URL", ""),
		LogDBURL: getEnv("LOG_DB_URL", ""),

		MQTTBrokerURL:   getEnv("MQTT_BROKER_URL", ""),
		MQTTClientID:    getEnv("MQTT_CLIENT_ID", "radare-ingest"),
		MQTTTopicPrefix: getEnv("MQTT_TOPIC_PREFIX", "radare"),
		MQTTUsername:    getEnv("MQTT_USERNAME", ""),
		MQTTPassword:    getEnv("MQTT_PASSWORD", ""),

		InfluxURL:          getEnv("INFLUX_URL", ""),
		InfluxToken:        getEnv("INFLUX_TOKEN", ""),
		InfluxOrg:          getEnv("INFLUX_ORG", ""),
		InfluxBucket:       getEnv("INFLUX_BUCKET", ""),
		InfluxPollInterval: getDurationEnv("INFLUX_POLL_INTERVAL", 30*time.Second),
	}
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	raw := getEnv(key, "")
	if raw == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
