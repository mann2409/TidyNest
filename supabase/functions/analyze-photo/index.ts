import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    const { imageBase64, categoryList } = await req.json();

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_key_here') {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this storage box contents. Identify the specific items inside. List them with a name and 2-3 relevant tags. Also suggest 5-10 overall keywords for the box. Then suggest ONE category from this list: ${categoryList}. Respond ONLY in this JSON format: {"items": [{"name": "Item Name", "tags": ["tag1", "tag2"]}], "keywords": ["keyword1", "keyword2"], "category": "CATEGORY"}`
            },
            { 
              type: 'image_url', 
              image_url: {
                url: imageBase64
              }
            },
          ],
        }],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'OpenAI API error' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const outputText = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(outputText);

    return new Response(
      JSON.stringify(parsed),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
