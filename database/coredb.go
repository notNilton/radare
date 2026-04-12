package database

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// CoreDB is the primary application database — stores all operational data:
// users, tags, workspaces, reconciliations and workspace versions.
var CoreDB *gorm.DB

// CoreConfig holds the connection parameters for the Core (main) database.
type CoreConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	TimeZone string
}

func LoadConfigFromEnv() CoreConfig {
	return CoreConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "radare"),
		Password: os.Getenv("DB_PASSWORD"),
		Name:     getEnv("DB_NAME", "radare"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
		TimeZone: getEnv("DB_TIMEZONE", "UTC"),
	}
}

func (cfg CoreConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.Host, cfg.User, cfg.Password, cfg.Name, cfg.Port, cfg.SSLMode, cfg.TimeZone,
	)
}

func BuildDSNFromEnv() string {
	return LoadConfigFromEnv().DSN()
}

// ConnectCoreDB opens and retries the CoreDB connection, assigning the result
// to the package-level CoreDB variable.
func ConnectCoreDB(dsn string) {
	CoreDB = connect(dsn, "CoreDB")
}

// ConnectAndReturn opens a connection and returns the *gorm.DB handle directly.
// Used by the CLI migrate tool when it needs to work with an arbitrary DSN
// without touching the package-level CoreDB or LogDB variables.
func ConnectAndReturn(dsn string) *gorm.DB {
	return connect(dsn, dsn)
}

// connect is the shared low-level retry loop used by both ConnectCoreDB and
// ConnectLogDB. It panics with os.Exit(1) after 10 failed attempts.
func connect(dsn string, label string) *gorm.DB {
	var (
		db  *gorm.DB
		err error
	)
	slog.Info("Connecting to database", "target", label)

	for i := range 10 {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			slog.Warn("Connection failed, retrying", "target", label, "attempt", i+1, "error", err)
			time.Sleep(2 * time.Second)
			continue
		}

		sqlDB, pingErr := db.DB()
		if pingErr == nil {
			pingErr = sqlDB.Ping()
		}
		if pingErr != nil {
			slog.Warn("Ping failed, retrying", "target", label, "attempt", i+1, "error", pingErr)
			time.Sleep(2 * time.Second)
			continue
		}

		slog.Info("Database connected", "target", label)
		return db
	}

	slog.Error("Could not connect after 10 attempts", "target", label, "error", err)
	os.Exit(1)
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
