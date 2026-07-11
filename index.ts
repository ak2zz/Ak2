import { serve } from "bun";

serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Sert le fichier physique index.html sans essayer de le compiler
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"));
    }

    // 2. Ton API reste ici
    if (url.pathname === "/api/scan" && req.method === "POST") {
      try {
        const body = await req.json();
        // ... (Ton code de logique de scan) ...
        return new Response(JSON.stringify({ status: "success" }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 400 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
});