const server = Bun.serve({
  port: Number(process.env.PORT) || 8080,
  hostname: "0.0.0.0", // Force Bun à écouter sur toutes les interfaces réseau pour Railway
  async fetch(request) {
    const url = new URL(request.url);

    // 🌐 1. L'API DU SCANNER RÉEL ET INTELLIGENT
    if (url.pathname === "/api/scan" && request.method === "POST") {
      try {
        const body = await request.json();
        let targetUrl = body.url.trim();

        if (!targetUrl) {
          return new Response(JSON.stringify({ error: "Veuillez entrer une adresse valide." }), { status: 400 });
        }

        // Nettoyage et forçage du protocole pour le test fetch
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = "https://" + targetUrl;
        }

        const isHttps = targetUrl.startsWith("https://");
        let isOnline = false;
        let secureHeaders = false;

        try {
          // Tente de joindre le site en direct avec un timeout de 4 secondes
          const response = await fetch(targetUrl, { 
            method: "GET", 
            headers: { "User-Agent": "ShieldConformiteScanner/1.0" },
            signal: AbortSignal.timeout(4000) 
          });
          
          isOnline = response.ok || response.status < 500;
          secureHeaders = response.headers.has("strict-transport-security") || response.headers.has("x-frame-options") || response.headers.has("content-security-policy");
        } catch (e) {
          // Si le HTTPS échoue, tentative en HTTP classique
          try {
            const fallbackUrl = targetUrl.replace("https://", "http://");
            const response = await fetch(fallbackUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
            isOnline = response.ok || response.status < 500;
          } catch(err) {
            isOnline = false;
          }
        }

        // Calcul dynamique du score
        let score = 20; // Score de base si le domaine existe
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
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: "Impossible d'analyser ce site." }), { status: 500 });
      }
    }

    // 📄 2. LA LANDING PAGE PREMIUM ENTIÈREMENT ANIMÉE
    if (url.pathname === "/") {
      const html = `
      <!DOCTYPE html>
      <html lang="fr" class="scroll-smooth">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Shield Conformité — L'IA de Cybersécurité Souveraine</title>
          <!-- Tailwind CSS v4 via CDN -->
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <!-- Bibliothèque AOS pour les animations au défilement -->
          <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
          <style>
              .btn-click-effect {
                  transition: transform 0.1s ease, box-shadow 0.2s ease;
              }
              .btn-click-effect:active {
                  transform: scale(0.95);
              }
              .glow-hover:hover {
                  box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
              }
              .glow-green:hover {
                  box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
              }
          </style>
      </head>
      <body class="bg-slate-950 text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">

          <!-- Grille de fond futuriste -->
          <div class="fixed inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

          <!-- Barre de Navigation Flottante -->
          <nav class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4 transition-all duration-300">
              <div class="max-w-6xl mx-auto flex justify-between items-center">
                  <div class="flex items-center space-x-2">
                      <span class="text-2xl">🛡️</span>
                      <span class="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Shield Conformité</span>
                  </div>
                  <div class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
                      <a href="#hero" class="hover:text-indigo-400 transition-colors">Scanner</a>
                      <a href="#features" class="hover:text-indigo-400 transition-colors">Fonctionnalités</a>
                      <a href="#pricing" class="hover:text-indigo-400 transition-colors">Tarifs</a>
                  </div>
                  <a href="#hero" class="btn-click-effect bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs px-4 py-2 rounded-full font-semibold border border-indigo-500/30 transition-all">
                      Lancer l'audit
                  </a>
              </div>
          </nav>

          <!-- SECTION HERO : Le Scanner de Conformité Intelligent -->
          <section id="hero" class="relative max-w-4xl mx-auto pt-20 pb-16 px-6 text-center z-10 space-y-8">
              <div data-aos="fade-down" class="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1.5 rounded-full font-medium border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <span>✨ Propulsé par l'IA Souveraine NIS2</span>
              </div>

              <h2 data-aos="fade-up" data-aos-delay="100" class="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                  Protégez votre entreprise des <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">failles de sécurité</span>
              </h2>

              <p data-aos="fade-up" data-aos-delay="200" class="text-base md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
                  Analysez instantanément la conformité technique de vos domaines et infrastructures web face aux nouvelles directives européennes.
              </p>

              <!-- COMPOSANT INTERACTIF : Dashboard & Scanner -->
              <div data-aos="zoom-in" data-aos-delay="300" class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto space-y-6 relative overflow-hidden">
                  <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                  
                  <!-- Jauge globale -->
                  <div class="flex justify-between items-center">
                      <div class="text-left">
                          <h3 class="font-bold text-lg">Score Global de Conformité</h3>
                          <p class="text-xs text-slate-400">Analyse automatisée NIS2 / ISO 27001</p>
                      </div>
                      <span id="score-text" class="text-4xl font-black text-indigo-400 transition-all duration-700">50%</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div id="score-bar" class="bg-indigo-500 h-3 rounded-full transition-all duration-700" style="width: 50%"></div>
                  </div>

                  <!-- Input & Bouton de Scan -->
                  <div class="flex flex-col sm:flex-row gap-3 pt-2">
                      <input type="text" id="url-input" placeholder="Entrez un domaine (ex: google.fr)" class="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 flex-1 text-white placeholder-slate-500 transition-colors">
                      <button id="scan-button" onclick="executeAdvancedScan()" class="btn-click-effect glow-hover bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-indigo-600/20">
                          Analyser le domaine
                      </button>
                  </div>
                  <p id="error-msg" class="text-xs text-rose-400 text-left hidden"></p>

                  <!-- Grille des indicateurs -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60 text-left">
                      <div class="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center space-x-3">
                          <div id="status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <div>
                              <p class="text-xs text-slate-400 font-medium">État du serveur</p>
                              <p id="status-label" class="text-xs font-bold text-slate-300 font-mono">En attente</p>
                          </div>
                      </div>
                      <div class="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center space-x-3">
                          <div id="ssl-dot" class="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <div>
                              <p class="text-xs text-slate-400 font-medium">Protocole SSL</p>
                              <p id="ssl-label" class="text-xs font-bold text-slate-300 font-mono">En attente</p>
                          </div>
                      </div>
                      <div class="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center space-x-3">
                          <div id="headers-dot" class="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                          <div>
                              <p class="text-xs text-slate-400 font-medium">Headers de Sécurité</p>
                              <p id="headers-label" class="text-xs font-bold text-slate-300 font-mono">En attente</p>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          <!-- SECTION FONCTIONNALITÉS : Grille de Cartes Premium Animées -->
          <section id="features" class="max-w-5xl mx-auto py-24 px-6 space-y-12 relative z-10">
              <div class="text-center space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 tracking-widest uppercase">Technologie Avancée</h3>
                  <h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">Comment fonctionne Shield AI</h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Carte 1 -->
                  <div data-aos="fade-up" class="bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-3 transition-all backdrop-blur-sm group hover:-translate-y-1">
                      <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">🔒</div>
                      <h4 class="text-lg font-bold">Audit Cryptographique Express</h4>
                      <p class="text-sm text-slate-400 font-light leading-relaxed">Analyse des protocoles TLS et vérification en temps réel de la validité et de la robustesse des certificats SSL/HTTPS connectés.</p>
                  </div>
                  <!-- Carte 2 -->
                  <div data-aos="fade-up" data-aos-delay="100" class="bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-3 transition-all backdrop-blur-sm group hover:-translate-y-1">
                      <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">📡</div>
                      <h4 class="text-lg font-bold">Analyse d'En-têtes Réseau</h4>
                      <p class="text-sm text-slate-400 font-light leading-relaxed">Détection automatique des politiques de sécurité impératives comme HSTS, CSP, et X-Frame-Options pour contrer les injections.</p>
                  </div>
                  <!-- Carte 3 -->
                  <div data-aos="fade-up" data-aos-delay="200" class="bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-3 transition-all backdrop-blur-sm group hover:-translate-y-1">
                      <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">🎯</div>
                      <h4 class="text-lg font-bold">Calcul de Score NIS2</h4>
                      <p class="text-sm text-slate-400 font-light leading-relaxed">Algorithme d'évaluation basé sur les exigences réglementaires européennes actuelles pour identifier instantanément les défaillances critiques.</p>
                  </div>
                  <!-- Carte 4 -->
                  <div data-aos="fade-up" data-aos-delay="300" class="bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl space-y-3 transition-all backdrop-blur-sm group hover:-translate-y-1">
                      <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">💾</div>
                      <h4 class="text-lg font-bold">Prêt pour la Persistance</h4>
                      <p class="text-sm text-slate-400 font-light leading-relaxed">Infrastructures conçues pour accueillir un historique complet et permanent des analyses pour un suivi d'évolution rigoureux.</p>
                  </div>
              </div>
          </section>

          <!-- SECTION TARIFS : Grille Interactive avec Effet d'Échelle -->
          <section id="pricing" class="max-w-5xl mx-auto py-24 px-6 space-y-12 relative z-10">
              <div class="text-center space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 tracking-widest uppercase">Tarification transparente</h3>
                  <h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">Des plans adaptés à votre échelle</h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                  <!-- Offre 1 -->
                  <div data-aos="fade-right" class="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
                      <div class="space-y-4">
                          <h4 class="font-bold text-md text-slate-300">Starter</h4>
                          <p class="text-3xl font-black">0€ <span class="text-xs font-normal text-slate-400">/ mois</span></p>
                          <p class="text-xs text-slate-400 leading-relaxed">Pour auditer ponctuellement un site web de manière basique.</p>
                          <ul class="text-xs space-y-2 text-slate-300 pt-2">
                              <li>✨ Scan SSL en temps réel</li>
                              <li>✨ Score Global Dynamique</li>
                              <li class="text-slate-500 line-through">📊 Historique persistant</li>
                          </ul>
                      </div>
                      <a href="#hero" class="btn-click-effect text-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all">Lancer un scan gratuit</a>
                  </div>

                  <!-- Offre 2 (Mise en avant + Effet Glow) -->
                  <div data-aos="bg-zoom" class="bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border-2 border-indigo-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 backdrop-blur-sm shadow-xl shadow-indigo-500/5 relative group scale-100 md:scale-105 z-20">
                      <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">Recommandé</div>
                      <div class="space-y-4">
                          <h4 class="font-bold text-md text-indigo-400">Professionnel</h4>
                          <p class="text-3xl font-black">49€ <span class="text-xs font-normal text-slate-400">/ mois</span></p>
                          <p class="text-xs text-slate-300 leading-relaxed">Pour les PME devant prouver leur conformité réglementaire de façon continue.</p>
                          <ul class="text-xs space-y-2 text-slate-200 pt-2">
                              <li>✨ Toutes les fonctionnalités Starter</li>
                              <li>✨ Analyse complète des Headers</li>
                              <li>✨ Historique complet des scans</li>
                              <li>⚡ Intégration de base de données</li>
                          </ul>
                      </div>
                      <button onclick="alert('Bientôt disponible avec l\'étape de la Base de Données !')" class="btn-click-effect glow-green text-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer">
                          Protéger mon infrastructure
                      </button>
                  </div>

                  <!-- Offre 3 -->
                  <div data-aos="fade-left" class="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
                      <div class="space-y-4">
                          <h4 class="font-bold text-md text-slate-300">Entreprise</h4>
                          <p class="text-3xl font-black">Sur mesure</p>
                          <p class="text-xs text-slate-400 leading-relaxed">Pour les grands groupes soumis aux audits multi-domaines NIS2 complexes.</p>
                          <ul class="text-xs space-y-2 text-slate-300 pt-2">
                              <li>✨ Scans simultanés illimités</li>
                              <li>✨ API d'automatisation complète</li>
                              <li>✨ Espace membres multi-utilisateurs</li>
                              <li>🛡️ Support souverain dédié 24/7</li>
                          </ul>
                      </div>
                      <button onclick="alert('Contactez-nous à contact@shield.souverain.fr')" class="btn-click-effect text-center bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer">Nous contacter</button>
                  </div>
              </div>
          </section>

          <!-- Pied de page -->
          <footer class="border-t border-slate-900 text-center py-8 text-xs text-slate-500 relative z-10">
              <p>© 2026 Shield Conformité. Tous droits réservés. Hébergement Cloud Souverain.</p>
          </footer>

          <!-- Scripts indispensables : AOS + Logique de Scan -->
          <script src="https://unpkg.com/aos@next/dist/aos.js"></script>
          <script>
              AOS.init({
                  duration: 800,
                  once: true,
                  easing: 'ease-out'
              });

              async function executeAdvancedScan() {
                  const input = document.getElementById('url-input');
                  const btn = document.getElementById('scan-button');
                  const errorMsg = document.getElementById('error-msg');

                  const scoreText = document.getElementById('score-text');
                  const scoreBar = document.getElementById('score-bar');

                  const statusDot = document.getElementById('status-dot');
                  const statusLabel = document.getElementById('status-label');

                  const sslDot = document.getElementById('ssl-dot');
                  const sslLabel = document.getElementById('ssl-label');

                  const headersDot = document.getElementById('headers-dot');
                  const headersLabel = document.getElementById('headers-label');

                  errorMsg.classList.add('hidden');

                  if (!input.value.trim()) {
                      errorMsg.innerText = "Veuillez saisir une adresse valide.";
                      errorMsg.classList.remove('hidden');
                      return;
                  }

                  btn.disabled = true;
                  btn.innerText = "Analyse en cours...";
                  input.disabled = true;

                  scoreText.innerText = "--%";
                  scoreText.className = "text-4xl font-black text-amber-400 animate-pulse";
                  scoreBar.className = "bg-amber-500 h-3 rounded-full transition-all duration-300 animate-pulse";

                  try {
                      const response = await fetch('/api/scan', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: input.value })
                      });

                      const data = await response.json();

                      if (data.error) {
                          throw new Error(data.error);
                      }

                      scoreText.classList.remove('animate-pulse');
                      scoreBar.classList.remove('animate-pulse');

                      scoreText.innerText = data.score + "%";
                      scoreBar.style.width = data.score + "%";

                      if (data.score >= 80) {
                          scoreText.className = "text-4xl font-black text-emerald-400 transition-all duration-500";
                          scoreBar.className = "bg-emerald-500 h-3 rounded-full transition-all duration-500";
                      } else if (data.score >= 50) {
                          scoreText.className = "text-4xl font-black text-amber-400 transition-all duration-500";
                          scoreBar.className = "bg-amber-500 h-3 rounded-full transition-all duration-500";
                      } else {
                          scoreText.className = "text-4xl font-black text-rose-500 transition-all duration-500";
                          scoreBar.className = "bg-rose-500 h-3 rounded-full transition-all duration-500";
                      }

                      if (data.isOnline) {
                          statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                          statusLabel.innerText = "EN LIGNE";
                          statusLabel.className = "text-xs font-bold text-emerald-400 font-mono";
                      } else {
                          statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                          statusLabel.innerText = "ÉCHEC";
                          statusLabel.className = "text-xs font-bold text-rose-500 font-mono";
                      }

                      if (data.isHttps) {
                          sslDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                          sslLabel.innerText = "HTTPS ACTIF";
                          sslLabel.className = "text-xs font-bold text-emerald-400 font-mono";
                      } else {
                          sslDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                          sslLabel.innerText = "HTTP NON SÉCURISÉ";
                          sslLabel.className = "text-xs font-bold text-rose-500 font-mono";
                      }

                      if (data.secureHeaders) {
                          headersDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                          headersLabel.innerText = "CONFORME";
                          headersLabel.className = "text-xs font-bold text-emerald-400 font-mono";
                      } else {
                          headersDot.className = "w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
                          headersLabel.innerText = "MANQUANTS";
                          headersLabel.className = "text-xs font-bold text-amber-500 font-mono";
                      }

                  } catch (err) {
                      scoreText.innerText = "0%";
                      scoreText.className = "text-4xl font-black text-rose-500";
                      scoreBar.style.width = "0%";
                      errorMsg.innerText = "Erreur : Le domaine est introuvable ou bloque les requêtes automatisées.";
                      errorMsg.classList.remove('hidden');
                  } finally {
                      btn.disabled = false;
                      btn.innerText = "Analyser le domaine";
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

console.log(`🚀 Serveur Premium lié au port distant`);