package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/database"
)

// HealthCheck é o manipulador para o endpoint GET /healthz.
func HealthCheck(w http.ResponseWriter, r *http.Request) error {
	status := "ok"
	dbStatus := "connected"

	// Verifica a conexão com o banco de dados.
	sqlDB, err := database.DB.DB()
	if err != nil {
		status = "error"
		dbStatus = "disconnected"
	} else if err := sqlDB.Ping(); err != nil {
		status = "error"
		dbStatus = "unreachable"
	}

	response := map[string]interface{}{
		"status":   status,
		"database": dbStatus,
	}

	if status != "ok" {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	return json.NewEncoder(w).Encode(response)
}
