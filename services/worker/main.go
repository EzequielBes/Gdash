package main

import (
"bytes"
"encoding/json"
"fmt"
"io"
"log"
"net/http"
"os"
"time"

"github.com/streadway/amqp"
)

type WeatherData struct {
Timestamp   string  `json:"timestamp"`
City        string  `json:"city"`
Latitude    float64 `json:"latitude"`
Longitude   float64 `json:"longitude"`
Temperature float64 `json:"temperature"`
Humidity    int     `json:"humidity"`
WindSpeed   float64 `json:"wind_speed"`
WeatherCode int     `json:"weather_code"`
Description string  `json:"description"`
}

var (
rabbitmqURL = getEnv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
backendURL  = getEnv("BACKEND_URL", "http://backend:3001")
)

func getEnv(key, defaultVal string) string {
if value, exists := os.LookupEnv(key); exists {
return value
}
return defaultVal
}

func failOnError(err error, msg string) {
if err != nil {
log.Fatalf("%s: %s", msg, err)
}
}

func sendToBackend(weatherData WeatherData) error {
payload, _ := json.Marshal(weatherData)

resp, err := http.Post(
fmt.Sprintf("%s/api/weather/logs", backendURL),
"application/json",
bytes.NewBuffer(payload),
)

if err != nil {
return err
}

defer resp.Body.Close()

if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
body, _ := io.ReadAll(resp.Body)
return fmt.Errorf("backend returned status %d: %s", resp.StatusCode, body)
}

return nil
}

func processMessage(data []byte) {
var weatherData WeatherData
err := json.Unmarshal(data, &weatherData)
if err != nil {
log.Printf("❌ Erro ao desserializar: %v", err)
return
}

log.Printf("📦 Processando dados de %s...", weatherData.City)

// Retry logic
maxRetries := 3
for attempt := 1; attempt <= maxRetries; attempt++ {
err := sendToBackend(weatherData)
if err == nil {
log.Printf("✅ Dados de %s enviados com sucesso", weatherData.City)
return
}

log.Printf("⚠️  Tentativa %d/%d falhou: %v", attempt, maxRetries, err)
if attempt < maxRetries {
time.Sleep(time.Duration(attempt*2) * time.Second)
}
}

log.Printf("❌ Falha ao enviar dados de %s após %d tentativas", weatherData.City, maxRetries)
}

func main() {
log.Println("🚀 Iniciando GDASH Weather Worker...")

conn, err := amqp.Dial(rabbitmqURL)
failOnError(err, "Erro ao conectar RabbitMQ")
defer conn.Close()

ch, err := conn.Channel()
failOnError(err, "Erro ao abrir canal")
defer ch.Close()

q, err := ch.QueueDeclare(
"weather_data",
true,
false,
false,
false,
nil,
)
failOnError(err, "Erro ao declarar fila")

msgs, err := ch.Consume(
q.Name,
"",
false,
false,
false,
false,
nil,
)
failOnError(err, "Erro ao registrar consumer")

forever := make(chan bool)

go func() {
for d := range msgs {
processMessage(d.Body)
d.Ack(false)
}
}()

log.Println("⏳ Worker aguardando mensagens...")
<-forever
}
