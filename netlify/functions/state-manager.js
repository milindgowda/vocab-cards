import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // 1. Handle CORS Preflight checks cleanly
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST"
      }
    });
  }

  // 2. Parse out the unique User Profile ID securely
  const url = new URL(req.url);
  const userKey = url.searchParams.get("user") || "default_user";
  const store = getStore("gre_vocabulary_states");

  // 3. GET Method: Retrieve data blocks from Netlify Blobs storage
  if (req.method === "GET") {
    try {
      const savedState = await store.get(userKey, { type: "json" });
      return new Response(JSON.stringify(savedState || { scores: {} }), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // 4. POST Method: Store progress matrix parameters inside Netlify Blobs storage
  if (req.method === "POST") {
    try {
      const body = await req.json();
      await store.setJSON(userKey, {
        scores: body.scores || {},
        updated_at: new Date().toISOString()
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
