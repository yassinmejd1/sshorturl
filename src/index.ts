const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or use "https://avshort.com" for stricter security
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(resp: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    resp.headers.set(key, value);
  }
  return resp;
}

function renderHtml(content: string, origin: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Short URL API</title>
        <link rel="stylesheet" href="https://static.integrations.cloudflare.com/styles.css" />
      </head>
      <body>
        <header>
          <img src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public" />
          <h1>🔗 Short URL API</h1>
        </header>
        <main>
          <section>
            <h2>📘 How to Use</h2>
            <p>This is a simple API to generate and access short URLs.</p>

            <h3>1️⃣ Create a Short URL</h3>
            <pre><code>POST /</code></pre>
            <p><strong>Body:</strong> JSON with a <code>url</code> field.</p>
            <pre><code>{
  "url": "https://example.com"
}</code></pre>
            <p><strong>Example curl:</strong></p>
            <pre><code>curl -X POST ${origin}/ \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com"}'</code></pre>

            <h3>2️⃣ Redirect to Original URL</h3>
            <pre><code>GET /:code</code></pre>
            <p>Example: <code>${origin}/abc123</code> will redirect to your original URL.</p>

            <h3>3️⃣ View Demo Output</h3>
            <p>Visit <code>/</code> (this page) to view example rows from the database.</p>
          </section>

          <hr />

          <section>
            <h2>🗂 Recent Short Links (first 5 rows)</h2>
            <pre><code>${content}</code></pre>
          </section>
        </main>
      </body>
    </html>
  `;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    // ✅ CORS Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 🔗 POST / => Create short URL
    if (request.method === "POST" && path === "") {
      try {
        const { url: longUrl } = await request.json();

        if (!longUrl || !longUrl.startsWith("http")) {
          return withCors(new Response("Invalid URL", { status: 400 }));
        }

        const code = Math.random().toString(36).substring(2, 8);
        await env.DB.prepare("INSERT INTO urls (code, long_url) VALUES (?, ?)")
          .bind(code, longUrl)
          .run();

        const shortUrl = `https://avshort.com/${code}`;
        return withCors(Response.json({ success: true, short: shortUrl }));
      } catch (err: any) {
        return withCors(new Response("Error: " + err.message, { status: 500 }));
      }
    }

    // 🏠 GET / => Render homepage with examples
    if (request.method === "GET" && path === "") {
      const { results } = await env.DB.prepare("SELECT * FROM urls LIMIT 5").all();
      return withCors(new Response(renderHtml(JSON.stringify(results, null, 2), url.origin), {
        headers: { "content-type": "text/html" },
      }));
    }

    // 🚀 GET /:code => Redirect to original URL
    if (request.method === "GET") {
      const stmt = await env.DB.prepare("SELECT long_url FROM urls WHERE code = ?")
        .bind(path)
        .first();

      if (stmt) {
        return Response.redirect(stmt.long_url, 302);
      } else {
        return withCors(new Response("Short URL not found", { status: 404 }));
      }
    }

    // ❌ Fallback Not Found
    return withCors(new Response("Not Found", { status: 404 }));
  }
};
