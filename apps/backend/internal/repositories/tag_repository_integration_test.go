package repositories

import (
	"strconv"
	"testing"

	"radare-datarecon/apps/backend/internal/models"
)

func TestTagRepositoryCRUD(t *testing.T) {
	db := setupTestDB(t)
	repo := NewTagRepository(db)
	tenantID := testTenantID(t, db)

	tag := models.Tag{
		TenantID:    tenantID,
		Name:        "FT-101",
		Description: "Flow transmitter",
		Unit:        "kg/h",
	}

	if err := repo.Create(&tag); err != nil {
		t.Fatalf("create tag: %v", err)
	}

	tags, err := repo.ListByTenant(tenantID)
	if err != nil {
		t.Fatalf("list tags: %v", err)
	}

	if len(tags) != 1 {
		t.Fatalf("expected 1 tag, got %d", len(tags))
	}

	if tags[0].Name != "FT-101" {
		t.Fatalf("expected FT-101, got %s", tags[0].Name)
	}

	if err := repo.DeleteByIDAndTenant(strconv.FormatUint(uint64(tag.ID), 10), tenantID); err != nil {
		t.Fatalf("delete tag: %v", err)
	}

	tags, err = repo.ListByTenant(tenantID)
	if err != nil {
		t.Fatalf("list tags after delete: %v", err)
	}

	if len(tags) != 0 {
		t.Fatalf("expected no tags after delete, got %d", len(tags))
	}
}
