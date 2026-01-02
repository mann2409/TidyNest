import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getBearer(req: Request) {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

Deno.serve(async (req) => {
  const token = getBearer(req);
  if (!token) return Response.json({ error: "Missing Bearer token" }, { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const url = new URL(req.url);

  if (req.method === "GET") {
    const { data, error } = await supabase.from("containers").select("*").order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ data });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (!body.name) return Response.json({ error: "name required" }, { status: 400 });

    // user_id is set by client, but RLS enforces auth.uid() = user_id.
    // Better: fetch user id from JWT and set it server-side:
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) return Response.json({ error: "Invalid token" }, { status: 401 });

    const { data, error } = await supabase.from("containers").insert({ name: body.name, user_id: userId }).select("*").single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ data });
  }

  if (req.method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { data, error } = await supabase.from("containers").update(body).eq("id", id).select("*").single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ data });
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("containers").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
