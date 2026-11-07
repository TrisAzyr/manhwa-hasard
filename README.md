# Manhwa au hasard

Page web qui tire au hasard un manhwa (ou manga / manhua) via l'API publique de [MangaDex](https://api.mangadex.org/docs/), avec filtres de langue de traduction, de statut et d'origine.

## Lancer en local

La page ne fonctionne pas ouverte directement en `file://` : MangaDex refuse les appels venant d'une origine `null` (CORS). Lance un petit serveur dans ce dossier :

```bash
python3 -m http.server 8000
```

puis ouvre <http://localhost:8000/manhwa-hasard.html>.
