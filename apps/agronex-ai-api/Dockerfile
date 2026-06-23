FROM node:18-alpine
WORKDIR /app

# Copiar el monorepo completo
COPY . .

# Movernos directamente a la carpeta de la API
WORKDIR /app/apps/agronex-ai-api

# Instalar dependencias locales de la API y asegurar los binarios
RUN npm install && npm run build && chmod +x run-prod.sh

EXPOSE 3000
CMD ["sh", "run-prod.sh"]
