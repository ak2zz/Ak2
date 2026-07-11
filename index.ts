import { Database } from "bun:sqlite";

const db = new Database("shield.db");
db.run("CREATE TABLE IF NOT EXISTS scans (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, score INTEGER, details TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

// Railway fournit le port via la variable d'environnement PORT
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

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
        const res = await fetch(`https://${domain}`, { method: "HEAD" });
        const h = res.headers;
        const checks = [
          { name: "HSTS", pass: h.has("strict-transport-security") },
          { name: "CSP", pass: h.has("content-security-policy") },
          { name: "X-Frame", pass: h.has("x-frame-options") },
        ];
        const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
        db.run("INSERT INTO scans (domain, score, details) VALUES (?, ?, ?)", [domain, score, JSON.stringify(checks)]);
        return new Response(JSON.stringify({ domain, score, checks, online: true }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Domaine inaccessible", online: false }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/history") {
      return new Response(JSON.stringify(db.query("SELECT * FROM scans ORDER BY timestamp DESC LIMIT 5").all()), { headers: { "Content-Type": "application/json" } });
    }

    // PAGE PRINCIPALE
    return new Response(
      `<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shield Conformité — Audit de sécurité NIS2</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg: #05070d;
            --card: #0c1020;
            --card-2: #10152a;
            --border: #1c2338;
            --text: #f3f5f9;
            --muted: #8891a7;
            --muted-2: #5c6478;
            --indigo: #6366f1;
            --indigo-light: #818cf8;
            --purple: #c084fc;
            --blue: #38bdf8;
            --orange: #fb923c;
            --pink: #f472b6;
            --green: #22c55e;
          }
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          html, body { margin: 0; padding: 0; }
          body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
          }
          .grid-bg {
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 48px 48px;
          }
          a { color: inherit; text-decoration: none; }
          .wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }

          /* ---- Reveal ---- */
          .reveal { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(.16,1,.3,1) forwards; animation-delay: var(--d, 0s); }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @media (prefers-reduced-motion: reduce) { .reveal, .pulse-dot { animation: none !important; opacity: 1 !important; transform: none !important; } }

          /* ---- Nav ---- */
          nav {
            position: sticky; top: 0; z-index: 50;
            background: rgba(5,7,13,0.75); backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
          }
          .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 76px; }
          .logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.15rem; }
          .logo-badge {
            width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, var(--blue), var(--indigo));
          }
          .logo-text { background: linear-gradient(90deg, #7dd3fc, var(--indigo-light)); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .nav-links { display: flex; gap: 36px; font-size: 0.9rem; color: var(--muted); }
          .nav-links a:hover { color: var(--text); }
          .nav-cta {
            background: var(--card-2); border: 1px solid var(--border); color: var(--text);
            padding: 9px 20px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
          }
          .nav-cta:hover { border-color: var(--indigo); background: rgba(99,102,241,0.12); }
          @media (max-width: 780px) { .nav-links { display: none; } }

          /* ---- Hero ---- */
          .hero { padding: 90px 32px 60px; text-align: center; }
          .eyebrow-pill {
            display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border);
            background: rgba(255,255,255,0.02); border-radius: 999px; padding: 7px 18px;
            font-size: 0.8rem; color: var(--indigo-light); font-weight: 500; margin-bottom: 28px;
          }
          .hero h1 {
            font-size: clamp(2.2rem, 5.6vw, 3.6rem); font-weight: 800; letter-spacing: -0.03em;
            line-height: 1.15; margin: 0 0 22px 0;
          }
          .grad-text {
            background: linear-gradient(90deg, var(--indigo-light), var(--purple), var(--pink));
            -webkit-background-clip: text; background-clip: text; color: transparent;
          }
          .hero p.sub {
            color: var(--muted); font-size: 1.05rem; max-width: 620px; margin: 0 auto 48px; line-height: 1.6;
          }

          /* ---- Scan card ---- */
          .scan-card {
            background: var(--card); border: 1px solid var(--border); border-radius: 18px;
            max-width: 780px; margin: 0 auto; padding: 34px 38px; text-align: left;
            box-shadow: 0 30px 80px -30px rgba(0,0,0,0.6);
          }
          .scan-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .scan-head h3 { margin: 0 0 4px 0; font-size: 1.05rem; font-weight: 700; }
          .scan-head p { margin: 0; color: var(--muted-2); font-size: 0.82rem; }
          .scan-score { font-size: 2rem; font-weight: 800; color: var(--indigo-light); line-height: 1; }
          .progress-track { height: 8px; background: var(--card-2); border-radius: 999px; overflow: hidden; margin-bottom: 26px; }
          .progress-fill {
            height: 100%; width: 0%; border-radius: 999px;
            background: linear-gradient(90deg, var(--indigo), var(--indigo-light));
            transition: width 0.9s cubic-bezier(.16,1,.3,1);
          }
          .scan-form { display: flex; gap: 10px; margin-bottom: 26px; }
          #url {
            flex: 1; background: var(--card-2); border: 1px solid var(--border); color: var(--text);
            padding: 13px 16px; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 0.92rem; outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          #url:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
          .btn-scan {
            background: var(--indigo); color: #fff; border: none; border-radius: 10px;
            padding: 13px 26px; font-weight: 600; font-size: 0.9rem; cursor: pointer; white-space: nowrap;
            transition: background 0.2s, transform 0.15s;
          }
          .btn-scan:hover { background: #7477f5; }
          .btn-scan:active { transform: scale(0.97); }
          .btn-scan:disabled { opacity: 0.6; cursor: default; }
          .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--border); padding-top: 20px; }
          .status-item { display: flex; align-items: flex-start; gap: 10px; padding: 0 8px; }
          .status-item:not(:first-child) { border-left: 1px solid var(--border); }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted-2); margin-top: 6px; flex-shrink: 0; transition: background 0.3s; }
          .dot.ok { background: var(--green); }
          .dot.fail { background: #f87171; }
          .status-item .label { font-weight: 600; font-size: 0.85rem; display: block; }
          .status-item .value { color: var(--muted); font-size: 0.78rem; }
          .error-msg { color: #f87171; font-size: 0.82rem; margin: -12px 0 20px; }
          @media (max-width: 640px) { .status-grid { grid-template-columns: 1fr; gap: 14px; } .status-item:not(:first-child) { border-left: none; border-top: 1px solid var(--border); padding-top: 14px; } .scan-form { flex-direction: column; } }

          /* ---- Sections shared ---- */
          .section { padding: 100px 32px; }
          .section-head { text-align: center; margin-bottom: 56px; }
          .eyebrow { color: var(--indigo-light); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
          .section-head h2 { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; letter-spacing: -0.02em; margin: 0; }

          /* ---- Features ---- */
          .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 940px; margin: 0 auto; }
          .feature-card {
            background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 30px;
            transition: transform 0.25s, border-color 0.25s;
          }
          .feature-card:hover { transform: translateY(-4px); border-color: #2a3252; }
          .icon-box { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
          .feature-card h3 { font-size: 1.05rem; margin: 0 0 10px 0; font-weight: 700; }
          .feature-card p { color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin: 0; }
          @media (max-width: 720px) { .feature-grid { grid-template-columns: 1fr; } }

          /* ---- Pricing ---- */
          .price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; max-width: 1020px; margin: 0 auto; align-items: stretch; }
          .price-card {
            background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 32px;
            display: flex; flex-direction: column; position: relative;
          }
          .price-card.featured { border-color: var(--indigo); box-shadow: 0 0 0 1px var(--indigo), 0 30px 60px -30px rgba(99,102,241,0.4); }
          .badge-reco {
            position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
            background: var(--indigo); color: #fff; font-size: 0.7rem; font-weight: 700;
            padding: 5px 16px; border-radius: 999px; letter-spacing: 0.05em;
          }
          .price-card h4 { margin: 0 0 14px 0; font-size: 1rem; font-weight: 700; color: var(--indigo-light); }
          .price-amount { font-size: 2.4rem; font-weight: 800; margin-bottom: 4px; }
          .price-amount span { font-size: 0.9rem; color: var(--muted); font-weight: 500; }
          .price-desc { color: var(--muted); font-size: 0.85rem; line-height: 1.6; margin: 6px 0 24px; min-height: 62px; }
          .price-features { list-style: none; padding: 0; margin: 0 0 28px; flex: 1; }
          .price-features li { display: flex; align-items: center; gap: 10px; font-size: 0.86rem; padding: 7px 0; color: var(--text); }
          .price-features li.off { color: var(--muted-2); text-decoration: line-through; }
          .check { color: var(--indigo-light); flex-shrink: 0; }
          .price-btn {
            border-radius: 10px; padding: 13px; text-align: center; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; border: 1px solid var(--border); background: var(--card-2); color: var(--text);
            transition: background 0.2s, border-color 0.2s;
          }
          .price-btn:hover { border-color: #333c5e; }
          .price-btn.solid { background: var(--green); border-color: var(--green); color: #06170c; }
          .price-btn.solid:hover { background: #34d670; }
          @media (max-width: 860px) { .price-grid { grid-template-columns: 1fr; } }

          footer { border-top: 1px solid var(--border); padding: 32px; text-align: center; color: var(--muted-2); font-size: 0.82rem; }
        </style>
      </head>
      <body class="grid-bg">

        <nav>
          <div class="wrap nav-inner">
            <div class="logo">
              <div class="logo-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#04101f" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3z"/></svg>
              </div>
              <span class="logo-text">Shield Conformité</span>
            </div>
            <div class="nav-links">
              <a href="#scanner">Scanner</a>
              <a href="#fonctionnalites">Fonctionnalités</a>
              <a href="#tarifs">Tarifs</a>
            </div>
            <button class="nav-cta" onclick="goToScanner()">Lancer l'audit</button>
          </div>
        </nav>

        <section class="hero" id="scanner">
          <div class="wrap">
            <div class="eyebrow-pill reveal" style="--d:0s">✨ Propulsé par l'IA Souveraine NIS2</div>
            <h1 class="reveal" style="--d:0.08s">Protégez votre entreprise des<br><span class="grad-text">failles de sécurité</span></h1>
            <p class="sub reveal" style="--d:0.16s">Analysez instantanément la conformité technique de vos domaines et infrastructures web face aux nouvelles directives européennes.</p>

            <div class="scan-card reveal" style="--d:0.24s">
              <div class="scan-head">
                <div>
                  <h3>Score Global de Conformité</h3>
                  <p>Analyse automatisée NIS2 / ISO 27001</p>
                </div>
                <div class="scan-score" id="score-num">50%</div>
              </div>
              <div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:50%"></div></div>

              <div class="scan-form">
                <input id="url" placeholder="Entrez un domaine (ex: google.fr)" onkeydown="if(event.key==='Enter') scan()">
                <button class="btn-scan" id="scan-btn" onclick="scan()">Analyser le domaine</button>
              </div>
              <div id="error" class="error-msg" style="display:none"></div>

              <div class="status-grid">
                <div class="status-item">
                  <div class="dot" id="dot-server"></div>
                  <div><span class="label">État du serveur</span><span class="value" id="val-server">En attente</span></div>
                </div>
                <div class="status-item">
                  <div class="dot" id="dot-ssl"></div>
                  <div><span class="label">Protocole SSL</span><span class="value" id="val-ssl">En attente</span></div>
                </div>
                <div class="status-item">
                  <div class="dot" id="dot-headers"></div>
                  <div><span class="label">Headers de Sécurité</span><span class="value" id="val-headers">En attente</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="fonctionnalites">
          <div class="wrap">
            <div class="section-head">
              <div class="eyebrow reveal" style="--d:0s">Technologie avancée</div>
              <h2 class="reveal" style="--d:0.06s">Comment fonctionne Shield AI</h2>
            </div>
            <div class="feature-grid">
              <div class="feature-card reveal" style="--d:0.1s">
                <div class="icon-box" style="background:rgba(251,146,60,0.15)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                </div>
                <h3>Audit Cryptographique Express</h3>
                <p>Analyse des protocoles TLS et vérification en temps réel de la validité et de la robustesse des certificats SSL/HTTPS connectés.</p>
              </div>
              <div class="feature-card reveal" style="--d:0.16s">
                <div class="icon-box" style="background:rgba(192,132,252,0.15)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M4.9 4.9a10 10 0 0 1 14.2 0M2 2l20 20M7.8 7.8a5 5 0 0 1 7.1 0"/></svg>
                </div>
                <h3>Analyse d'En-têtes Réseau</h3>
                <p>Détection automatique des politiques de sécurité impératives comme HSTS, CSP, et X-Frame-Options pour contrer les injections.</p>
              </div>
              <div class="feature-card reveal" style="--d:0.22s">
                <div class="icon-box" style="background:rgba(244,114,182,0.15)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
                </div>
                <h3>Calcul de Score NIS2</h3>
                <p>Algorithme d'évaluation basé sur les exigences réglementaires européennes actuelles pour identifier instantanément les défaillances critiques.</p>
              </div>
              <div class="feature-card reveal" style="--d:0.28s">
                <div class="icon-box" style="background:rgba(56,189,248,0.15)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/></svg>
                </div>
                <h3>Prêt pour la Persistance</h3>
                <p>Infrastructures conçues pour accueillir un historique complet et permanent des analyses pour un suivi d'évolution rigoureux.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="tarifs">
          <div class="wrap">
            <div class="section-head">
              <div class="eyebrow reveal" style="--d:0s">Tarification transparente</div>
              <h2 class="reveal" style="--d:0.06s">Des plans adaptés à votre échelle</h2>
            </div>
            <div class="price-grid">
              <div class="price-card reveal" style="--d:0.1s">
                <h4>Starter</h4>
                <div class="price-amount">0€<span> / mois</span></div>
                <p class="price-desc">Pour auditer ponctuellement un site web de manière basique.</p>
                <ul class="price-features">
                  <li><span class="check">✨</span> Scan SSL en temps réel</li>
                  <li><span class="check">✨</span> Score Global Dynamique</li>
                  <li class="off"><span>🗄️</span> Historique persistant</li>
                </ul>
                <div class="price-btn" onclick="goToScanner()">Lancer un scan gratuit</div>
              </div>
              <div class="price-card featured reveal" style="--d:0.16s">
                <div class="badge-reco">RECOMMANDÉ</div>
                <h4>Professionnel</h4>
                <div class="price-amount">49€<span> / mois</span></div>
                <p class="price-desc">Pour les PME devant prouver leur conformité réglementaire de façon continue.</p>
                <ul class="price-features">
                  <li><span class="check">✨</span> Toutes les fonctionnalités Starter</li>
                  <li><span class="check">✨</span> Analyse complète des Headers</li>
                  <li><span class="check">✨</span> Historique complet des scans</li>
                  <li><span class="check">✨</span> Intégration de base de données</li>
                </ul>
                <div class="price-btn solid" onclick="goToScanner()">Protéger mon infrastructure</div>
              </div>
              <div class="price-card reveal" style="--d:0.22s">
                <h4>Entreprise</h4>
                <div class="price-amount">Sur mesure</div>
                <p class="price-desc">Pour les grands groupes soumis aux audits multi-domaines NIS2 complexes.</p>
                <ul class="price-features">
                  <li><span class="check">✨</span> Scans simultanés illimités</li>
                  <li><span class="check">✨</span> API d'automatisation complète</li>
                  <li><span class="check">✨</span> Espace membres multi-utilisateurs</li>
                  <li><span class="check">🛡️</span> Support souverain dédié 24/7</li>
                </ul>
                <div class="price-btn" onclick="location.href='mailto:contact@shieldconformite.fr'">Nous contacter</div>
              </div>
            </div>
          </div>
        </section>

        <footer>© 2026 Shield Conformité. Tous droits réservés. Hébergement Cloud Souverain.</footer>

        <script>
          function goToScanner() {
            document.getElementById('scanner').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => document.getElementById('url').focus(), 400);
          }

          function setStatus(dotId, valId, pass, onLabel, offLabel) {
            const dot = document.getElementById(dotId);
            const val = document.getElementById(valId);
            dot.classList.remove('ok', 'fail');
            dot.classList.add(pass ? 'ok' : 'fail');
            val.textContent = pass ? onLabel : offLabel;
          }

          async function scan() {
            const input = document.getElementById('url');
            const val = input.value.trim();
            const btn = document.getElementById('scan-btn');
            const errBox = document.getElementById('error');
            errBox.style.display = 'none';
            if (!val) { input.focus(); return; }

            btn.disabled = true;
            btn.textContent = 'Analyse en cours…';

            try {
              const res = await fetch('/api/scan', { method: 'POST', body: JSON.stringify({ url: val }) });
              const data = await res.json();

              if (data.error) {
                errBox.textContent = data.error;
                errBox.style.display = 'block';
                setStatus('dot-server', 'val-server', false, 'En ligne', 'Hors ligne');
                setStatus('dot-ssl', 'val-ssl', false, 'Activé', 'Non détecté');
                setStatus('dot-headers', 'val-headers', false, 'Complets', 'Incomplets');
                document.getElementById('score-num').textContent = '0%';
                document.getElementById('progress-fill').style.width = '0%';
                return;
              }

              const hsts = data.checks.find(c => c.name === 'HSTS')?.pass;
              const csp = data.checks.find(c => c.name === 'CSP')?.pass;
              const xframe = data.checks.find(c => c.name === 'X-Frame')?.pass;

              setStatus('dot-server', 'val-server', true, 'En ligne', 'En ligne');
              setStatus('dot-ssl', 'val-ssl', hsts, 'Activé', 'Non détecté');
              setStatus('dot-headers', 'val-headers', csp && xframe, 'Complets', csp || xframe ? 'Partiels' : 'Absents');

              document.getElementById('score-num').textContent = data.score + '%';
              document.getElementById('progress-fill').style.width = data.score + '%';
            } catch (e) {
              errBox.textContent = 'Erreur réseau, réessaie.';
              errBox.style.display = 'block';
            } finally {
              btn.disabled = false;
              btn.textContent = 'Analyser le domaine';
            }
          }
        </script>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  },
});

console.log(`Shield Conformité lancé sur le port ${PORT}`);
