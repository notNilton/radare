package database

import (
	"fmt"
	"log/slog"
	"os"
	"radare-datarecon/backend/internal/config"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
		cfg.DBSslMode,
	)

	slog.Info("Attempting to connect to database", "host", cfg.DBHost, "dbname", cfg.DBName)

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
		return
	}

	slog.Error("Failed to connect to database after maximum attempts", "error", err)
	os.Exit(1)
}
