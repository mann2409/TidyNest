import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: "email and password required" }, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // data.session can be null if email confirmations are on
  return Response.json({
    accessToken: data.session?.access_token ?? null,
    refreshToken: data.session?.refresh_token ?? null,
    user: data.user,
  });
});
