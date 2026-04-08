package repositories

import (
	"context"
	"testing"
	"time"

	"radare-datarecon/backend/internal/models"

	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	ctx := context.Background()
	container, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("radare_test"),
		tcpostgres.WithUsername("radare"),
		tcpostgres.WithPassword("radare"),
		tcpostgres.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(2*time.Minute),
		),
	)
	if err != nil {
		t.Fatalf("start postgres container: %v", err)
	}

	t.Cleanup(func() {
		if terminateErr := container.Terminate(ctx); terminateErr != nil {
			t.Fatalf("terminate postgres container: %v", terminateErr)
		}
	})

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("build postgres connection string: %v", err)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open gorm connection: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Tag{}, &models.Reconciliation{}); err != nil {
		t.Fatalf("auto migrate test schema: %v", err)
	}

	return db
}
