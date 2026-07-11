// On force le port 3000 car c'est celui que Railway utilise pour diriger le trafic vers ton service
const PORT = 3000;

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
          <title>Shield Conformité</title>
      </head>
      <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
          <div class="p-8 bg-slate-900 rounded-xl text-center shadow-2xl border border-slate-800">
              <h1 class="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Shield Conformité</h1>
              <div class="flex gap-2">
                  <input id="url" class="text-black p-2 rounded border border-slate-700 focus:outline-none" placeholder="google.fr">
                  <button onclick="scan()" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded transition-all">Scanner</button>
              </div>
              <div id="res" class="mt-4 text-slate-300 font-mono"></div>
          </div>
          <script>
              async function scan() {
                  const url = document.getElementById('url').value;
                  document.getElementById('res').innerText = "Analyse...";
                  try {
                      const res = await fetch('/api/scan', {
                          method: 'POST',
                          body: JSON.stringify({ url })
                      });
                      const data = await res.json();
                      document.getElementById('res').innerText = data.error ? "Erreur" : "Score: " + data.score + "%";
                  } catch(e) {
                      document.getElementById('res').innerText = "Erreur de connexion";
                  }
              }
          </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  },
});

console.log(`📡 Serveur actif sur le port : ${PORT}`);