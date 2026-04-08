package database

import (
	"log/slog"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

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
