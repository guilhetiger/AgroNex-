# AgroNex AI API

Next.js 14 API service that powers AgroNex AI features:
- Context-aware chat
- Intelligent reports + PDF export
- Anomaly detection
- Expense OCR parsing
- Dashboard synthesis

## Requirements

- Node.js 18+ (20+ recommended for `@google/genai`)
- Supabase project with `supabase/schema.sql` and `supabase/ai_schema.sql` applied
- Google Cloud project with Vertex AI API enabled and a service account (or ADC)

## Environment

Copy `.env.example` to `.env.local` and set values.

Required for Vertex AI:
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION` (e.g. `us-central1`)
- `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON locally) or Application Default Credentials

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

## Security

- Vertex AI credentials only on the server (never in Expo).
- Supabase with user JWT (RLS).
- Do not use service_role for business reads.
