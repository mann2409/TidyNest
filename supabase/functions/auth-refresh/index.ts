import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { refreshToken } = await req.json().catch(() => ({}));
  if (!refreshToken) return Response.json({ error: "refreshToken required" }, { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) return Response.json({ error: error.message }, { status: 401 });

  return Response.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});
