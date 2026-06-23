import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseKey() {
  const b64Key = process.env.RAW_SUPABASE_KEY_B64;
  if (b64Key) {
    return Buffer.from(b64Key, "base64").toString("utf-8");
  }
  return process.env.SUPABASE_ANON_KEY || "";
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = getSupabaseKey();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or anon key env vars.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export type UserSupabaseClient = SupabaseClient;

export function createUserSupabaseClient(accessToken: string): UserSupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
