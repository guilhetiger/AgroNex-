import { createUserSupabaseClient } from "@/lib/supabase/server";

export type VerifiedRequest = {
  accessToken: string;
  user: {
    id: string;
    email?: string;
  };
  supabase: ReturnType<typeof createUserSupabaseClient>;
};

export async function verifyRequest(request: Request): Promise<VerifiedRequest> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    throw jsonResponse({ error: "Missing bearer token." }, 401);
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    throw jsonResponse({ error: "Invalid bearer token." }, 401);
  }

  const supabase = createUserSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw jsonResponse({ error: "Invalid or expired token." }, 401);
  }

  return {
    accessToken,
    user: {
      id: data.user.id,
      email: data.user.email ?? undefined
    },
    supabase
  };
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
