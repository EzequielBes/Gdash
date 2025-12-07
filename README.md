# GDASH - Sistema de Monitoramento Climático
https://youtu.be/5kILGGWLecU
Sistema completo de monitoramento e previsão climática com arquitetura de microsserviços.

## 🚀 Como Rodar (Recomendado)

A maneira mais fácil de rodar todo o ecossistema é usando Docker Compose.

### Pré-requisitos
*   Docker
*   Docker Compose

### Passo a Passo
1.  Clone o repositório e entre na pasta raiz.
2.  Crie o arquivo `.env` (se necessário, baseie-se nos exemplos ou use os padrões do docker-compose).
3.  Execute o comando:

```bash
docker-compose up --build
```

4.  Acesse a aplicação no navegador.

---

## 🔗 URLs Principais

| Serviço | URL | Descrição |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Dashboard Principal |
| **API Backend** | [http://localhost:3001](http://localhost:3001) | API REST |
| **Swagger Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Documentação da API |
| **RabbitMQ** | [http://localhost:15672](http://localhost:15672) | Gestão de Filas (Login: guest/guest) |

---

## 🔑 Acesso Inicial

Para o primeiro acesso, utilize as credenciais de administrador padrão:

*   **Email:** `admin@gdash.local`
*   **Senha:** `123456`

> **Nota:** Você pode criar novos usuários e gerenciar permissões na tela de "Usuários" após o login.

---

## 💻 Rodando Serviços Individualmente (Desenvolvimento)

Caso queira rodar ou debugar serviços específicos fora do Docker:

### 1. Serviço Python (Collector)
Responsável por coletar dados.

```bash
cd services/collector
python3 -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
python main.py
```

### 2. Serviço Go (Worker)
Responsável por processar mensagens da fila.

```bash
cd services/worker
go mod tidy
go run main.go
```

### 3. Backend (NestJS)
API e Regras de Negócio.

```bash
cd services/backend
npm install
npm run start:dev
```

### 4. Frontend (React)
Interface do Usuário.

```bash
cd services/frontend
npm install
npm run dev
```
