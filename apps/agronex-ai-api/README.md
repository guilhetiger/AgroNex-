# AgroNex AI API

Next.js 14 API service that powers AgroNex AI features:
- Context-aware chat
- Intelligent reports + PDF export
- Anomaly detection
- Expense OCR parsing
- Dashboard synthesis

## Requirements

- Node.js 18+
- Supabase project with `supabase/schema.sql` and `supabase/ai_schema.sql` applied
- OpenAI API key

## Environment

Copy `.env.example` to `.env.local` and set values.

## Run

```bash
npm install
npm run dev
```

API health check:

```bash
GET /api/health
```

All AI routes require a Supabase JWT in the `Authorization: Bearer <token>` header.
# AgroNex AI API

Backend Next.js para chat, reportes, anomalías, predicciones y OCR.

## Variables (.env.local)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # opcional
```

## Desarrollo

```bash
npm install
npm run dev
```

## Seguridad

- OpenAI solo en servidor.
- Supabase con JWT del usuario (RLS).
- No usar service_role para lecturas de negocio.
