import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getBearer(req: Request) {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const token = getBearer(req);
  if (!token) return Response.json({ error: "Missing Bearer token" }, { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // IMPORTANT: pass the user's JWT so auth + RLS work
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return Response.json({ error: error.message }, { status: 401 });

  return Response.json({ user: data.user });
});
