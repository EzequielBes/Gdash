package domain

import "context"

// WeatherLogPoster is an interface for posting weather logs to a backend.
type WeatherLogPoster interface {
	PostWeatherLog(ctx context.Context, log *WeatherLog) error
}