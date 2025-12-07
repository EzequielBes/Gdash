# Worker Configuration

## Environment Variables

```
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
API_BASE_URL=http://backend:3001
LOG_LEVEL=info
```

## Setup

1. Install Go 1.21+
2. Run `go mod download`
3. Run `go run ./cmd/main.go`

## Building

```bash
go build -o worker ./cmd/main.go
```

## Testing

```bash
go test ./...
```
