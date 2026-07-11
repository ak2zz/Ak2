import { serve } from "bun";

serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Si on demande la page d'accueil, on renvoie le fichier HTML physique
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 2. Si c'est l'API de scan, on traite la logique
    if (url.pathname === "/api/scan" && req.method === "POST") {
      try {
        const body = await req.json(); //
        // ... ta logique de scan ...
        return new Response(JSON.stringify({ status: "success" }));
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erreur" }), { status: 400 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
});