# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar dependências
RUN pnpm install --no-frozen-lockfile

# Copiar código fonte
COPY . .

# Build
RUN pnpm run build -- --emptyOutDir

# Runtime stage
FROM nginx:alpine

# Copiar build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Iniciar servidor
CMD ["nginx", "-g", "daemon off;"]
