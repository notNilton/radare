package database

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	TimeZone string
}

func LoadConfigFromEnv() Config {
	return Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "radare"),
		Password: os.Getenv("DB_PASSWORD"),
		Name:     getEnv("DB_NAME", "radare"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
		TimeZone: getEnv("DB_TIMEZONE", "UTC"),
	}
}

func (cfg Config) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.Host,
		cfg.User,
		cfg.Password,
		cfg.Name,
		cfg.Port,
		cfg.SSLMode,
		cfg.TimeZone,
	)
}

func BuildDSNFromEnv() string {
	return LoadConfigFromEnv().DSN()
}

func Connect(dsn string) *gorm.DB {
	var err error
	slog.Info("Attempting to connect to database")

	for i := 0; i < 10; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			slog.Warn("Failed to connect to database, retrying...", "attempt", i+1, "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		sqlDB, err := DB.DB()
		if err == nil {
			err = sqlDB.Ping()
		}

		if err != nil {
			slog.Warn("Failed to ping database, retrying...", "attempt", i+1, "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		slog.Info("Successfully connected to database!")
		return DB
	}

	slog.Error("Failed to connect to database after maximum attempts", "error", err)
	os.Exit(1)
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
