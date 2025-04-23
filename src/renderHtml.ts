export function renderHtml(content: string, origin: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Short URL D1</title>
        <link rel="stylesheet" href="https://static.integrations.cloudflare.com/styles.css" />
      </head>
      <body>
        <header>
          <img
            src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public"
          />
          <h1>🔗 Short URL D1 Demo</h1>
        </header>
        <main>
          <h2>📘 How to Use</h2>
          <p><strong>POST /</strong> with JSON body <code>{"url": "https://..."}</code> to create a short link.</p>
          <p><strong>GET /:code</strong> to redirect to the original long URL.</p>
          <p><strong>GET /</strong> to view recent entries from the DB.</p>
          
          <h3>🗂 Recent Short Links (first 5 rows)</h3>
          <pre><code>${content}</code></pre>

          <small class="blue">
            <a target="_blank" href="https://developers.cloudflare.com/d1/">Powered by Cloudflare D1</a>
          </small>
        </main>
      </body>
    </html>
  `;
}
