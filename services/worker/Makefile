.PHONY: help build run test clean lint fmt

help:
	@echo "GDASH Worker - Makefile Commands"
	@echo ""
	@echo "Commands:"
	@echo "  make build       - Build do worker"
	@echo "  make run         - Executar worker"
	@echo "  make test        - Executar testes"
	@echo "  make test-v      - Executar testes com verbose"
	@echo "  make test-cov    - Executar testes com cobertura"
	@echo "  make clean       - Limpar binários"
	@echo "  make lint        - Verificar linting"
	@echo "  make fmt         - Formatar código"
	@echo "  make mod-tidy    - Limpar dependências"

build:
	@echo "Building worker..."
	go build -o worker ./cmd/main.go
	@echo "Build concluído!"

run: build
	@echo "Executando worker..."
	./worker

test:
	@echo "Executando testes..."
	go test ./...

test-v:
	@echo "Executando testes (verbose)..."
	go test -v ./...

test-cov:
	@echo "Executando testes com cobertura..."
	go test -cover -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Cobertura salva em coverage.html"

clean:
	@echo "Limpando..."
	rm -f worker coverage.out coverage.html
	go clean

lint:
	@echo "Verificando linting..."
	go vet ./...

fmt:
	@echo "Formatando código..."
	go fmt ./...

mod-tidy:
	@echo "Limpando dependências..."
	go mod tidy

dev:
	@echo "Executando em modo desenvolvimento..."
	go run ./cmd/main.go

docker-build:
	@echo "Build da imagem Docker..."
	docker build -t gdash-worker:latest .

docker-run:
	@echo "Executando container Docker..."
	docker run -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
		-e API_BASE_URL=http://backend:3001 \
		-e LOG_LEVEL=debug \
		gdash-worker:latest
