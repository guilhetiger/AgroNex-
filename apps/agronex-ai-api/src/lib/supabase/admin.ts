import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/** Reservado para tareas admin (p. ej. storage). NO usar para leer datos de negocio. */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return adminClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  const client = createAdminClient();
  if (!client) {
    throw new Error("Missing Supabase URL or service role key env vars.");
  }
  return client;
}
