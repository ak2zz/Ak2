import { Database } from "bun:sqlite";

const db = new Database("shield.db");
db.run("CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, score INTEGER, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

const PORT = 3000;

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    // API pour scanner
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
      } catch (e) { return new Response(JSON.stringify({ error: "Inaccessible" }), { status: 400 }); }
    }

    if (url.pathname === "/api/history") {
      return new Response(JSON.stringify(db.query("SELECT * FROM scans ORDER BY timestamp DESC LIMIT 5").all()), { headers: { "Content-Type": "application/json" } });
    }

    // PAGE PRINCIPALE
    return new Response(`
      <!DOCTYPE html>
      <html class="bg-black text-white">
      <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .grid-bg { background-image: linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px); background-size: 40px 40px; }
            .fade-in { animation: fadeIn 0.8s ease-out forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          </style>
      </head>
      <body class="grid-bg min-h-screen">
        
        <div id="view-home" class="h-screen flex flex-col justify-center items-center p-8 fade-in">
            <h1 class="text-7xl font-black tracking-tighter mb-6">SHIELD AUDIT</h1>
            <p class="text-gray-500 mb-12">Sécurité web. Transparence totale.</p>
            <button onclick="nav('view-scan')" class="border border-white px-8 py-3 hover:bg-white hover:text-black transition-all">Démarrer l'audit</button>
        </div>

        <div id="view-scan" class="hidden min-h-screen p-12 fade-in">
            <h2 class="text-3xl font-bold mb-12">Scanner un domaine</h2>
            <div class="flex gap-4 mb-12 max-w-xl">
                <input id="url" class="flex-1 bg-transparent border-b border-gray-700 p-2 focus:outline-none" placeholder="ex: google.com">
                <button onclick="scan()" class="border border-white px-6 py-2">Scanner</button>
            </div>
            <div id="results" class="space-y-4 max-w-xl"></div>
        </div>

        <script>
          function nav(id) {
            document.getElementById('view-home').classList.add('hidden');
            document.getElementById('view-scan').classList.remove('hidden');
          }
          async function scan() {
            const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url: document.getElementById('url').value }) });
            const data = await res.json();
            const resDiv = document.getElementById('results');
            resDiv.innerHTML = '<div class="text-5xl font-black mb-8">' + data.score + '%</div>';
            data.checks.forEach(c => {
                resDiv.innerHTML += '<div class="flex justify-between border-b border-gray-800 pb-2"><span>'+c.name+'</span><span>'+(c.pass ? 'ACTIF' : 'INACTIF')+'</span></div>';
            });
          }
        </script>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});