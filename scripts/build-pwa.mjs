#!/usr/bin/env node
/**
 * Construit la version web installable (PWA) de l'application.
 *
 *   npm run build:pwa
 *
 * Trois étapes :
 *   1. `expo export --platform web` produit un site statique dans `dist/` ;
 *   2. on génère un service worker dont la liste de pré-cache est déduite des
 *      fichiers réellement produits (leurs noms contiennent une empreinte, donc
 *      la liste change à chaque build et déclenche la mise à jour côté navigateur) ;
 *   3. on injecte dans `index.html` les balises qu'Expo ne connaît pas : manifeste,
 *      métadonnées iOS, couleur de thème, et l'enregistrement du service worker.
 *
 * Pourquoi post-traiter plutôt que personnaliser le gabarit d'Expo : le gabarit
 * est régénéré à chaque export. Une injection idempotente survit aux mises à jour
 * du SDK sans qu'on ait à maintenir une copie du modèle.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(RACINE, 'dist');

const appJson = JSON.parse(fs.readFileSync(path.join(RACINE, 'app.json'), 'utf8'));
const BASE = (appJson.expo.experiments?.baseUrl ?? '').replace(/\/$/, '');
const NOM = appJson.expo.name;
const url = (chemin) => `${BASE}/${chemin.replace(/^\//, '')}`;

// --- 1. Export -------------------------------------------------------------

if (!process.argv.includes('--skip-export')) {
  console.log('› Export web…');
  fs.rmSync(SORTIE, { recursive: true, force: true });
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist'], {
    cwd: RACINE,
    stdio: 'inherit',
  });
}

if (!fs.existsSync(path.join(SORTIE, 'index.html'))) {
  console.error('✗ dist/index.html introuvable : l’export a échoué.');
  process.exit(1);
}

// --- 2. Service worker -----------------------------------------------------

const lister = (dossier) =>
  fs.readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const complet = path.join(dossier, entree.name);
    return entree.isDirectory()
      ? lister(complet)
      : [path.relative(SORTIE, complet).split(path.sep).join('/')];
  });

// `metadata.json` ne sert qu'à l'outillage d'Expo et le service worker se
// référence lui-même : ni l'un ni l'autre n'a sa place dans le pré-cache.
const fichiers = lister(SORTIE).filter(
  (f) => f !== 'metadata.json' && f !== 'service-worker.js',
);

const precache = ['./', ...fichiers.map(url)];
const version = crypto.createHash('sha1').update(precache.join('|')).digest('hex').slice(0, 12);

const serviceWorker = `/**
 * Service worker généré par scripts/build-pwa.mjs — ne pas modifier à la main.
 *
 * L'application doit fonctionner sans réseau : c'est une exigence du projet, pas
 * un agrément. Tout est donc pré-caché à l'installation. Les noms de fichiers
 * produits par Expo contiennent une empreinte, ce qui rend le cache-first sûr.
 */
const CACHE = 'defis-arthur-${version}';
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Un seul fichier manquant ne doit pas faire échouer toute l'installation.
      .then((cache) => Promise.allSettled(PRECACHE.map((chemin) => cache.add(chemin))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  // On ne touche pas aux autres origines.
  if (new URL(requete.url).origin !== self.location.origin) return;

  // Navigation : on sert la coquille de l'application, même hors ligne.
  if (requete.mode === 'navigate') {
    event.respondWith(
      caches.match('${url('index.html')}').then((reponse) => reponse ?? fetch(requete)),
    );
    return;
  }

  event.respondWith(
    caches.match(requete).then(
      (enCache) =>
        enCache ??
        fetch(requete).then((reponse) => {
          // On garde une copie des ressources récupérées après coup.
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE).then((cache) => cache.put(requete, copie));
          }
          return reponse;
        }),
    ),
  );
});
`;

fs.writeFileSync(path.join(SORTIE, 'service-worker.js'), serviceWorker, 'utf8');

// --- 3. Injection dans index.html ------------------------------------------

const cheminHtml = path.join(SORTIE, 'index.html');
let html = fs.readFileSync(cheminHtml, 'utf8');

html = html.replace('<html lang="en">', '<html lang="fr-CA">');

// `viewport-fit=cover` : sans lui, iOS n'expose pas les marges de sécurité
// (encoche, barre d'accueil) et l'interface passe dessous en mode plein écran.
html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

const balises = `
    <link rel="manifest" href="${url('manifest.webmanifest')}" />
    <meta name="theme-color" content="#5B7CFA" />
    <meta name="description" content="Révisions de 4e année du primaire sous forme de jeux. Fonctionne hors ligne." />
    <!-- Installation sur l'écran d'accueil iOS -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="${NOM}" />
    <link rel="apple-touch-icon" href="${url('icons/apple-touch-icon.png')}" />
    <script>
      // Enregistré après le chargement : le service worker ne doit jamais
      // retarder le premier affichage.
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker
            .register('${url('service-worker.js')}', { scope: '${BASE}/' })
            .catch(function (erreur) {
              console.warn('Service worker non enregistré :', erreur);
            });
        });
      }
    </script>
`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${balises}  </head>`);
}

fs.writeFileSync(cheminHtml, html, 'utf8');

const taille = fichiers.reduce((somme, f) => somme + fs.statSync(path.join(SORTIE, f)).size, 0);
console.log(`\n✓ PWA prête dans dist/`);
console.log(`  ${fichiers.length} fichiers · ${(taille / 1048576).toFixed(1)} Mo · cache ${version}`);
console.log(`  Base : ${BASE || '(racine)'}`);
