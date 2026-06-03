# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copia solo los archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --config.strict-dep-builds=false

# Copia el resto del código fuente
COPY . .

# Compila el proyecto NestJS
RUN pnpm run build

# ---- Runtime Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Copia solo lo necesario desde el builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Configura variables de entorno (opcional)
ENV NODE_ENV=production
EXPOSE 8080

# Comando de arranque
CMD ["node", "dist/main.js"]
