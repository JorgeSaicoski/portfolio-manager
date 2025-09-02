package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// User represents the user model
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null;size:100"`
	Password  string    `json:"-" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateProfileRequest represents the update profile request payload
type UpdateProfileRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// Claims represents the JWT claims
type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

// PaginationResponse represents paginated response
type PaginationResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
}

var (
	db        *gorm.DB
	logger    *logrus.Logger
	jwtSecret = []byte(getEnv("JWT_SECRET", "your-secret-key"))

	// Prometheus metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path", "status"},
	)

	databaseConnectionsActive = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "database_connections_active",
			Help: "Number of active database connections",
		},
	)

	databaseConnectionsIdle = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "database_connections_idle",
			Help: "Number of idle database connections",
		},
	)

	authenticationAttempts = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "authentication_attempts_total",
			Help: "Total number of authentication attempts",
		},
		[]string{"type", "status"},
	)

	activeUsers = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_users_total",
			Help: "Total number of registered users",
		},
	)

	jwtTokensGenerated = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "jwt_tokens_generated_total",
			Help: "Total number of JWT tokens generated",
		},
		[]string{"type"},
	)
)

func init() {
	// Initialize structured logger
	logger = logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logger.SetLevel(logrus.InfoLevel)

	// Set log level from environment
	if level := getEnv("LOG_LEVEL", "info"); level != "" {
		if parsedLevel, err := logrus.ParseLevel(level); err == nil {
			logger.SetLevel(parsedLevel)
		}
	}

	// Register Prometheus metrics
	prometheus.MustRegister(
		httpRequestsTotal,
		httpRequestDuration,
		databaseConnectionsActive,
		databaseConnectionsIdle,
		authenticationAttempts,
		activeUsers,
		jwtTokensGenerated,
	)
}

func main() {
	logger.Info("Starting authentication API server")

	// Initialize database
	initDB()

	// Auto migrate models
	if err := db.AutoMigrate(&User{}); err != nil {
		logger.WithError(err).Fatal("Failed to migrate database")
	}

	// Update active users metric
	updateActiveUsersMetric()

	// Start metrics collection goroutine
	go collectMetrics()

	// Initialize Gin router
	r := setupRouter()

	port := getEnv("PORT", "8080")
	logger.WithField("port", port).Info("Server starting")

	if err := r.Run(":" + port); err != nil {
		logger.WithError(err).Fatal("Failed to start server")
	}
}

func setupRouter() *gin.Engine {
	// Set Gin mode
	if getEnv("GIN_MODE", "debug") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Custom Gin logger middleware with structured logging
	r.Use(ginLoggerMiddleware())
	r.Use(gin.Recovery())

	// Prometheus metrics middleware
	r.Use(prometheusMiddleware())

	// CORS middleware
	r.Use(corsMiddleware())

	// Metrics endpoint
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", registerHandler)
		auth.POST("/login", loginHandler)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(authMiddleware())
	{
		api.GET("/profile", getProfileHandler)
		api.PUT("/profile", updateProfileHandler)
		api.DELETE("/profile", deleteProfileHandler)
		api.GET("/users", getUsersHandler)
	}

	// Health check
	r.GET("/ready", readinessCheckHandler)
	r.GET("/health", healthCheckHandler)
	r.HEAD("/health", healthCheckHandler)

	return r
}

func initDB() {
	dsn := buildDSN()

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.New(
			log.New(logger.Writer(), "\r\n", log.LstdFlags),
			gormlogger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  gormlogger.Info,
				IgnoreRecordNotFoundError: true,
				Colorful:                  false,
			},
		),
	})

	if err != nil {
		logger.WithError(err).Fatal("Failed to connect to database")
	}

	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		logger.WithError(err).Fatal("Failed to get database instance")
	}

	if err := sqlDB.Ping(); err != nil {
		logger.WithError(err).Fatal("Failed to ping database")
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	logger.Info("Connected to PostgreSQL database with GORM")
}

func buildDSN() string {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "password")
	dbname := getEnv("DB_NAME", "authdb")
	sslmode := getEnv("DB_SSLMODE", "disable")
	timezone := getEnv("DB_TIMEZONE", "UTC")

	return "host=" + host + " user=" + user + " password=" + password +
		" dbname=" + dbname + " port=" + port + " sslmode=" + sslmode +
		" TimeZone=" + timezone
}

func ginLoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logger.WithFields(logrus.Fields{
			"timestamp":    param.TimeStamp.Format(time.RFC3339),
			"method":       param.Method,
			"path":         param.Path,
			"status":       param.StatusCode,
			"latency":      param.Latency.String(),
			"client_ip":    param.ClientIP,
			"user_agent":   param.Request.UserAgent(),
			"request_size": param.Request.ContentLength,
		}).Info("HTTP request")
		return ""
	})
}

func prometheusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		c.Next()

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())

		httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, path, status).Observe(duration)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.WithError(err).WithField("ip", c.ClientIP()).Warn("Registration validation failed")
		authenticationAttempts.WithLabelValues("register", "validation_error").Inc()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.WithFields(logrus.Fields{
		"username": req.Username,
		"email":    req.Email,
		"ip":       c.ClientIP(),
	}).Info("User registration attempt")

	// Check if user already exists
	var existingUser User
	if err := db.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		logger.WithFields(logrus.Fields{
			"email":    req.Email,
			"username": req.Username,
		}).Warn("Registration failed: user already exists")
		authenticationAttempts.WithLabelValues("register", "user_exists").Inc()
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email or username already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.WithError(err).Error("Failed to hash password")
		authenticationAttempts.WithLabelValues("register", "hash_error").Inc()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	if err := db.Create(&user).Error; err != nil {
		logger.WithError(err).Error("Failed to create user")
		authenticationAttempts.WithLabelValues("register", "db_error").Inc()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user.ID)
	if err != nil {
		logger.WithError(err).WithField("user_id", user.ID).Error("Failed to generate token")
		authenticationAttempts.WithLabelValues("register", "token_error").Inc()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.WithFields(logrus.Fields{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
	}).Info("User registered successfully")

	authenticationAttempts.WithLabelValues("register", "success").Inc()
	jwtTokensGenerated.WithLabelValues("register").Inc()
	activeUsers.Inc()

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.WithError(err).WithField("ip", c.ClientIP()).Warn("Login validation failed")
		authenticationAttempts.WithLabelValues("login", "validation_error").Inc()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.WithFields(logrus.Fields{
		"email": req.Email,
		"ip":    c.ClientIP(),
	}).Info("User login attempt")

	// Find user by email
	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		logger.WithField("email", req.Email).Warn("Login failed: user not found")
		authenticationAttempts.WithLabelValues("login", "user_not_found").Inc()
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		logger.WithFields(logrus.Fields{
			"user_id": user.ID,
			"email":   req.Email,
		}).Warn("Login failed: invalid password")
		authenticationAttempts.WithLabelValues("login", "invalid_password").Inc()
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user.ID)
	if err != nil {
		logger.WithError(err).WithField("user_id", user.ID).Error("Failed to generate token")
		authenticationAttempts.WithLabelValues("login", "token_error").Inc()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.WithFields(logrus.Fields{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
	}).Info("User logged in successfully")

	authenticationAttempts.WithLabelValues("login", "success").Inc()
	jwtTokensGenerated.WithLabelValues("login").Inc()

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

func getProfileHandler(c *gin.Context) {
	userID, _ := c.Get("userID")

	var user User
	if err := db.First(&user, userID).Error; err != nil {
		logger.WithField("user_id", userID).Error("User not found for profile request")
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	logger.WithField("user_id", userID).Debug("Profile retrieved")
	c.JSON(http.StatusOK, user)
}

func updateProfileHandler(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.WithError(err).WithField("user_id", userID).Warn("Profile update validation failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if username/email already exists (excluding current user)
	var existingUser User
	if err := db.Where("(email = ? OR username = ?) AND id != ?", req.Email, req.Username, userID).First(&existingUser).Error; err == nil {
		logger.WithFields(logrus.Fields{
			"user_id":      userID,
			"new_email":    req.Email,
			"new_username": req.Username,
		}).Warn("Profile update failed: email or username already exists")
		c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		return
	}

	// Update user
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		logger.WithField("user_id", userID).Error("User not found for profile update")
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	oldUsername := user.Username
	oldEmail := user.Email

	user.Username = req.Username
	user.Email = req.Email

	if err := db.Save(&user).Error; err != nil {
		logger.WithError(err).WithField("user_id", userID).Error("Failed to update profile")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	logger.WithFields(logrus.Fields{
		"user_id":      userID,
		"old_username": oldUsername,
		"new_username": req.Username,
		"old_email":    oldEmail,
		"new_email":    req.Email,
	}).Info("User profile updated")

	c.JSON(http.StatusOK, user)
}

func deleteProfileHandler(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := db.Delete(&User{}, userID).Error; err != nil {
		logger.WithError(err).WithField("user_id", userID).Error("Failed to delete user")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	logger.WithField("user_id", userID).Info("User account deleted")
	activeUsers.Dec()

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func getUsersHandler(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	// Get total count
	var total int64
	db.Model(&User{}).Count(&total)

	// Get users with pagination
	var users []User
	if err := db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
		logger.WithError(err).Error("Failed to fetch users")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	logger.WithFields(logrus.Fields{
		"page":        page,
		"limit":       limit,
		"total_users": total,
	}).Debug("Users list retrieved")

	response := PaginationResponse{
		Data:       users,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

func healthCheckHandler(c *gin.Context) {
	// Check database connection
	sqlDB, err := db.DB()
	if err != nil {
		logger.WithError(err).Error("Health check failed: database instance error")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"database": "disconnected",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		logger.WithError(err).Error("Health check failed: database unreachable")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"database": "unreachable",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"database":  "connected",
		"timestamp": time.Now(),
	})
}

func readinessCheckHandler(c *gin.Context) {
	// More comprehensive readiness check
	_, err := db.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"ready":  false,
			"reason": "database connection error",
		})
		return
	}

	// Test actual database query
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err != nil {
		logger.WithError(err).Error("Readiness check failed: database query error")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"ready":  false,
			"reason": "database query failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ready":    true,
		"database": "operational",
	})
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.WithField("ip", c.ClientIP()).Warn("Unauthorized request: missing authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			logger.WithField("ip", c.ClientIP()).Warn("Unauthorized request: invalid authorization format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Parse and validate JWT
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			logger.WithError(err).WithField("ip", c.ClientIP()).Warn("Unauthorized request: invalid token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract claims and verify user exists
		if claims, ok := token.Claims.(*Claims); ok {
			var user User
			if err := db.First(&user, claims.UserID).Error; err != nil {
				logger.WithFields(logrus.Fields{
					"user_id": claims.UserID,
					"ip":      c.ClientIP(),
				}).Warn("Unauthorized request: user not found")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			c.Set("userID", claims.UserID)
			c.Set("user", user)
			c.Next()
		} else {
			logger.WithField("ip", c.ClientIP()).Warn("Unauthorized request: invalid token claims")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
		}
	}
}

func generateJWT(userID uint) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func collectMetrics() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Update database connection metrics
		if sqlDB, err := db.DB(); err == nil {
			stats := sqlDB.Stats()
			databaseConnectionsActive.Set(float64(stats.OpenConnections))
			databaseConnectionsIdle.Set(float64(stats.Idle))
		}

		// Update active users count
		updateActiveUsersMetric()
	}
}

func updateActiveUsersMetric() {
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err == nil {
		activeUsers.Set(float64(count))
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
