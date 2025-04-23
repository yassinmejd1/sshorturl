import { renderHtml } from "./renderHtml";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    if (request.method === "POST" && path === "") {
      try {
        const { url: longUrl } = await request.json();

        if (!longUrl || !longUrl.startsWith("http")) {
          return new Response("Invalid URL", { status: 400 });
        }

        const code = Math.random().toString(36).substring(2, 8);
        await env.DB.prepare("INSERT INTO urls (code, long_url) VALUES (?, ?)")
          .bind(code, longUrl)
          .run();

        const shortUrl = `${url.origin}/${code}`;
        return Response.json({ success: true, short: shortUrl });
      } catch (err: any) {
        return new Response("Error: " + err.message, { status: 500 });
      }
    }

    if (request.method === "GET" && path === "") {
      const { results } = await env.DB.prepare("SELECT * FROM urls LIMIT 5").all();
      return new Response(renderHtml(JSON.stringify(results, null, 2), url.origin), {
        headers: { "content-type": "text/html" },
      });
    }

    if (request.method === "GET") {
      const stmt = await env.DB.prepare("SELECT long_url FROM urls WHERE code = ?")
        .bind(path)
        .first();

      if (stmt) {
        return Response.redirect(stmt.long_url, 302);
      } else {
        return new Response("Short URL not found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
