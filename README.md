# Les Défis d'Arthur

Application mobile de révision pour Arthur, élève de **4e année du primaire au Québec**.
Un parent active chaque semaine les notions vues en classe ; l'enfant révise sous forme de
jeux courts. Tout fonctionne **hors ligne** et **aucune donnée ne quitte l'appareil**.

> **Le contenu pédagogique vit dans des fichiers JSON, pas dans le code.**
> Quand l'enseignante envoie son plan de la semaine, on ajoute ou on active un module —
> sans modifier une seule ligne de l'application.

---

## Démarrage rapide

```bash
npm install
npm run content:build      # génère le registre à partir de content/
npm start                  # puis « i » (iOS), « a » (Android) ou scanner le QR avec Expo Go
```

| Commande | Rôle |
| --- | --- |
| `npm start` | Lance le serveur de développement Expo |
| `npm run android` / `npm run ios` | Lance directement sur un appareil ou un émulateur |
| `npm run content:build` | Régénère `src/content/registry.generated.ts` depuis `content/` |
| `npm run content:check` | Valide tous les packs pédagogiques (erreurs et avertissements) |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests unitaires des algorithmes (75 tests) |
| `npm run verifier` | Contenu + types + tests, en une commande |

---

## Ce que fait l'application

**Espace enfant** — accueil très visuel, quatre gros boutons, aucune notion à chercher :

- 🎯 **Révision du jour** — sélection automatique (difficultés, répétition espacée, nouveautés)
- ⏱️ **5 minutes chrono** — une révision courte, format « avant le souper »
- ⚡ **Défi chronométré** — 90 secondes, un maximum de bonnes réponses
- 📚 **Choisir un sujet** — entraînement ciblé, plus deux mini-jeux (calcul, lecture)

**Espace parent** (protégé par un NIP à 4 chiffres) :

- 📊 **Tableau de bord** — réussite, activité sur 14 jours, contenu de la prochaine séance
- 🗓️ **Semaine** — activer/désactiver chaque sujet, régler la priorité (normal / à travailler / prioritaire)
- 🔍 **Analyse** — forces, difficultés, notions « comprises mais lentes », erreurs qui reviennent
- 📦 **Contenus** — importer un pack JSON (fichier ou copier-coller), voir et supprimer les packs

**Huit types de jeux** : choix multiples, vrai ou faux, mot à compléter, association,
mise en ordre, glisser-déposer, calcul rapide (pavé numérique intégré), compréhension de lecture.

---

## Ajouter la matière de la semaine

Trois façons, de la plus rapide à la plus durable :

1. **Activer ce qui existe déjà** — espace parent → *Semaine* → cocher les sujets. Aucune manipulation technique.
2. **Importer un pack JSON depuis l'application** — espace parent → *Contenus* → *Importer un fichier JSON*
   ou *Coller du JSON*. Le pack est validé, stocké localement et immédiatement jouable.
3. **Ajouter un pack au dépôt** — déposer le fichier dans `content/<matiere>/<sujet>.json`,
   puis `npm run content:check && npm run content:build`.

Le format complet est décrit dans **[docs/FORMAT-CONTENU.md](docs/FORMAT-CONTENU.md)** ;
un gabarit prêt à remplir se trouve dans **[docs/modele-pack.json](docs/modele-pack.json)**.

---

## Contenu livré

19 packs, 175 items (≈ 190 exercices jouables) alignés sur le
Programme de formation de l'école québécoise (2e cycle).

| Matière | Sujets couverts |
| --- | --- |
| Français | accords, conjugaison, homophones, vocabulaire, compréhension de lecture, écriture |
| Mathématique | nombres, multiplication, division, fractions, problèmes, mesures, géométrie |
| Univers social | Nouvelle-France vers 1745, Treize colonies vers 1745 |
| Science et technologie | matière et énergie, monde vivant |
| Anglais | vocabulary, sentences |

---

## Documentation

| Document | Contenu |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture, arborescence, choix techniques justifiés |
| [docs/FORMAT-CONTENU.md](docs/FORMAT-CONTENU.md) | Format JSON des packs, les 8 types d'items, la validation |
| [docs/SCHEMA-BD.md](docs/SCHEMA-BD.md) | Schéma SQLite, tables et migrations |
| [docs/ALGORITHMES.md](docs/ALGORITHMES.md) | Détection des difficultés, recommandation, répétition espacée, gamification |
| [docs/MAQUETTES.md](docs/MAQUETTES.md) | Maquettes textuelles de tous les écrans |
| [docs/PLAN-DEVELOPPEMENT.md](docs/PLAN-DEVELOPPEMENT.md) | Phases, MVP, fonctionnalités futures |
| [docs/GUIDE-PARENT.md](docs/GUIDE-PARENT.md) | Mode d'emploi hebdomadaire, sans jargon |

---

## Technologies

React Native · Expo SDK 57 · TypeScript (strict) · SQLite local (`expo-sqlite`) ·
React Navigation 7. Aucun serveur, aucun compte, aucune requête réseau.

## Vie privée

Les résultats, statistiques et réglages sont stockés dans une base SQLite sur l'appareil.
L'application ne contacte aucun service externe. Désinstaller l'application efface les données :
une sauvegarde de l'appareil est le seul moyen de les conserver.
