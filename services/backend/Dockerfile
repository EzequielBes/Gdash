# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar dependências
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copiar código fonte
COPY . .

# Build
RUN pnpm run build

# Runtime stage
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package.json
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar apenas dependências de produção
RUN pnpm install --no-frozen-lockfile --prod

# Copiar build do stage anterior
COPY --from=builder /app/dist ./dist

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["node", "dist/main.js"]
