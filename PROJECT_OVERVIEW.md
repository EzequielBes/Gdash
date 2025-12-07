# Visão Geral do Projeto GDASH

Este documento fornece uma visão concisa da arquitetura, fluxo de dados e decisões técnicas do projeto GDASH.

## 🏗️ Arquitetura Geral

O sistema segue uma arquitetura de **microsserviços** orquestrada via Docker. Internamente, cada serviço foi construído seguindo os princípios da **Clean Architecture (Arquitetura Limpa)**, também conhecida como **Hexagonal Architecture (Ports and Adapters)**.

### Por que essa escolha?
Essa abordagem foi adotada para garantir:
1.  **Independência de Frameworks:** O núcleo da lógica de negócio não depende do NestJS, Gin ou bibliotecas externas.
2.  **Testabilidade:** As regras de negócio podem ser testadas sem banco de dados ou servidores HTTP.
3.  **Independência de Banco de Dados:** O MongoDB pode ser trocado por PostgreSQL ou outro banco apenas alterando a camada de infraestrutura.

### Estrutura das Camadas (Padrão em todos os serviços):

1.  **Domain (Núcleo):**
    *   Contém as **Entidades** (ex: `WeatherLog`, `User`) e as **Interfaces de Repositório**.
    *   *Regra:* Não conhece nada de fora, nem banco de dados, nem HTTP.

2.  **Application (Casos de Uso):**
    *   Contém os **Serviços** e **Use Cases** (ex: `FetchWeatherUseCase`, `CreateUser`).
    *   Orquestra o fluxo de dados usando as interfaces do Domain.

3.  **Infrastructure (Adaptadores):**
    *   Implementações reais das interfaces (ex: `MongoWeatherRepository`, `RabbitMQService`).
    *   Conexões com banco de dados, filas e APIs externas.

4.  **Presentation (Entrada):**
    *   Controladores HTTP (REST), Consumers de Fila ou CLI.
    *   Recebe as requisições e chama a camada de Application.

### Componentes Principais:
1.  **Collector (Python):** Serviço de ingestão de dados.
2.  **Message Broker (RabbitMQ):** Sistema de mensageria para comunicação assíncrona.
3.  **Worker (Go):** Processador de dados de alta performance.
4.  **Backend (NestJS):** API REST, gestão de regras de negócio e persistência.
5.  **Frontend (React + Vite):** Interface do usuário interativa.
6.  **Banco de Dados (MongoDB):** Armazenamento NoSQL para logs climáticos e usuários.

---

## 🔄 Pipeline de Dados

O fluxo de dados segue o caminho abaixo para garantir resiliência e desacoplamento:

1.  **Coleta (Python):** O serviço `collector` consulta APIs externas (OpenMeteo/Nominatim) periodicamente para obter dados climáticos brutos de cidades monitoradas.
2.  **Fila (RabbitMQ):** Os dados brutos são publicados em uma fila de mensagens, garantindo que picos de tráfego não derrubem o processamento.
3.  **Processamento (Go):** O serviço `worker` (escrito em Go pela sua velocidade e concorrência) consome as mensagens da fila, valida, normaliza os dados e os prepara para persistência.
4.  **Persistência e API (NestJS):** O Backend recebe os dados processados (ou os lê do banco inserido pelo worker) e os disponibiliza via API REST segura.
5.  **Visualização (Frontend):** O usuário final visualiza os dados em tempo real, gráficos históricos e previsões no dashboard React.

---

## 🧠 Insights de IA e Previsões

A "inteligência" do sistema reside na camada de aplicação do Backend (NestJS):

*   **Geração:** O `WeatherService` analisa o histórico recente de logs climáticos e dados de previsão futura (Forecast API).
*   **Lógica:** Algoritmos estatísticos calculam tendências (ex: aumento súbito de temperatura) e riscos (ex: probabilidade de chuva > 70%).
*   **Exibição:** Os insights são traduzidos em linguagem natural (ex: "Alta probabilidade de chuva nas próximas horas") e alertas visuais no Frontend.

---

## 🛠️ Principais Decisões Técnicas

*   **Docker Compose:** Para garantir que todo o ambiente (6 containers) suba com um único comando, eliminando o "funciona na minha máquina".
*   **RabbitMQ:** Escolhido para evitar perda de dados caso o serviço de processamento esteja ocupado ou offline temporariamente.
*   **Go (Golang):** Utilizado no worker para garantir baixo consumo de memória e alto throughput no processamento de mensagens.
*   **NestJS:** Framework robusto para o backend, facilitando a criação de arquitetura modular, injeção de dependência e integração com TypeScript.
*   **Shadcn/UI + Tailwind:** Para uma interface moderna, responsiva e acessível com desenvolvimento rápido.

---

## 🚀 Demonstração Rápida (Docker)

Para ver a aplicação rodando em minutos:

1.  Certifique-se de ter o **Docker** e **Docker Compose** instalados.
2.  Na raiz do projeto, execute:
    ```bash
    docker-compose up --build
    ```
3.  Aguarde os logs estabilizarem.
4.  Acesse `http://localhost:5173` e faça login.
