// Proxy minimal vers MangaDex pour la page « Manhwa au hasard ».
// MangaDex n'envoie pas d'en-têtes CORS aux sites tiers et sert une mauvaise image
// aux couvertures « hotlinkées » : leur doc demande de passer par son propre serveur.
//   GET /mangadex-proxy/manga?...                    -> https://api.mangadex.org/manga?...
//   GET /mangadex-proxy/manga/tag                    -> https://api.mangadex.org/manga/tag
//   GET /mangadex-proxy/manga/<id>/aggregate?...     -> https://api.mangadex.org/manga/<id>/aggregate?...
//   GET /mangadex-proxy/statistics/manga/<id>        -> https://api.mangadex.org/statistics/manga/<id>
//   GET /mangadex-proxy/cover/<mangaId>/<fichier>    -> https://uploads.mangadex.org/covers/<mangaId>/<fichier>
// Seules ces routes sont relayées (pas de proxy ouvert).

const ALLOWED_ORIGINS = [
  "https://trisazyr.github.io",
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
// User-Agent honnête, identifiant l'application (exigé par MangaDex, ne doit pas être usurpé).
const USER_AGENT = "manhwa-hasard/1.0 (+https://github.com/TrisAzyr/manhwa-hasard)";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const AGGREGATE_RE = new RegExp(`^/manga/(${UUID})/aggregate$`, "i");
const STATS_RE = new RegExp(`^/statistics/manga/(${UUID})$`, "i");
const COVER_RE = new RegExp(`^/cover/(${UUID})/([0-9a-f-]+\\.(?:jpg|jpeg|png|gif|webp)\\.(?:256|512)\\.jpg)$`, "i");

function corsHeaders(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED_ORIGINS.some(o => typeof o === "string" ? o === origin : o.test(origin));
  return ok
    ? { "Access-Control-Allow-Origin": origin!, "Access-Control-Allow-Methods": "GET, OPTIONS", "Vary": "Origin" }
    : { "Vary": "Origin" };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return new Response("Méthode non autorisée", { status: 405, headers: cors });

  const url = new URL(req.url);
  // Le chemin reçu commence par le nom de la fonction : /mangadex-proxy/...
  const path = url.pathname.replace(/^.*?\/mangadex-proxy(?=\/|$)/, "");

  let target: string;
  let cacheControl: string;
  const cover = path.match(COVER_RE);
  if (path === "/manga") {
    target = `https://api.mangadex.org/manga${url.search}`;
    cacheControl = "public, max-age=300";
  } else if (path === "/manga/tag") {
    target = "https://api.mangadex.org/manga/tag";
    cacheControl = "public, max-age=86400";
  } else if (AGGREGATE_RE.test(path)) {
    target = `https://api.mangadex.org${path}${url.search}`;
    cacheControl = "public, max-age=3600";
  } else if (STATS_RE.test(path)) {
    target = `https://api.mangadex.org${path}`;
    cacheControl = "public, max-age=3600";
  } else if (cover) {
    target = `https://uploads.mangadex.org/covers/${cover[1]}/${cover[2]}`;
    cacheControl = "public, max-age=86400";
  } else {
    return new Response("Introuvable", { status: 404, headers: cors });
  }

  try {
    const upstream = await fetch(target, { headers: { "User-Agent": USER_AGENT } });
    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/octet-stream");
    if (upstream.ok) headers.set("Cache-Control", cacheControl);
    const retry = upstream.headers.get("Retry-After");
    if (retry) headers.set("Retry-After", retry);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response("MangaDex injoignable", { status: 502, headers: cors });
  }
});
