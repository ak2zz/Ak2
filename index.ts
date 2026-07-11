import { Database } from "bun:sqlite";

// Initialisation de la base SQLite
const db = new Database("shield.db");
db.run("CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, score INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

const PORT = 3000;

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(request) {
    const url = new URL(request.url);

    // 1. API DE SCAN + ENREGISTREMENT DB
    if (url.pathname === "/api/scan" && request.method === "POST") {
      try {
        const { url: targetUrl } = await request.json();
        const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
        const domain = new URL(formattedUrl).hostname;
        
        const response = await fetch(formattedUrl, { method: 'HEAD', redirect: 'follow' });
        const headers = response.headers;

        const hsts = headers.has('strict-transport-security');
        const csp = headers.has('content-security-policy');
        const xFrame = headers.has('x-frame-options');

        let score = (hsts ? 33 : 0) + (csp ? 34 : 0) + (xFrame ? 33 : 0);

        // Sauvegarde dans SQLite
        db.run("INSERT INTO scans (domain, score) VALUES (?, ?)", [domain, score]);

        return new Response(JSON.stringify({ hsts, csp, xFrame, score }), { 
          headers: { "Content-Type": "application/json" } 
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Scan impossible" }), { status: 500 });
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
      <body class="bg-slate-950 text-white min-h-screen p-8">
          <div class="max-w-3xl mx-auto">
              <h1 class="text-3xl font-bold mb-8 text-center text-indigo-400">Shield Conformité</h1>
              
              <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-6">
                  <div class="flex justify-between mb-4">
                      <span>Score global</span>
                      <span id="scoreText" class="text-2xl font-bold text-indigo-400">0%</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-4">
                      <div id="scoreBar" class="bg-indigo-600 h-4 rounded-full transition-all duration-1000" style="width: 0%"></div>
                  </div>
              </div>

              <div class="flex gap-2 mb-8">
                  <input id="url" class="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-700" placeholder="ex: google.com">
                  <button onclick="lancerScan()" id="btnScan" class="bg-indigo-600 px-6 py-3 rounded-lg">Scanner</button>
              </div>

              <div id="resultats" class="space-y-4"></div>
          </div>

          <script>
              async function lancerScan() {
                  const url = document.getElementById('url').value;
                  const btn = document.getElementById('btnScan');
                  btn.disabled = true;
                  btn.innerText = "Analyse...";
                  
                  const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url }) });
                  const data = await res.json();
                  
                  document.getElementById('scoreBar').style.width = data.score + "%";
                  document.getElementById('scoreText').innerText = data.score + "%";
                  
                  document.getElementById('resultats').innerHTML = \`
                    <div class="p-4 bg-slate-900 rounded-lg flex justify-between border border-slate-800">
                        <span>HSTS (SSL)</span>
                        <span class="\${data.hsts ? 'text-emerald-400' : 'text-red-400'} font-bold">\${data.hsts ? 'OUI' : 'NON'}</span>
                    </div>
                  \`;
                  btn.disabled = false;
                  btn.innerText = "Scanner";
              }
          </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  },
});