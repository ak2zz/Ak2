const PORT = parseInt(process.env.PORT || "3000");

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(request) {
    const url = new URL(request.url);

    // 1. API DE SCAN
    if (url.pathname === "/api/scan" && request.method === "POST") {
      try {
        const body = await request.json();
        let targetUrl = body.url.trim();
        if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

        const response = await fetch(targetUrl, { 
          method: "GET", 
          headers: { "User-Agent": "ShieldConformite/1.0" },
          signal: AbortSignal.timeout(4000) 
        });
        
        return new Response(JSON.stringify({
          success: true,
          score: response.ok ? 85 : 40,
          domain: new URL(targetUrl).hostname
        }), { headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Scan échoué" }), { status: 500 });
      }
    }

    // 2. PAGE PRINCIPALE
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
          <div class="p-8 bg-slate-900 rounded-xl text-center">
              <h1 class="text-2xl font-bold mb-4">Shield Conformité</h1>
              <input id="url" class="text-black p-2 rounded" placeholder="google.fr">
              <button onclick="scan()" class="bg-indigo-600 px-4 py-2 rounded">Scanner</button>
              <div id="res" class="mt-4"></div>
          </div>
          <script>
              async function scan() {
                  const url = document.getElementById('url').value;
                  const res = await fetch('/api/scan', {
                      method: 'POST',
                      body: JSON.stringify({ url })
                  });
                  const data = await res.json();
                  document.getElementById('res').innerText = "Score: " + (data.score || "Erreur");
              }
          </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  },
});

console.log(`📡 Serveur actif sur le port : ${PORT}`);