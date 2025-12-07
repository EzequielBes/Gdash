package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io" // Import the io package
	"net/http"
	"time"

	"gdash-worker/internal/domain"
	"gdash-worker/internal/infrastructure/logger" // Import the custom logger
)

// BackendClient is a client for the backend API.
type BackendClient struct {
	baseURL    string
	httpClient *http.Client
	maxRetries int
	retryDelay time.Duration
	logger     *logger.Logger // Add the custom logger
}

// NewBackendClient creates a new BackendClient.
func NewBackendClient(baseURL string, logger *logger.Logger) *BackendClient {
	return &BackendClient{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second}, // Add a timeout to the HTTP client
		maxRetries: 3,
		retryDelay: 2 * time.Second, // Initial retry delay
		logger:     logger,
	}
}

// PostWeatherLog posts a weather log to the backend with retry logic.
func (c *BackendClient) PostWeatherLog(ctx context.Context, logData *domain.WeatherLog) error {
	jsonData, err := json.Marshal(logData)
	if err != nil {
		return fmt.Errorf("failed to marshal weather log: %w", err)
	}

	for i := 0; i < c.maxRetries; i++ {
		req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/weather/logs", bytes.NewBuffer(jsonData))
		if err != nil {
			return fmt.Errorf("failed to create request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			c.logger.Error("Attempt %d: Failed to send request to backend: %v", i+1, err)
			if i < c.maxRetries-1 {
				time.Sleep(c.retryDelay * time.Duration(1<<i)) // Exponential backoff
				continue
			}
			return fmt.Errorf("failed to send request after %d attempts: %w", c.maxRetries, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusCreated || resp.StatusCode == http.StatusOK {
			c.logger.Info("Successfully posted weather log to backend.")
			return nil // Success
		} else if resp.StatusCode >= 400 && resp.StatusCode < 500 {
			// Do not retry for client errors (e.g., 400 Bad Request)
			bodyBytes := make([]byte, 0)
			if resp.Body != nil {
				bodyBytes, _ = io.ReadAll(resp.Body)
			}
			c.logger.Error("Backend returned client error status: %d, Body: %s", resp.StatusCode, string(bodyBytes))
			return fmt.Errorf("backend returned client error status: %d", resp.StatusCode)
		} else {
			// Retry for server errors or other transient issues
			c.logger.Error("Attempt %d: Backend returned non-success status: %d", i+1, resp.StatusCode)
			if i < c.maxRetries-1 {
				time.Sleep(c.retryDelay * time.Duration(1<<i)) // Exponential backoff
				continue
			}
			return fmt.Errorf("backend returned non-success status after %d attempts: %d", c.maxRetries, resp.StatusCode)
		}
	}
	return fmt.Errorf("unexpected error: retry loop exited without success or explicit error")
}
