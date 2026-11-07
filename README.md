# Manhwa au hasard

Page web qui tire au hasard un manhwa (ou manga / manhua) via l'API publique de [MangaDex](https://api.mangadex.org/docs/), avec filtres de langue, d'origine, de statut, d'année, de popularité, de nombre de chapitres disponibles dans la langue choisie, de genres, thèmes et format (inclus / exclus).

- Lien direct vers le premier chapitre disponible, note moyenne et nombre d'abonnés.
- Synopsis traduit automatiquement quand il n'existe qu'en anglais (traducteur intégré au navigateur si disponible, sinon Google Traduction).
- Filtres mémorisés, historique des tirages (sans retomber sur une œuvre déjà vue) et liste « à lire », stockés dans le navigateur.
- Installable sur l'écran d'accueil (PWA). Raccourci : Espace pour un nouveau tirage.

En ligne : <https://trisazyr.github.io/manhwa-hasard/>

## Proxy MangaDex

MangaDex n'envoie pas d'en-têtes CORS aux sites tiers et sert une mauvaise image aux couvertures appelées directement depuis un autre site ([doc](https://api.mangadex.org/docs/2-limitations/)). La page passe donc par une Edge Function Supabase, `supabase/functions/mangadex-proxy`, qui :

- ne relaie que `GET /manga`, `GET /manga/tag`, `GET /manga/<id>/aggregate`, `GET /statistics/manga/<id>` (API) et `GET /cover/<id>/<fichier>` (couvertures) ;
- n'autorise que les origines `https://trisazyr.github.io` et `http://localhost` ;
- s'identifie auprès de MangaDex avec son propre User-Agent.

Redéploiement après modification (CLI Supabase) :

```bash
supabase functions deploy mangadex-proxy --no-verify-jwt --project-ref knmgodvpxkirynavofon
```

## Lancer en local

La page ne fonctionne pas ouverte directement en `file://` (origine `null`, refusée par le proxy). Lance un petit serveur dans ce dossier :

```bash
python3 -m http.server 8000
```

puis ouvre <http://localhost:8000/manhwa-hasard.html>.
