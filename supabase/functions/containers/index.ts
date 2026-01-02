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
    if (!body.code) return Response.json({ error: "code required" }, { status: 400 });

    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) return Response.json({ error: "Invalid token" }, { status: 401 });

    const { data, error } = await supabase.from("containers").upsert({
      id: body.id,
      user_id: userId,
      code: body.code,
      location_id: body.locationId,
      category: body.category,
      description: body.description,
      photo_url: body.photoUrl,
      updated_at: new Date().toISOString(),
    }).select("*").single();

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ data });
  }

  // ... other methods ...
  return new Response("Method Not Allowed", { status: 405 });
});
