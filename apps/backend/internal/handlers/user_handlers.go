// Package handlers contains the HTTP request handlers for the API.
package handlers

import (
	"encoding/json"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/database"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

var validate = validator.New()

// RegisterRequest defines the structure for a new user registration request.
type RegisterRequest struct {
	Username     string `json:"username" validate:"required,min=3"`
	Password     string `json:"password" validate:"required,min=6"`
	Name         string `json:"name" validate:"required"`
	ContactEmail string `json:"contact_email" validate:"required,email"`
	ProfileIcon  string `json:"profile_icon"`
	models.Address
}

// Register creates a new user in the system.
// @Summary Register a new user
// @Description Create a new user account with profile details
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} map[string]string
// @Failure 400 {object} middleware.HTTPError
// @Router /register [post]
func Register(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodPost {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Method not allowed"}
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid request body: " + err.Error()}
	}

	if err := validate.Struct(req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Validation failed: " + err.Error()}
	}

	// Generate a hash of the password for secure storage.
// ... (rest of the code unchanged)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err // Return a 500 error if hashing fails.
	}

	// Create a new User instance with the request data.
	user := models.User{
		Username:     req.Username,
		Password:     string(hashedPassword),
		Name:         req.Name,
		ContactEmail: req.ContactEmail,
		Address:      req.Address,
		ProfileIcon:  req.ProfileIcon,
	}

	// Save the new user to the database.
	if result := database.DB.Create(&user); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Error creating user: " + result.Error.Error()}
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
	return nil
}

// generateToken creates a new JWT for a user.
func generateToken(userID uint, jwtSecret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	return token.SignedString([]byte(jwtSecret))
}

// AuthRequest defines the structure for a login request.
type AuthRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginHandler creates a handler for the POST /api/login endpoint.
func LoginHandler(jwtSecret string) middleware.AppHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		if r.Method != http.MethodPost {
			return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Method not allowed"}
		}

		var req AuthRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid request body: " + err.Error()}
		}

		var user models.User
		if result := database.DB.Where("username = ?", req.Username).First(&user); result.Error != nil {
			return middleware.HTTPError{Code: http.StatusNotFound, Message: "User not found"}
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Incorrect password"}
		}

		tokenString, err := generateToken(user.ID, jwtSecret)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
		return nil
	}
}

// RefreshHandler creates a handler for refreshing an existing token.
func RefreshHandler(jwtSecret string) middleware.AppHandler {
	return func(w http.ResponseWriter, r *http.Request) error {
		userID, ok := r.Context().Value("userID").(float64)
		if !ok {
			return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Unauthorized"}
		}

		newToken, err := generateToken(uint(userID), jwtSecret)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": newToken})
		return nil
	}
}
// GetUserProfile returns the profile of the authenticated user.
// The user ID is extracted from the JWT, which is validated by the AuthMiddleware.
func GetUserProfile(w http.ResponseWriter, r *http.Request) error {
	// The user ID is injected into the context by the AuthMiddleware.
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		// This error indicates a problem with the middleware or how the token was generated.
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid user ID in token"}
	}

	var user models.User
	// Fetch the user from the database, omitting the password for security.
	if result := database.DB.Omit("Password").First(&user, uint(userID)); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "User not found"}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
	return nil
}

// UpdateUserProfile updates the profile of the authenticated user.
// Only the fields provided in the request are updated.
func UpdateUserProfile(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid user ID in token"}
	}

	var user models.User
	if result := database.DB.First(&user, uint(userID)); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "User not found"}
	}

	// Decode the request into a map to allow for partial updates.
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid request body"}
	}

	// GORM allows updating from a map, which is ideal for partial updates.
	// Prevent password from being updated through this endpoint.
	delete(updates, "password")
	flattenAddressUpdates(updates)
	if result := database.DB.Model(&user).Updates(updates); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Error updating user profile"}
	}

	w.Header().Set("Content-Type", "application/json")
	if result := database.DB.Omit("Password").First(&user, uint(userID)); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "User not found"}
	}

	json.NewEncoder(w).Encode(user)
	return nil
}

// ChangePasswordRequest defines the structure for a password change request.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// ChangePassword changes the password of the authenticated user.
// It requires the current password for verification before setting the new one.
func ChangePassword(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid user ID in token"}
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "Invalid request body"}
	}

	var user models.User
	if result := database.DB.First(&user, uint(userID)); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "User not found"}
	}

	// Verify that the provided current password matches the stored password.
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Incorrect current password"}
	}

	// Generate a hash of the new password.
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err // Internal server error when generating the hash.
	}

	// Update the user's password in the database.
	if result := database.DB.Model(&user).Update("password", string(hashedPassword)); result.Error != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Error changing password"}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Password changed successfully"})
	return nil
}

func flattenAddressUpdates(updates map[string]interface{}) {
	rawAddress, ok := updates["address"]
	if !ok {
		return
	}

	address, ok := rawAddress.(map[string]interface{})
	if !ok {
		delete(updates, "address")
		return
	}

	if value, exists := address["street"]; exists {
		updates["street"] = value
	}
	if value, exists := address["city"]; exists {
		updates["city"] = value
	}
	if value, exists := address["state"]; exists {
		updates["state"] = value
	}
	if value, exists := address["zip_code"]; exists {
		updates["zip_code"] = value
	}
	if value, exists := address["country"]; exists {
		updates["country"] = value
	}

	delete(updates, "address")
}
