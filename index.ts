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
          { name: "HSTS", pass: h.has('strict-transport-security'), tip: "Activez HSTS." },
          { name: "CSP", pass: h.has('content-security-policy'), tip: "Définissez une CSP." },
          { name: "X-Frame", pass: h.has('x-frame-options'), tip: "Utilisez X-Frame-Options." }
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
      </head>
      <body class="p-8"><div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-8 text-indigo-400">Shield Audit</h1>
        <div class="flex gap-2 mb-8">
            <input id="url" class="flex-1 bg-slate-900 p-3 rounded" placeholder="domaine.com">
            <button onclick="scan()" class="bg-indigo-600 px-6 py-3 rounded">Scanner</button>
        </div>
        <div id="dashboard" class="space-y-4"></div>
        <h2 class="mt-12 text-xl font-bold">Derniers scans</h2>
        <div id="history" class="mt-4 space-y-2"></div>
      </div>
      <script>
        async function scan() {
            const url = document.getElementById('url').value;
            const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url }) });
            const data = await res.json();
            const dash = document.getElementById('dashboard');
            dash.innerHTML = '<div class="p-4 bg-slate-900 rounded font-bold">Score: '+data.score+'%</div>';
            data.checks.forEach(c => {
                dash.innerHTML += '<div class="p-4 bg-slate-800 rounded"><b>'+c.name+'</b>: '+(c.pass ? 'OUI' : 'NON - '+c.tip)+'</div>';
            });
            loadHistory();
        }
        async function loadHistory() {
            const res = await fetch('/api/history');
            const data = await res.json();
            document.getElementById('history').innerHTML = data.map(h => '<div class="p-2 bg-slate-900 text-xs">'+h.domain+' - Score: '+h.score+'%</div>').join('');
        }
        loadHistory();
      </script></body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});