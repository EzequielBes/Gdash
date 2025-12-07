package http

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"gdash-worker/internal/domain"
	"gdash-worker/internal/infrastructure/logger" // Import the custom logger
	"github.com/stretchr/testify/assert"
)

// MockRoundTripper is a mock for http.RoundTripper
type MockRoundTripper struct {
	RoundTripFn func(req *http.Request) (*http.Response, error)
}

func (m *MockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.RoundTripFn(req)
}

func TestNewBackendClient(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)
	assert.NotNil(t, client)
	assert.Equal(t, "http://localhost", client.baseURL)
	assert.NotNil(t, client.httpClient)
	assert.Equal(t, client.logger, log)
}

func TestPostWeatherLog_Success(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)

	mockLogData := &domain.WeatherLog{
		Latitude:    10.0,
		Longitude:   20.0,
		Timestamp:   time.Now(),
		Temperature: 25.0,
		Humidity:    80,
		WindSpeed:   10.0,
		WeatherCode: 100,
	}

	client.httpClient.Transport = &MockRoundTripper{
		RoundTripFn: func(req *http.Request) (*http.Response, error) {
			assert.Equal(t, "POST", req.Method)
			assert.Equal(t, "http://localhost/api/weather/logs", req.URL.String())
			assert.Equal(t, "application/json", req.Header.Get("Content-Type"))

			return &http.Response{
				StatusCode: http.StatusCreated,
				Body:       io.NopCloser(strings.NewReader(`{"status": "ok"}`)),
				Header:     make(http.Header),
			}, nil
		},
	}

	err := client.PostWeatherLog(context.Background(), mockLogData)
	assert.Nil(t, err)
}

func TestPostWeatherLog_RetrySuccess(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)
	client.maxRetries = 3
	client.retryDelay = 1 * time.Millisecond // Short delay for test

	mockLogData := &domain.WeatherLog{
		Latitude:    10.0,
		Longitude:   20.0,
		Timestamp:   time.Now(),
		Temperature: 25.0,
		Humidity:    80,
		WindSpeed:   10.0,
		WeatherCode: 100,
	}

	// Simulate one failure then success
	calls := 0
	client.httpClient.Transport = &MockRoundTripper{
		RoundTripFn: func(req *http.Request) (*http.Response, error) {
			calls++
			if calls == 1 {
				return &http.Response{
					StatusCode: http.StatusInternalServerError,
					Body:       io.NopCloser(strings.NewReader(`{"error": "server error"}`)),
					Header:     make(http.Header),
				}, nil
			}
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"status": "ok"}`)),
				Header:     make(http.Header),
			}, nil
		},
	}

	err := client.PostWeatherLog(context.Background(), mockLogData)
	assert.Nil(t, err)
	assert.Equal(t, 2, calls) // Should have called twice (1 failure + 1 success)
}

func TestPostWeatherLog_MaxRetriesReached(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)
	client.maxRetries = 2
	client.retryDelay = 1 * time.Millisecond // Short delay for test

	mockLogData := &domain.WeatherLog{
		Latitude:    10.0,
		Longitude:   20.0,
		Timestamp:   time.Now(),
		Temperature: 25.0,
		Humidity:    80,
		WindSpeed:   10.0,
		WeatherCode: 100,
	}

	// Simulate all failures
	client.httpClient.Transport = &MockRoundTripper{
		RoundTripFn: func(req *http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusInternalServerError,
				Body:       io.NopCloser(strings.NewReader(`{"error": "server error"}`)),
				Header:     make(http.Header),
			}, nil
		},
	}

	err := client.PostWeatherLog(context.Background(), mockLogData)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "backend returned non-success status after 2 attempts: 500")
}

func TestPostWeatherLog_ClientErrorNoRetry(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)
	client.maxRetries = 3
	client.retryDelay = 1 * time.Millisecond

	mockLogData := &domain.WeatherLog{
		Latitude:    10.0,
		Longitude:   20.0,
		Timestamp:   time.Now(),
		Temperature: 25.0,
		Humidity:    80,
		WindSpeed:   10.0,
		WeatherCode: 100,
	}

	calls := 0
	client.httpClient.Transport = &MockRoundTripper{
		RoundTripFn: func(req *http.Request) (*http.Response, error) {
			calls++
			return &http.Response{
				StatusCode: http.StatusBadRequest, // Client error
				Body:       io.NopCloser(strings.NewReader(`{"error": "bad request"}`)),
				Header:     make(http.Header),
			}, nil
		},
	}

	err := client.PostWeatherLog(context.Background(), mockLogData)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "backend returned client error status: 400")
	assert.Equal(t, 1, calls) // Should not retry
}

func TestPostWeatherLog_NetworkError(t *testing.T) {
	log := logger.NewLogger("debug")
	client := NewBackendClient("http://localhost", log)
	client.maxRetries = 2
	client.retryDelay = 1 * time.Millisecond

	mockLogData := &domain.WeatherLog{
		Latitude:    10.0,
		Longitude:   20.0,
		Timestamp:   time.Now(),
		Temperature: 25.0,
		Humidity:    80,
		WindSpeed:   10.0,
		WeatherCode: 100,
	}

	calls := 0
	client.httpClient.Transport = &MockRoundTripper{
		RoundTripFn: func(req *http.Request) (*http.Response, error) {
			calls++
			return nil, errors.New("network unreachable") // Simulate network error
		},
	}

	err := client.PostWeatherLog(context.Background(), mockLogData)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "failed to send request after 2 attempts: network unreachable")
	assert.Equal(t, 2, calls) // Should retry
}
