const PORT = 3000;

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(request) {
    const url = new URL(request.url);

    // 1. API DE SCAN (PRÉPARÉ POUR L'OPTION A)
    if (url.pathname === "/api/scan" && request.method === "POST") {
      const body = await request.json();
      // Simulation d'une analyse réelle
      return new Response(JSON.stringify({
        hsts: true,
        csp: false,
        score: 66
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 2. PAGE PRINCIPALE (DESIGN PREMIUM)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <title>Shield Conformité Premium</title>
      </head>
      <body class="bg-slate-950 text-white min-h-screen p-8">
          <div class="max-w-3xl mx-auto">
              <h1 class="text-3xl font-bold mb-8 text-center text-indigo-400">Shield Conformité Premium</h1>
              
              <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl mb-6">
                  <div class="flex justify-between items-center mb-4">
                      <span>Score global</span>
                      <span id="scoreText" class="text-2xl font-bold text-indigo-400">0%</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-4">
                      <div id="scoreBar" class="bg-indigo-600 h-4 rounded-full transition-all duration-1000" style="width: 0%"></div>
                  </div>
              </div>

              <div class="flex gap-2 mb-8">
                  <input id="url" class="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-700" placeholder="ex: google.fr">
                  <button onclick="lancerScan()" id="btnScan" class="bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-500 transition-all">Scanner</button>
              </div>

              <div id="resultats" class="space-y-4"></div>
          </div>

          <script>
              async function lancerScan() {
                  const btn = document.getElementById('btnScan');
                  const url = document.getElementById('url').value;
                  btn.disabled = true;
                  btn.innerText = "Analyse en cours...";
                  
                  const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url }) });
                  const data = await res.json();
                  
                  // Animation score
                  document.getElementById('scoreBar').style.width = data.score + "%";
                  document.getElementById('scoreText').innerText = data.score + "%";
                  
                  // Affichage contrôles
                  document.getElementById('resultats').innerHTML = \`
                    <div class="p-4 bg-slate-900 rounded-lg flex justify-between border border-slate-800">
                        <span>HSTS (Sécurité SSL)</span>
                        <span class="\${data.hsts ? 'text-emerald-400' : 'text-red-400'} font-bold">\${data.hsts ? 'CONFORME' : 'NON CONFORME'}</span>
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

console.log(`📡 Serveur actif sur le port : ${PORT}`);