import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  console.log(`[STATE-MANAGER] Incoming Request Method: ${req.method}`);
  
  // 1. Handle CORS Preflight check options mappings
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    });
  }

  try {
    const url = new URL(req.url);
    const userKey = url.searchParams.get("user") || "default_user";
    console.log(`[STATE-MANAGER] Target User Profile Key ID: "${userKey}"`);
    
    // Initialize Netlify Blobs Key-Value Store interface connection rules
    const store = getStore("gre_vocabulary_states");

    // 2. GET Method: Retrieve data blocks from Netlify Blobs storage
    if (req.method === "GET") {
      console.log(`[STATE-MANAGER] Fetching state parameters out of cloud store...`);
      const savedState = await store.get(userKey, { type: "json" });
      console.log(`[STATE-MANAGER] Found Cloud State Data:`, savedState);
      
      return new Response(JSON.stringify(savedState || { scores: {} }), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    // 3. POST Method: Store progress matrix parameters inside Netlify Blobs storage
    if (req.method === "POST") {
      const rawText = await req.text();
      console.log(`[STATE-MANAGER] Raw Staging Body Received:`, rawText);
      
      let body;
      try {
        body = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error(`[STATE-MANAGER] JSON Parse Internal Error:`, jsonErr);
        return new Response(JSON.stringify({ error: "Invalid JSON input text body payload" }), { status: 400 });
      }

      console.log(`[STATE-MANAGER] Writing progress parameters into Cloud Blobs Store...`);
      await store.setJSON(userKey, {
        scores: body.scores || {},
        updated_at: new Date().toISOString()
      });
      console.log(`[STATE-MANAGER] Cloud Storage Write Process Completed successfully.`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    return new Response("Method Not Allowed", { status: 405 });

  } catch (globalErr) {
    console.error(`[STATE-MANAGER] CRITICAL SYSTEM LAYER EXCEPTION FLAGGED:`, globalErr);
    return new Response(JSON.stringify({ 
      error: "Internal Server Exception Trace", 
      details: globalErr.message,
      stack: globalErr.stack 
    }), { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
    });
  }
};
