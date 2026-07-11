import { Database } from "bun:sqlite";

const db = new Database("shield.db");
db.run("CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, score INTEGER, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    // API SCAN
    if (url.pathname === "/api/scan" && req.method === "POST") {
      try {
        const { url: target } = await req.json();
        const hostname = new URL(target.startsWith("http") ? target : `https://${target}`).hostname;
        
        // Timeout rapide pour le scan
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(`https://${hostname}`, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        
        const h = res.headers;
        const checks = [
          { name: "HSTS", pass: h.has('strict-transport-security') },
          { name: "CSP", pass: h.has('content-security-policy') },
          { name: "X-Frame", pass: h.has('x-frame-options') },
          { name: "X-Content-Type", pass: h.has('x-content-type-options') }
        ];
        
        const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
        db.run("INSERT INTO scans (domain, score, details) VALUES (?, ?, ?)", [hostname, score, JSON.stringify(checks)]);
        
        return new Response(JSON.stringify({ hostname, score, checks }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Domaine inaccessible" }), { status: 400 });
      }
    }

    // INTERFACE
    return new Response(`
      <!DOCTYPE html>
      <html class="bg-[#050505] text-white">
      <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .grid-lines { background-image: linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px); background-size: 50px 50px; }
            .glow { box-shadow: 0 0 20px rgba(79, 70, 229, 0.2); }
            @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .animate-pulse-slow { animation: pulse-slow 3s infinite; }
          </style>
      </head>
      <body class="grid-lines min-h-screen font-sans">
        <div id="app" class="max-w-3xl mx-auto pt-20 px-6">
            <header class="mb-16">
                <h1 class="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">SHIELD AUDIT</h1>
                <p class="text-gray-500 mt-2 italic">Analyse de posture de sécurité en temps réel</p>
            </header>

            <div class="bg-[#0a0a0a] border border-gray-800 p-8 rounded-2xl glow">
                <div class="flex gap-4">
                    <input id="domain" class="flex-1 bg-transparent border-b border-gray-700 focus:border-indigo-500 outline-none pb-2 transition-all" placeholder="exemple.com">
                    <button onclick="startScan()" id="btn" class="bg-indigo-600 px-8 py-2 rounded-lg font-bold hover:bg-indigo-500 transition-all">Scanner</button>
                </div>
                <div id="result" class="mt-8 space-y-6"></div>
            </div>
        </div>

        <script>
          async function startScan() {
            const btn = document.getElementById('btn');
            const resDiv = document.getElementById('result');
            btn.innerText = 'Analyse...'; btn.disabled = true;
            
            const r = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url: document.getElementById('domain').value }) });
            const data = await r.json();
            
            if(data.error) { resDiv.innerHTML = '<p class="text-red-500">Erreur : ' + data.error + '</p>'; }
            else {
                resDiv.innerHTML = \`
                    <div class="flex justify-between items-end">
                        <span class="text-sm text-gray-400">Score de conformité</span>
                        <span class="text-4xl font-black">\${data.score}%</span>
                    </div>
                    <div class="h-2 bg-gray-800 rounded-full overflow-hidden"><div class="h-full bg-indigo-500 transition-all duration-1000" style="width: \${data.score}%"></div></div>
                    <div class="grid grid-cols-2 gap-4 pt-4">
                        \${data.checks.map(c => \`
                            <div class="p-4 bg-[#111] rounded-lg border border-gray-800">
                                <div class="text-xs text-gray-500 uppercase">\${c.name}</div>
                                <div class="font-bold \${c.pass ? 'text-green-500' : 'text-red-500'}">\${c.pass ? 'ACTIF' : 'INACTIF'}</div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            }
            btn.innerText = 'Scanner'; btn.disabled = false;
          }
        </script>
      </body></html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});