FROM node:18-alpine
WORKDIR /app

# Copiar archivos raíz del monorepo
COPY package*.json ./
RUN npm ci

# Copiar todo el código
COPY . .

# Cambiar el contexto de ejecución a la carpeta de la API
WORKDIR /app/apps/agronex-ai-api

# Compilar y asegurar que run-prod.sh sea ejecutable
RUN npm run build && chmod +x run-prod.sh

EXPOSE 3000
CMD ["sh", "run-prod.sh"]
