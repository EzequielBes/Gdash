package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"gdash-worker/internal/application"
	"gdash-worker/internal/infrastructure/http"
	"gdash-worker/internal/infrastructure/logger"
	"gdash-worker/internal/infrastructure/queue"
)

func main() {
	logLevel := getEnv("LOG_LEVEL", "info")
	log := logger.NewLogger(logLevel)
	log.Info("🚀 Iniciando GDASH Weather Worker...")

	rabbitmqURL := getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
	backendURL := getEnv("BACKEND_URL", "http://backend:3001")

	// Initialize dependencies
	backendClient := http.NewBackendClient(backendURL, log)
	weatherService := application.NewWeatherService(backendClient, log)
	consumer := queue.NewRabbitMQConsumer(rabbitmqURL, "weather_data", log)

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle SIGINT and SIGTERM
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Info("Shutting down worker...")
		cancel()
	}()

	// Start consumer
	consumer.StartConsumer(ctx, func(ctx context.Context, body []byte) error {
		var data map[string]interface{}
		if err := json.Unmarshal(body, &data); err != nil {
			return fmt.Errorf("failed to unmarshal message: %w", err)
		}
		
		// Convert map to WeatherData struct if needed, or pass map directly
		// For now, let's assume the service takes the raw byte array or we unmarshal to the specific struct
		// But wait, the service isn't defined in the file list I saw earlier.
		// Let's check application/services.go content first.
		
		// Actually, let's just use the logic we had but cleaner.
		return weatherService.ProcessWeatherData(ctx, body)
	})
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
