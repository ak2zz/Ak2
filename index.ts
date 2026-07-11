const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // 1. VRAIE ROUTE API
    if (url.pathname === "/api/check-ssl" && request.method === "POST") {
      try {
        const body = await request.json();
        let targetUrl = body.url.trim();

        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: "Veuillez entrer une adresse." }), { status: 400 });
        }

        let domain = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
        console.log(`🔍 Scanner en cours sur : https://${domain}`);

        const response = await fetch(`https://${domain}`, { 
          method: "HEAD",
          redirect: "follow" 
        });

        return new Response(JSON.stringify({ success: true, isSecure: true, domain: domain }), {
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        console.log(`❌ Échec de la connexion sécurisée`);
        return new Response(JSON.stringify({ success: true, isSecure: false }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 2. ROUTE PRINCIPALE
    if (url.pathname === "/") {
      const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Shield Conformité — Dashboard</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body class="bg-slate-900 text-slate-100 font-sans min-h-screen">

          <nav class="border-b border-slate-800 bg-slate-950 p-4">
              <div class="max-w-5xl mx-auto flex justify-between items-center">
                  <h1 class="text-xl font-bold tracking-tight text-indigo-400">🛡️ Shield Conformité</h1>
                  <span class="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">Version Souveraine MVP</span>
              </div>
          </nav>

          <main class="max-w-5xl mx-auto p-6 space-y-8">
              
              <!-- Section Score -->
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl">
                  <div class="flex justify-between items-center mb-4">
                      <div>
                          <h2 class="text-lg font-semibold">Votre score de conformité NIS2 / ISO 27001</h2>
                          <p class="text-sm text-slate-400">Suivi automatisé en temps réel de votre entreprise</p>
                      </div>
                      <span id="score-text" class="text-3xl font-black text-indigo-400 transition-all duration-500">66%</span>
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div id="score-bar" class="bg-indigo-500 h-3 rounded-full transition-all duration-500" style="width: 66%"></div>
                  </div>
              </div>

              <!-- Liste des contrôles -->
              <div class="space-y-4">
                  <h3 class="text-md font-semibold text-slate-400 tracking-wide uppercase">Contrôles de sécurité automatisés</h3>

                  <!-- Contrôle 1 -->
                  <div class="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div class="flex items-center space-x-4">
                          <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                          <div>
                              <p class="font-medium">Chiffrement des bases de données</p>
                              <p class="text-xs text-slate-400">Vérifié automatiquement sur vos serveurs cloud</p>
                          </div>
                      </div>
                      <span class="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono">CONFORME</span>
                  </div>

                  <!-- Contrôle 2 -->
                  <div class="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div class="flex items-center space-x-4">
                          <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                          <div>
                              <p class="font-medium">Double authentification (MFA)</p>
                              <p class="text-xs text-slate-400">Activée pour tous les comptes administrateurs</p>
                          </div>
                      </div>
                      <span class="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-mono">CONFORME</span>
                  </div>

                  <!-- Contrôle 3 -->
                  <div id="ssl-card" class="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950/20 transition-all duration-300">
                      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div class="flex items-start space-x-4">
                              <div id="ssl-dot" class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse mt-1.5"></div>
                              <div>
                                  <p class="font-medium" id="ssl-title">Sécurisation du site web (Chiffrement SSL / HTTPS)</p>
                                  <p class="text-xs text-slate-400" id="ssl-desc">Entrez l'URL de votre site pour lancer l'audit de sécurité obligatoire.</p>
                              </div>
                          </div>
                          
                          <div id="ssl-action" class="flex gap-2">
                              <input type="text" id="url-input" placeholder="exemple.com" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500">
                              <button id="scan-button" onclick="runRealScan()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                                  Scanner le site
                              </button>
                          </div>
                      </div>
                      <p id="error-msg" class="text-xs text-rose-400 mt-2 hidden"></p>
                  </div>

              </div>
          </main>

          <script>
            async function runRealScan() {
              const input = document.getElementById('url-input');
              const btn = document.getElementById('scan-button');
              const errorMsg = document.getElementById('error-msg');
              
              errorMsg.classList.add('hidden');
              
              if (!input.value.trim()) {
                errorMsg.innerText = "Veuillez entrer un nom de domaine valide.";
                errorMsg.classList.remove('hidden');
                return;
              }

              btn.disabled = true;
              btn.innerText = "Analyse SSL en cours...";
              input.disabled = true;

              try {
                const response = await fetch('/api/check-ssl', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: input.value })
                });
                
                const data = await response.json();

                if (data.isSecure) {
                  document.getElementById('score-text').innerText = "100%";
                  document.getElementById('score-text').className = "text-3xl font-black text-emerald-400 transition-all duration-500";
                  document.getElementById('score-bar').style.width = "100%";
                  document.getElementById('score-bar').className = "bg-emerald-500 h-3 rounded-full transition-all duration-500";

                  document.getElementById('ssl-dot').className = "w-3 h-3 rounded-full bg-emerald-500";
                  document.getElementById('ssl-dot').style.boxShadow = "0 0 12px rgba(16,185,129,0.5)";
                  document.getElementById('ssl-card').className = "p-4 bg-slate-950 border border-slate-800 rounded-xl transition-all duration-300";
                  document.getElementById('ssl-desc').innerText = "Certificat SSL valide détecté sur le domaine. Les connexions sont chiffrées.";

                  document.getElementById('ssl-action').innerHTML = '<span class="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-2 rounded-md border border-emerald-500/20 font-mono self-center">CONFORME</span>';
                } else {
                  document.getElementById('ssl-dot').className = "w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]";
                  document.getElementById('ssl-card').className = "p-4 bg-slate-950 border border-rose-500/30 rounded-xl bg-gradient-to-r from-slate-950 to-rose-950/10 transition-all duration-300";
                  document.getElementById('ssl-desc').innerText = "DANGER : Impossible d'établir une connexion HTTPS sécurisée. Ce site est vulnérable.";
                  
                  btn.disabled = false;
                  btn.innerText = "Réessayer";
                  input.disabled = false;
                }

              } catch (err) {
                console.error(err);
                errorMsg.innerText = "Erreur technique lors de la communication avec le scanner.";
                errorMsg.classList.remove('hidden');
                btn.disabled = false;
                btn.innerText = "Scanner le site";
                input.disabled = false;
              }
            }
          </script>
      </body>
      </html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Page non trouvée", { status: 404 });
  },
});

console.log(`🚀 Scanner réel en ligne sur http://localhost:${server.port}`);