package domain

import "time"

// WeatherLog representa um registro de dados climáticos
type WeatherLog struct {
	City            string    `json:"city"`
	Latitude        float64   `json:"latitude"`
	Longitude       float64   `json:"longitude"`
	Timestamp       time.Time `json:"timestamp"`
	Temperature     float64   `json:"temperature"`
	Humidity        int       `json:"humidity"`
	WindSpeed       float64   `json:"wind_speed"`
	WeatherCode     int       `json:"weather_code"`
	Pressure        float64   `json:"pressure"`
	RainProbability int       `json:"rain_probability"`
	Description     string    `json:"description"`
}

// ProcessingResult representa o resultado do processamento de uma mensagem
type ProcessingResult struct {
	Success   bool
	MessageID string
	Error     string
	Timestamp time.Time
}

// QueueMessage representa uma mensagem na fila
type QueueMessage struct {
	ID      string          `json:"id"`
	Payload WeatherLog      `json:"payload"`
	Headers map[string]string `json:"headers"`
}
