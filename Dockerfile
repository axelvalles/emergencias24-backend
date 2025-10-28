# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./
RUN npm ci

# Copia el resto del código fuente
COPY . .

# Compila el proyecto NestJS
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Copia solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Configura variables de entorno (opcional)
ENV NODE_ENV=production
EXPOSE 8080

# Comando de arranque
CMD ["node", "dist/main.js"]
