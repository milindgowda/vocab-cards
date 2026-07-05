import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  // Handle CORS preflight options check safely
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST"
      }
    };
  }

  const userKey = event.queryStringParameters.user || "default_user";
  const store = getStore("gre_vocabulary_states");

  // GET Request: Load data out of cloud blobs
  if (event.httpMethod === "GET") {
    try {
      const savedState = await store.get(userKey, { type: "json" });
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify(savedState || { scores: {} })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST Request: Save data into cloud blobs
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      await store.setJSON(userKey, {
        scores: body.scores || {},
        updated_at: new Date().toISOString()
      });
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
