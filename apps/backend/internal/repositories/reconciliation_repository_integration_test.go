package repositories

import (
	"testing"
	"time"

	"radare-datarecon/apps/backend/internal/models"
)

func TestReconciliationRepositoryListByUserAppliesFiltersAndPagination(t *testing.T) {
	db := setupTestDB(t)
	repo := NewReconciliationRepository(db)
	tenantID := testTenantID(t, db)

	user := models.User{
		TenantID:     &tenantID,
		Username:     "operator",
		Password:     "hashed-password",
		Name:         "Operator",
		ContactEmail: "operator@example.com",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	records := []models.Reconciliation{
		{
			UserID:            user.ID,
			TenantID:          &tenantID,
			Measurements:      []float64{10, 20},
			Tolerances:        []float64{0.1, 0.1},
			Constraints:       [][]float64{{1, -1}},
			ReconciledValues:  []float64{10.1, 19.9},
			Corrections:       []float64{0.1, -0.1},
			ConsistencyStatus: "Consistente",
		},
		{
			UserID:            user.ID,
			TenantID:          &tenantID,
			Measurements:      []float64{30, 40},
			Tolerances:        []float64{0.2, 0.2},
			Constraints:       [][]float64{{1, -1}},
			ReconciledValues:  []float64{30.5, 39.5},
			Corrections:       []float64{0.5, -0.5},
			ConsistencyStatus: "Inconsistente",
		},
		{
			UserID:            user.ID,
			TenantID:          &tenantID,
			Measurements:      []float64{50, 60},
			Tolerances:        []float64{0.3, 0.3},
			Constraints:       [][]float64{{1, -1}},
			ReconciledValues:  []float64{50.2, 59.8},
			Corrections:       []float64{0.2, -0.2},
			ConsistencyStatus: "Consistente",
		},
	}

	for _, record := range records {
		record := record
		if err := repo.Create(&record); err != nil {
			t.Fatalf("create reconciliation: %v", err)
		}
	}

	startDate := time.Now().Add(-time.Hour)
	endDate := time.Now().Add(time.Hour)

	history, total, err := repo.ListByUserAndTenant(user.ID, tenantID, ReconciliationHistoryFilter{
		Status:    "Consistente",
		StartDate: &startDate,
		EndDate:   &endDate,
		Page:      1,
		PageSize:  1,
	})
	if err != nil {
		t.Fatalf("list reconciliation history: %v", err)
	}

	if total != 2 {
		t.Fatalf("expected total 2, got %d", total)
	}

	if len(history) != 1 {
		t.Fatalf("expected paginated result with 1 item, got %d", len(history))
	}

	if history[0].ConsistencyStatus != "Consistente" {
		t.Fatalf("expected consistent reconciliation, got %s", history[0].ConsistencyStatus)
	}
}

func TestReconciliationRepositoryListAllByUserReturnsNewestFirst(t *testing.T) {
	db := setupTestDB(t)
	repo := NewReconciliationRepository(db)
	tenantID := testTenantID(t, db)

	user := models.User{
		TenantID:     &tenantID,
		Username:     "historian",
		Password:     "hashed-password",
		Name:         "Historian",
		ContactEmail: "historian@example.com",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	first := models.Reconciliation{
		UserID:            user.ID,
		TenantID:          &tenantID,
		Measurements:      []float64{1},
		Tolerances:        []float64{0.1},
		Constraints:       [][]float64{{1}},
		ReconciledValues:  []float64{1.1},
		Corrections:       []float64{0.1},
		ConsistencyStatus: "Consistente",
	}
	second := models.Reconciliation{
		UserID:            user.ID,
		TenantID:          &tenantID,
		Measurements:      []float64{2},
		Tolerances:        []float64{0.1},
		Constraints:       [][]float64{{1}},
		ReconciledValues:  []float64{1.9},
		Corrections:       []float64{-0.1},
		ConsistencyStatus: "Inconsistente",
	}

	if err := repo.Create(&first); err != nil {
		t.Fatalf("create first reconciliation: %v", err)
	}
	if err := repo.Create(&second); err != nil {
		t.Fatalf("create second reconciliation: %v", err)
	}

	history, err := repo.ListAllByUserAndTenant(user.ID, tenantID)
	if err != nil {
		t.Fatalf("list all reconciliations: %v", err)
	}

	if len(history) != 2 {
		t.Fatalf("expected 2 reconciliations, got %d", len(history))
	}

	if history[0].ID != second.ID {
		t.Fatalf("expected newest reconciliation first, got id %d", history[0].ID)
	}
}
