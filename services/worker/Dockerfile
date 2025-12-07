# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache git

# Copiar código fonte PRIMEIRO
COPY . .

# Inicializar mod se não existir
RUN if [ ! -f go.mod ]; then go mod init gdash-worker; fi

# Download explícito do módulo
RUN go mod tidy

# Copiar código fonte (já copiado, mas certifica)
# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o worker ./cmd/main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Instalar ca-certificates para HTTPS
RUN apk --no-cache add ca-certificates

# Copiar binário do stage anterior
COPY --from=builder /app/worker .

# Executar worker
CMD ["./worker"]
