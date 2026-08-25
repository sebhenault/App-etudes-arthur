# Installer l'application sur l'iPhone d'Arthur

**Voie retenue : PWA (application web installable).** Gratuite, sans Mac, sans compte
Apple Developer, sans App Store. Une fois installée, l'application vit sur l'écran
d'accueil comme n'importe quelle autre, en plein écran, et **fonctionne sans réseau**.

## Pourquoi cette voie

| | PWA | TestFlight | Expo Go |
| --- | --- | --- | --- |
| Coût | gratuit | 99 $/an | gratuit |
| Mac nécessaire | non | non (build cloud) | non |
| Compte Apple Developer | non | **oui** | non |
| Autonome (sans ordinateur allumé) | **oui** | oui | non |
| Hors ligne | **oui** | oui | non |

Ce qui rendait la PWA incertaine ici, c'est que l'application stocke tout dans SQLite.
Vérifié : `expo-sqlite` embarque une version WebAssembly de SQLite, la base se crée dans
le navigateur, une partie complète se joue, et **les données survivent aux rechargements**.

Limite honnête : ces vérifications ont été faites dans Chromium, pas dans Safari iOS.
Le stockage OPFS existe sur Safari 17+, mais la première installation sur l'iPhone reste
la vraie validation.

---

## Étape 1 — Activer GitHub Pages (à faire une fois)

1. Le dépôt doit être **public** : Settings → General → bas de page → *Change repository
   visibility* → Public.
   *Avant de le faire, lire la section « Vie privée » plus bas.*
2. Settings → **Pages** → Source → choisir **GitHub Actions**.

## Étape 2 — Fusionner dans `main`

Le workflow `.github/workflows/deploy-pwa.yml` ne se déclenche que sur `main`, parce que
l'environnement `github-pages` n'autorise que la branche par défaut. Un déclenchement
depuis une branche de travail échoue instantanément et sans logs.

Une fois la branche fusionnée, chaque push sur `main` :
valide le contenu → régénère le registre → lance les tests → construit la PWA → déploie.

L'application sera à : **https://sebhenault.github.io/App-etudes-arthur/**

## Étape 3 — Installer sur l'iPhone

1. Ouvrir l'adresse **dans Safari** (pas Chrome : seul Safari sait installer sur l'écran
   d'accueil sous iOS). Le QR code ci-contre y mène : `docs/installer-qr.png`.
2. Toucher le bouton **Partager** (le carré avec une flèche vers le haut).
3. Faire défiler → **« Sur l'écran d'accueil »** → **Ajouter**.

L'icône (une cible bleue) apparaît sur l'écran d'accueil. Au lancement, plus de barre
d'adresse : c'est une application plein écran.

## Étape 4 — Vérifier

- Couper le Wi-Fi et les données, ouvrir l'app : elle doit s'afficher normalement.
- Jouer une partie, fermer l'app, la rouvrir : les points doivent avoir été conservés.

---

## Mises à jour

Chaque push sur `main` redéploie. Sur le téléphone, l'application se met à jour toute
seule au lancement suivant (le service worker détecte la nouvelle version). Rien à
réinstaller.

## Vie privée

Le dépôt doit être public pour que GitHub Pages soit gratuit. Deux points à connaître :

1. **Aucune donnée d'Arthur n'est publiée.** Ses résultats vivent dans la base SQLite de
   son téléphone. Le dépôt ne contient que le code et les exercices.
2. **Le commit initial du dépôt porte l'adresse `sebastien.henault@organisateur.ca`** dans
   ses métadonnées d'auteur. Rendre le dépôt public la rend visible. Deux options :
   - l'accepter (c'est une adresse professionnelle, et la plupart des dépôts publics
     exposent les adresses de leurs auteurs) ;
   - réécrire l'historique avec `git filter-repo --email-callback` avant de passer en
     public. Cela suppose un force-push sur `main`.

Si le dépôt doit rester privé, **Cloudflare Pages** ou **Netlify** déploient gratuitement
depuis un dépôt privé — l'URL de l'application reste publique dans tous les cas, c'est
inhérent à une application web.

## Détails techniques

- `app.json` → `experiments.baseUrl` vaut `/App-etudes-arthur` : un site de projet GitHub
  Pages est servi sous `/<dépôt>/`, et sans cela tous les chemins absolus casseraient.
- `metro.config.js` ajoute `.wasm` aux actifs résolvables, sans quoi SQLite-web ne se
  bundle pas.
- `scripts/build-pwa.mjs` génère le service worker (liste de pré-cache déduite des
  fichiers réellement produits) et injecte manifeste, métadonnées iOS et
  `viewport-fit=cover` dans le `index.html` produit par Expo.
- `public/` est copié tel quel dans l'export : manifeste et icônes y vivent.
- Les icônes se régénèrent avec `npm run icones` (nécessite Pillow).

## Construire et tester en local

```bash
npm run build:pwa          # produit dist/
npx serve dist             # ou n'importe quel serveur statique
```

Attention : servi à la racine, les chemins `/App-etudes-arthur/...` ne résoudront pas.
Pour un test fidèle, servir sous ce préfixe, ou vider temporairement `experiments.baseUrl`.
