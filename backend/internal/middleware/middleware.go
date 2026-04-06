package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// HTTPError represents a structured error with an HTTP status code and a message.
// This allows handlers to return specific error responses, which are then processed
// by the ErrorHandler middleware.
type HTTPError struct {
	Code    int
	Message string
}

// Error implements the error interface for HTTPError.
func (e HTTPError) Error() string {
	return e.Message
}

// AppHandler defines a custom HTTP handler type that returns an error.
// This simplifies error handling by allowing handlers to return errors directly,
// which are then centralized and managed by the ErrorHandler middleware.
type AppHandler func(w http.ResponseWriter, r *http.Request) error

// LoggingMiddleware provides a robust logging mechanism for all incoming requests.
// It records essential information such as the request method, URL, remote address,
// and user agent, as well as the time taken to process the request.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		slog.Info("Request received",
			"method", r.Method,
			"url", r.URL.String(),
			"remote_addr", r.RemoteAddr,
			"user_agent", r.UserAgent(),
		)

		next.ServeHTTP(w, r)

		slog.Info("Request processed",
			"url", r.URL.String(),
			"duration", time.Since(startTime),
		)
	})
}

// ErrorHandler is a centralized middleware for error management. It gracefully
// handles errors returned by AppHandlers and recovers from panics, preventing server

// crashes and ensuring a consistent error response format.
func ErrorHandler(handler AppHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("Critical Error: Recovered from panic",
					"method", r.Method,
					"url", r.URL.String(),
					"error", err,
				)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()

		err := handler(w, r)
		if err != nil {
			slog.Warn("Request Error",
				"method", r.Method,
				"url", r.URL.String(),
				"error", err,
			)

			var httpErr HTTPError
			if he, ok := err.(HTTPError); ok {
				httpErr = he
			} else {
				httpErr = HTTPError{
					Code:    http.StatusInternalServerError,
					Message: "An unexpected error occurred.",
				}
			}
			http.Error(w, httpErr.Message, httpErr.Code)
		}
	}
}

// NewAuthMiddleware creates a new authentication middleware with a provided JWT secret.
// This function acts as a factory, decoupling the middleware from global configuration
// and making it more modular and testable. The returned middleware validates JWTs
// from the Authorization header.
func NewAuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header is required", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				http.Error(w, "Invalid token format", http.StatusUnauthorized)
				return
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			// Inject user ID into the request context for downstream handlers.
			ctx := context.WithValue(r.Context(), "userID", claims["user_id"])
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}