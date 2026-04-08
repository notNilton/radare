package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"radare-datarecon/apps/backend/internal/config"
	"radare-datarecon/apps/backend/internal/handlers"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	_ "radare-datarecon/apps/backend/docs"
	"radare-datarecon/database"
	"syscall"
	"time"

	httpSwagger "github.com/swaggo/http-swagger"
)

// @title Radare API
// @version 1.0
// @description API para o sistema de reconciliação de dados Radare.
// @termsOfService http://swagger.io/terms/

// @contact.name Nilton Aguiar
// @contact.url http://nilbyte.com.br
// @contact.email nilton.naab@gmail.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	// Load application configuration from environment variables.
	cfg := config.Load()

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
		cfg.DBSslMode,
	)

	// Connect to the database and migrate the schema.
	database.Connect(dsn)
	if err := database.DB.AutoMigrate(&models.User{}, &models.Tag{}, &models.Reconciliation{}); err != nil {
		slog.Error("Failed to migrate database schema", "error", err)
		os.Exit(1)
	}

	// Instantiate the authentication middleware with the JWT secret.
	authMiddleware := middleware.AuthMiddleware(cfg.JWTSecret)

	// Register handlers for the API endpoints.
	// Each handler is wrapped with middleware for logging, error handling, and authentication.
	http.Handle("/api/register", middleware.LoggingMiddleware(middleware.ErrorHandler(handlers.Register)))
	http.Handle("/api/login", middleware.LoggingMiddleware(middleware.ErrorHandler(handlers.LoginHandler(cfg.JWTSecret))))
	http.Handle("/api/refresh", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.RefreshHandler(cfg.JWTSecret)))))
	http.Handle("/api/profile", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.GetUserProfile))))
	http.Handle("/api/profile/update", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.UpdateUserProfile))))
	http.Handle("/api/profile/password", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.ChangePassword))))
	http.Handle("/api/tags", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.GetTags))))
	http.Handle("/api/tags/create", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.CreateTag))))
	http.Handle("/api/tags/delete", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.DeleteTag))))
	http.Handle("/api/current-values", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.GetCurrentValues))))
	http.Handle("/api/reconcile", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.ReconcileData))))
	http.Handle("/api/reconcile/history", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.GetReconciliationHistory))))
	http.Handle("/api/reconcile/export", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.ExportReconciliationHistory))))
	http.Handle("/api/dashboard/stats", middleware.LoggingMiddleware(authMiddleware(middleware.ErrorHandler(handlers.GetDashboardStats))))
	http.Handle("/api/ws", http.HandlerFunc(handlers.HandleWebsocket))
	http.Handle("/healthz", middleware.LoggingMiddleware(middleware.ErrorHandler(handlers.HealthCheck)))

	// Swagger UI
	http.Handle("/swagger/", httpSwagger.WrapHandler)

	// Create and configure the HTTP server.
	server := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for operating system signals for graceful shutdown.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start the server in a separate goroutine.
	go func() {
		slog.Info("Server starting", "port", cfg.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	// Block until a shutdown signal is received.
	sig := <-sigChan
	slog.Info("Received shutdown signal, initiating graceful shutdown...", "signal", sig)

	// Create a context with a timeout to allow for graceful shutdown.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt to gracefully shut down the server.
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server shutdown failed", "error", err)
		os.Exit(1)
	}

	slog.Info("Server shut down successfully.")
}
