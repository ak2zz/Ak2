const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // 🌐 1. L'API DU SCANNER (Logique métier)
    if (url.pathname === "/api/scan" && request.method === "POST") {
      // ... (Ta logique de scan serveur reste ici, telle quelle)
    }

    // 📄 2. SERVIR LE FICHIER HTML
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Page non trouvée", { status: 404 });
  },
});

console.log(`🚀 Serveur en ligne sur http://localhost:${server.port}`);