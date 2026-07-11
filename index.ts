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
          { name: "HSTS", pass: h.has('strict-transport-security'), tip: "Activez HSTS pour sécuriser la connexion." },
          { name: "CSP", pass: h.has('content-security-policy'), tip: "Ajoutez une politique CSP contre les XSS." },
          { name: "X-Frame", pass: h.has('x-frame-options'), tip: "Protégez-vous du clickjacking." }
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
      <html class="bg-slate-950 text-white">
      <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); }
          </style>
      </head>
      <body class="p-8 font-sans">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-4xl font-extrabold mb-10 text-center bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Shield Audit</h1>
          
          <div class="flex gap-2 mb-10">
            <input id="url" class="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: google.com">
            <button onclick="scan()" id="btn" class="bg-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all">Scanner</button>
          </div>

          <div id="dashboard" class="space-y-4"></div>
          <h2 class="mt-12 text-lg font-bold text-slate-400">Historique</h2>
          <div id="history" class="mt-4 space-y-2"></div>
        </div>

        <script>
          async function scan() {
            const b = document.getElementById('btn');
            b.innerText = "Analyse...";
            const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url: document.getElementById('url').value }) });
            const data = await res.json();
            b.innerText = "Scanner";
            
            const dash = document.getElementById('dashboard');
            dash.innerHTML = \`<div class="glass p-6 rounded-2xl border border-slate-700 flex justify-between items-center">
                <span class="text-xl font-bold">Score global</span>
                <span class="text-3xl font-black text-blue-400">\${data.score}%</span>
            </div>\`;
            data.checks.forEach(c => {
                dash.innerHTML += \`<div class="glass p-4 rounded-xl border border-slate-800 flex justify-between">
                    <span>\${c.name}</span>
                    <span class="\${c.pass ? 'text-green-400' : 'text-red-400'} font-bold">\${c.pass ? 'OUI' : 'NON'}</span>
                </div>\`;
            });
            loadHistory();
          }
          async function loadHistory() {
            const res = await fetch('/api/history');
            const data = await res.json();
            document.getElementById('history').innerHTML = data.map(h => \`<div class="glass p-3 rounded-lg text-sm flex justify-between">
                <span>\${h.domain}</span><span class="font-bold">\${h.score}%</span>
            </div>\`).join('');
          }
          loadHistory();
        </script>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});