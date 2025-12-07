package application

import (
	"context"
	"encoding/json"

	"gdash-worker/internal/domain"
	"gdash-worker/internal/infrastructure/logger" // Import the custom logger
)

// WeatherService processes messages from the queue.
type WeatherService struct {
	poster domain.WeatherLogPoster
	logger *logger.Logger
}

// NewWeatherService creates a new WeatherService.
func NewWeatherService(poster domain.WeatherLogPoster, logger *logger.Logger) *WeatherService {
	return &WeatherService{poster: poster, logger: logger}
}

// ProcessWeatherData processes a single message.
func (s *WeatherService) ProcessWeatherData(ctx context.Context, body []byte) error {
	var logData domain.WeatherLog
	if err := json.Unmarshal(body, &logData); err != nil {
		s.logger.Error("Error unmarshalling message: %s", err)
		return err // Invalid message format
	}

	s.logger.Info("Processing weather log for %s (%f, %f) at %s", logData.City, logData.Latitude, logData.Longitude, logData.Timestamp)

	if err := s.poster.PostWeatherLog(ctx, &logData); err != nil {
		s.logger.Error("Error posting weather log: %s", err)
		return err
	}

	s.logger.Info("Successfully posted weather log for %s", logData.City)
	return nil
}
