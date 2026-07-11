import { Database } from "bun:sqlite";

const db = new Database("shield.db");
db.run("CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, score INTEGER, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

const PORT = 3000;

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/scan" && req.method === "POST") {
      const { url: target } = await req.json();
      try {
        const domain = new URL(target.startsWith("http") ? target : `https://${target}`).hostname;
        const res = await fetch(`https://${domain}`, { method: 'HEAD' });
        const h = res.headers;

        const checks = [
          { name: "HSTS", pass: h.has('strict-transport-security') },
          { name: "CSP", pass: h.has('content-security-policy') },
          { name: "X-Frame", pass: h.has('x-frame-options') }
        ];

        const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
        db.run("INSERT INTO scans (domain, score, details) VALUES (?, ?, ?)", [domain, score, JSON.stringify(checks)]);

        return new Response(JSON.stringify({ score, checks }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Inaccessible" }), { status: 400 });
      }
    }

    if (url.pathname === "/api/history") {
      const history = db.query("SELECT * FROM scans ORDER BY timestamp DESC LIMIT 5").all();
      return new Response(JSON.stringify(history), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(`
      <!DOCTYPE html>
      <html class="bg-black text-white">
      <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .hidden-panel { display: none; }
          </style>
      </head>
      <body class="font-sans antialiased">
        
        <div id="landing" class="h-screen flex flex-col justify-center items-center p-8">
            <h1 class="text-6xl font-bold tracking-tighter mb-6">SHIELD AUDIT</h1>
            <p class="text-gray-400 mb-12 text-lg">Sécurité web. Transparence totale. Analyse immédiate.</p>
            <button onclick="demarrer()" class="px-8 py-3 bg-white text-black font-bold hover:bg-gray-200 transition-colors">Démarrer l'audit</button>
        </div>

        <div id="dashboard" class="hidden-panel max-w-2xl mx-auto p-12">
            <h2 class="text-2xl font-bold mb-8">Nouveau Scan</h2>
            <div class="flex gap-4 mb-8">
                <input id="url" class="flex-1 bg-transparent border-b border-gray-700 p-2 focus:outline-none" placeholder="Entrez un domaine...">
                <button onclick="scan()" id="btn" class="border border-white px-6 py-2 hover:bg-white hover:text-black transition-all">Scanner</button>
            </div>
            <div id="results" class="space-y-6"></div>
            <div id="history" class="mt-16 space-y-4"></div>
        </div>

        <script>
          function demarrer() {
            document.getElementById('landing').classList.add('hidden-panel');
            document.getElementById('dashboard').classList.remove('hidden-panel');
            loadHistory();
          }

          async function scan() {
            const b = document.getElementById('btn');
            b.innerText = "Analyse...";
            const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url: document.getElementById('url').value }) });
            const data = await res.json();
            b.innerText = "Scanner";
            
            const resDiv = document.getElementById('results');
            resDiv.innerHTML = \`<div class="text-4xl font-black mb-6">\${data.score}%</div>\`;
            data.checks.forEach(c => {
                resDiv.innerHTML += \`<div class="flex justify-between border-b border-gray-800 pb-2">
                    <span class="text-gray-400">\${c.name}</span>
                    <span class="\${c.pass ? 'text-white' : 'text-gray-600'}">\${c.pass ? 'ACTIF' : 'INACTIF'}</span>
                </div>\`;
            });
            loadHistory();
          }

          async function loadHistory() {
            const res = await fetch('/api/history');
            const data = await res.json();
            document.getElementById('history').innerHTML = '<h3 class="text-gray-500 text-sm uppercase">Historique récent</h3>' + 
                data.map(h => \`<div class="flex justify-between py-2 border-b border-gray-900 text-sm"><span>\${h.domain}</span><span>\${h.score}%</span></div>\`).join('');
          }
        </script>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});