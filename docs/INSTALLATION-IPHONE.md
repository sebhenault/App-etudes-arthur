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

## État : déployé ✅

Le déploiement automatique est en place et le premier a réussi
(GitHub Pages activé, workflow `Déployer la PWA` vert de bout en bout :
validation du contenu → 75 tests → build → déploiement).

**L'application est à : https://sebhenault.github.io/App-etudes-arthur/**

## Installer sur l'iPhone

1. Ouvrir cette adresse **dans Safari** — pas Chrome : sous iOS, seul Safari sait installer
   sur l'écran d'accueil. Le QR code `docs/installer-qr.png` y mène.
2. Toucher **Partager** (le carré avec une flèche vers le haut).
3. Faire défiler → **« Sur l'écran d'accueil »** → **Ajouter**.

L'icône (une cible bleue) apparaît sur l'écran d'accueil. Au lancement, plus de barre
d'adresse : c'est une application plein écran.

### Si la page demande une connexion ou renvoie une erreur 404

C'est une question de visibilité, pas de déploiement. Vérifier :
- Settings → General → le dépôt doit être **public** (Pages gratuit l'exige) ;
- Settings → Pages → la visibilité du site doit être **publique**.

## Vérifier que tout marche

- Couper le Wi-Fi et les données, ouvrir l'app : elle doit s'afficher normalement.
- Jouer une partie, fermer l'app, la rouvrir : les points doivent avoir été conservés.

Ces deux comportements ont été validés dans Chromium avant déploiement. **Safari iOS n'a
pas pu être testé** depuis l'environnement de développement : c'est la seule inconnue.

---

## Mises à jour

Chaque push sur `main` redéploie. Sur le téléphone, l'application se met à jour toute
seule au lancement suivant (le service worker détecte la nouvelle version). Rien à
réinstaller.

## Vie privée

Le dépôt doit être public pour que GitHub Pages soit gratuit. Deux points à connaître :

1. **Aucune donnée d'Arthur n'est publiée.** Ses résultats vivent dans la base SQLite de
   son téléphone. Le dépôt ne contient que le code et les exercices.
2. **L'historique Git a été nettoyé avant le passage en public.** Le commit initial
   portait une adresse courriel personnelle dans ses métadonnées d'auteur ; elle a été
   remplacée par l'adresse GitHub anonyme `sebhenault@users.noreply.github.com`
   (`git filter-repo --email-callback`, puis force-push). Plus aucune adresse personnelle
   ne subsiste, ni dans les fichiers, ni dans les métadonnées de commits.

   À refaire si de nouveaux commits arrivent depuis un poste dont le `git config user.email`
   est une adresse personnelle. Pour l'éviter :
   ```bash
   git config user.email "sebhenault@users.noreply.github.com"
   ```

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
