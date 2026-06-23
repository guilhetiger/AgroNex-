FROM node:18-alpine AS base

FROM base AS builder
WORKDIR /app
COPY . .
WORKDIR /app/apps/agronex-ai-api
RUN npm install && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copiar el build standalone completo
COPY --from=builder /app/apps/agronex-ai-api/.next/standalone ./
COPY --from=builder /app/apps/agronex-ai-api/.next/static ./apps/agronex-ai-api/.next/static
COPY --from=builder /app/apps/agronex-ai-api/public ./apps/agronex-ai-api/public

WORKDIR /app

# Modificamos el entrypoint para que si Railway no inyecta un $PORT, use el 3000 por defecto.
RUN echo '#!/bin/sh' > entrypoint.sh && \
    echo 'export PORT=${PORT:-3000}' >> entrypoint.sh && \
    echo 'echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnNtbHNjc2VlbXhzcmJ5a3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjE2MjQsImV4cCI6MjA5NTkzNzYyNH0.guxc3UwynVWPtjghsHKZojD7LCjYfHMuI28yYDtTUnA" > /app/apps/agronex-ai-api/.env.production' >> entrypoint.sh && \
    echo 'echo '\''GCP_SA_JSON={"type": "service_account", "project_id": "agronex-498111", "private_key_id": "0cce3fd38d1454ce2db7b5527c817f8cd3d8e3f9", "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDKI+/6bWI80h8A\n0V9O09NrefG6AUx30NthpXKge1dficZrISUnqnx9xnauLkUJRVBJ8JBE8w9G4Lyo\n3/wodAC+2pFwmoKZI6baGMaYqsVQiH6B8lReGCy97qcUwuoHZ7q2YqkSyhO04w2v\nqqmp5VzlIJc0sJR6Q+Nhb9v6tvO3xf6ArWSvZV10sKXZnH3ciVgyXBW1Gx7egxcs\nOi18K6yvhPzfhQ/zY1SdhDTEy0H5Z746yTEiZRbYXRoA+aEEs0Ch25TH/ZviJ2gf\nUC0DnoqubuusMV5WcyYYOn6ygchsF2fpqWQPLviGKf8N+kPV2TUMUOFiLlbuyuSi\n97oRva6hAgMBAAECggEABjvpKkLWV+7ZAu2cxVxrYEdV/k5iR9hanl57tFmpc6pW\n7WCLz0yG41rMDTTNxJVCfnfwqG0LPbyE76ZcwKNMj0DutwIk4J6EsPmOTRCzM3fK\nLa1wuagq376s9iB0FuoK4ZYVsHJ9Uhj7MpLjrE2FDxHxZ9rBnCsHfQP196ZNyjnp\nxapFPOGNTAOVCaAuUlk/+vVsjUwXF0UQHBFGngwICIB9IjQgGxyRk6kKftERRgIM\nyksS+0AqMSV/wKeC864sEJaT7+CzVofmOnIAeTNZO5nvwJx4jcxfkUoqQiGphwf1\nNXRJAOalf+tvZXJdKywED+2mbGfgTZvhiPcY/cgceQKBgQDoq7yO02ikDOj7URrT\npjAPJDbnif2J68w7apRENlp2DbDEExCzAhHqvnm3YSO/1Is1c+4IrXzE+mdSqmc3\nV7gqfUg4453HX8t0ixJ6+XfhZmFz5GdoV7ZSw30kT86jLT9vcb3Pumtyp0TSnuXB\nVSpcAikkXtlZf1YKGbKPb8IC3QKBgQDeaIkyrnrP9qrNZs754JzA099z825ByvHg\nPIBP6RVozmOliFedRtq7GCZFl7l7jFKLDi69WJSgUHUKw9MUg900vYqIJOPTAJEC\nljegSBwtlWuNXqzp8w1K2xiQHW1WAYrTXksmPYuCgX34KNtO8pxpCZnALCRItxnv\npP3nqo/UlQKBgQCqZ0zb1d2neIURut7I78f27vD/NsLnxjh3s6EPLDeoinJRyBzM\n3dE9eW8vbQd/sSybY2KMHHNq2HHfy0l48NfC1qqUb6/Ym0IpAsnwItE31YG+HSPW\n+ZZgmygF9iVCwRrahhUcFE4pVHRFRXbD15oEdNio+IZ605WyJAvwnUscSQKBgQC2\nDEMhJQiJ6ZJthtWsW1pzy/l/46ZAXGoX7e3pexR3MVkHSc7Ngg3QTzgkhsjghD+c\nawN/IV6myrTDFv9UL4uFfBBE2E1TjYck4uitXdkSxte+Y9yNstESkLxOWogAekq0\nMN66cm4baPs/gdHhkVzN7XnYf0lD6/xi2F6snkQU8QKBgQCPLHngAj2dN9FyOHWn\nx23aS7BLQlI8EYYeDzjjS4DOFdt62wHznnvS0CSrmfjUqXhB7xh9FcPUzo/frueY\nXXq/eba0cRPNhnYQcsGgWyYMgyBV/Srux9AnRQm05gZcx/7pNSL7EvU/LTyUX9DO\n+CK8tOAOaDcZlcUxaLttsivXyw==\n-----END PRIVATE KEY-----\", \"client_email\": \"agronex-ai-api@agronex-498111.iam.gserviceaccount.com\", \"client_id\": \"113925485832366054310\", \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\", \"token_uri\": \"https://oauth2.googleapis.com/token\", \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\", \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/agronex-ai-api%40agronex-498111.iam.gserviceaccount.com\", \"universe_domain\": \"googleapis.com\"}'\'' >> /app/apps/agronex-ai-api/.env.production' >> entrypoint.sh && \
    echo 'exec node /app/server.js' >> entrypoint.sh && \
    chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
