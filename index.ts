const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // 🌐 1. API DU SCANNER INTELLIGENT
    if (url.pathname === "/api/scan" && request.method === "POST") {
      try {
        const body = await request.json() as { url: string };
        let targetUrl = body.url?.trim();

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: "Veuillez entrer une adresse valide." }), { status: 400 });
        }

        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = "https://" + targetUrl;
        }

        const isHttps = targetUrl.startsWith("https://");
        let isOnline = false;
        let secureHeaders = false;

        try {
          const response = await fetch(targetUrl, { 
            method: "GET", 
            headers: { "User-Agent": "ShieldConformiteScanner/1.0" },
            signal: AbortSignal.timeout(4000) 
          });
          
          isOnline = response.ok || response.status < 500;
          secureHeaders = response.headers.has("strict-transport-security") || 
                          response.headers.has("x-frame-options") || 
                          response.headers.has("content-security-policy");
        } catch (e) {
          try {
            const fallbackUrl = targetUrl.replace("https://", "http://");
            const response = await fetch(fallbackUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
            isOnline = response.ok || response.status < 500;
          } catch(err) { isOnline = false; }
        }

        let score = 20;
        if (isOnline) score += 20;
        if (isHttps) score += 30;
        if (secureHeaders) score += 30;

        return new Response(JSON.stringify({
          success: true,
          score: score,
          isOnline: isOnline,
          isHttps: isHttps,
          secureHeaders: secureHeaders,
          domain: new URL(targetUrl).hostname
        }), { headers: { "Content-Type": "application/json" } });

      } catch (err) {
        return new Response(JSON.stringify({ error: "Impossible d'analyser ce site." }), { status: 500 });
      }
    }

    // 📄 2. LANDING PAGE PREMIUM
    if (url.pathname === "/") {
      return new Response(`
      <!DOCTYPE html>
      <html lang="fr" class="scroll-smooth">
      <head>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
          <style>
              .grid-bg { background-image: linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px); background-size: 4rem 4rem; }
              .btn-click { transition: transform 0.1s; }
              .btn-click:active { transform: scale(0.95); }
          </style>
      </head>
      <body class="bg-slate-950 text-slate-100 font-sans min-h-screen grid-bg">

          <nav class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4">
              <div class="max-w-6xl mx-auto flex justify-between items-center">
                  <span class="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">🛡️ Shield Conformité</span>
              </div>
          </nav>

          <section id="hero" class="max-w-4xl mx-auto pt-20 pb-16 px-6 text-center space-y-8">
              <h2 data-aos="fade-up" class="text-5xl md:text-6xl font-black tracking-tight">Protégez vos actifs <br><span class="text-indigo-400">numériques</span></h2>
              
              <div data-aos="zoom-in" class="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
                  <div class="flex justify-between items-center">
                      <h3 class="font-bold">Score de Conformité</h3>
                      <span id="score-text" class="text-4xl font-black text-indigo-400">0%</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-3 border border-slate-800">
                      <div id="score-bar" class="bg-indigo-500 h-3 rounded-full transition-all duration-700" style="width: 0%"></div>
                  </div>
                  <div class="flex gap-3">
                      <input type="text" id="url-input" placeholder="domaine.com" class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-indigo-500">
                      <button id="scan-button" onclick="executeAdvancedScan()" class="btn-click bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all">Analyser</button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                      <div class="p-3 bg-slate-950/40 rounded-xl"><p class="text-[10px] text-slate-400 uppercase">Serveur</p><p id="status-label" class="font-bold text-slate-300">---</p></div>
                      <div class="p-3 bg-slate-950/40 rounded-xl"><p class="text-[10px] text-slate-400 uppercase">SSL</p><p id="ssl-label" class="font-bold text-slate-300">---</p></div>
                      <div class="p-3 bg-slate-950/40 rounded-xl"><p class="text-[10px] text-slate-400 uppercase">Headers</p><p id="headers-label" class="font-bold text-slate-300">---</p></div>
                  </div>
              </div>
          </section>

          <script src="https://unpkg.com/aos@next/dist/aos.js"></script>
          <script>
              AOS.init({ once: false });
              async function executeAdvancedScan() {
                  const input = document.getElementById('url-input');
                  const btn = document.getElementById('scan-button');
                  btn.innerText = "Analyse...";
                  
                  const res = await fetch('/api/scan', { 
                    method: 'POST', 
                    body: JSON.stringify({ url: input.value }) 
                  });
                  const data = await res.json();
                  
                  document.getElementById('score-text').innerText = data.score + "%";
                  document.getElementById('score-bar').style.width = data.score + "%";
                  document.getElementById('status-label').innerText = data.isOnline ? "EN LIGNE" : "ÉCHEC";
                  document.getElementById('ssl-label').innerText = data.isHttps ? "HTTPS" : "HTTP";
                  document.getElementById('headers-label').innerText = data.secureHeaders ? "OK" : "MANQUANT";
                  btn.innerText = "Analyser";
              }
          </script>
      </body>
      </html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("🚀 Serveur en ligne");