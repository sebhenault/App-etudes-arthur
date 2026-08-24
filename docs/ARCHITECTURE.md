# Architecture

## 1. Principe directeur

L'application est une **plateforme générique de révision**, pas une collection d'exercices codés
en dur. Le code sait *jouer* huit types d'exercices, *mesurer* des résultats et *décider* quoi
proposer ensuite. Il ne sait rien des accords du groupe du nom ni des tables de multiplication :
cela vit dans des fichiers JSON.

```
       CONTENU (données)                    CODE (comportement)
  ┌──────────────────────────┐        ┌──────────────────────────────┐
  │ content/manifest.json    │        │ 8 moteurs de jeu             │
  │ content/francais/*.json  │ ─────► │ correction + score partiel   │
  │ content/mathematique/... │        │ répétition espacée           │
  │ content/config/*.json    │        │ détection des difficultés    │
  │ packs importés (SQLite)  │        │ gamification                 │
  └──────────────────────────┘        └──────────────────────────────┘
              ▲
              │ l'enseignante envoie son plan → on ajoute un JSON
              │ (aucune modification de code, aucune republication)
```

Conséquence concrète : couvrir la 5e puis la 6e année ne demandera **aucun développement**,
seulement de nouveaux packs.

## 2. Couches

```
┌───────────────────────────────────────────────────────────────┐
│  Écrans (src/screens)        Espace enfant · Espace parent     │
├───────────────────────────────────────────────────────────────┤
│  Composants (src/components) UI réutilisable · 8 jeux          │
├───────────────────────────────────────────────────────────────┤
│  État (src/state)            AppContext · useGameSession       │
├───────────────────────────────────────────────────────────────┤
│  Domaine (src/domain)        srs · mastery · recommendation    │
│                              gamification  (100 % pur, testé)  │
├───────────────────────────────────────────────────────────────┤
│  Contenu (src/content)       types · validation · library      │
├───────────────────────────────────────────────────────────────┤
│  Données (src/db)            schema · database · repositories  │
└───────────────────────────────────────────────────────────────┘
```

Règles de dépendance, tenues strictement :

- `domain/` **ne dépend de rien** — ni de React, ni de SQLite, ni d'Expo. C'est pourquoi les
  algorithmes sont testables en une milliseconde avec `node --test`.
- `db/` est le **seul** endroit qui écrit du SQL. Un écran n'ouvre jamais la base.
- `content/` ne connaît pas la base : il transforme du JSON en exercices jouables.
- `state/` fait le lien : il lit la base, appelle le domaine, expose des données prêtes à afficher.

## 3. Arborescence

```
App-etudes-arthur/
├── App.tsx                        Racine : providers + gestion du démarrage
├── index.ts                       Point d'entrée Expo
├── app.json                       Configuration Expo (nom, icônes, plugins)
│
├── content/                       ◄── TOUT LE CONTENU PÉDAGOGIQUE
│   ├── manifest.json                  Matières, sujets, couleurs, emojis, ordre
│   ├── config/
│   │   ├── achievements.json          Médailles (déclaratif : métrique + cible)
│   │   └── recompenses.json           Avatars et thèmes débloquables
│   ├── francais/                      accords · conjugaison · homophones ·
│   │                                  vocabulaire · lecture · ecriture
│   ├── mathematique/                  numeration · multiplication · division ·
│   │                                  fractions · problemes · mesures · geometrie
│   ├── univers-social/                nouvelle-france · treize-colonies
│   ├── science/                       matiere-energie · vivant
│   └── anglais/                       vocabulary · sentences
│
├── scripts/
│   ├── validate-content.mjs       npm run content:check
│   ├── build-content-registry.mjs npm run content:build
│   └── lib/
│       ├── read-content.mjs           Parcours du dossier content/
│       ├── resolve-hooks.mjs          Pont Metro ↔ Node (JSON + extensions .ts)
│       └── register-hooks.mjs
│
├── tests/                         75 tests unitaires du domaine et du contenu
│   ├── contenu.test.mjs
│   ├── exercices.test.mjs
│   ├── gamification.test.mjs
│   ├── mastery.test.mjs
│   ├── recommandation.test.mjs
│   └── srs.test.mjs
│
├── docs/                          Cette documentation
│
└── src/
    ├── components/
    │   ├── ui/index.tsx           Screen, Card, BigButton, ProgressBar, Stars,
    │   │                          StatTile, Chip, Badge, ToggleRow, EmptyState…
    │   └── games/
    │       ├── index.tsx          GameRenderer : aiguillage type → composant
    │       ├── GameShell.tsx      Cadre commun + bandeau de correction
    │       ├── ChoiceGame.tsx     qcm + lecture
    │       ├── TrueFalseGame.tsx  vraiFaux
    │       ├── FillBlankGame.tsx  texteATrous
    │       ├── NumberGame.tsx     calcul (pavé numérique intégré)
    │       ├── MatchGame.tsx      association
    │       ├── OrderGame.tsx      ordre
    │       └── SortGame.tsx       classement (glisser-déposer réel)
    │
    ├── content/
    │   ├── types.ts               Types du format de contenu
    │   ├── validation.ts          Validateur unique (build ET import à l'exécution)
    │   ├── exercises.ts           JSON → exercices jouables + correction
    │   ├── library.ts             Fusion packs livrés + importés → arbre matières
    │   └── registry.generated.ts  GÉNÉRÉ — imports statiques des JSON
    │
    ├── db/
    │   ├── schema.ts              DDL + migrations numérotées
    │   ├── database.ts            Ouverture, PRAGMA, migration
    │   └── repositories.ts        Toutes les requêtes SQL de l'application
    │
    ├── domain/
    │   ├── types.ts               Tentative, état de mémorisation, progression…
    │   ├── srs.ts                 Répétition espacée
    │   ├── mastery.ts             Forces, difficultés, erreurs fréquentes
    │   ├── recommendation.ts      Construction de la file d'exercices
    │   └── gamification.ts        Points, niveaux, étoiles, séries, médailles
    │
    ├── navigation/
    │   ├── types.ts               Types des routes
    │   └── RootNavigator.tsx      Pile + deux jeux d'onglets
    │
    ├── screens/
    │   ├── enfant/                Accueil · ChoisirSujet · Jeu · Résultat ·
    │   │                          Médailles · Moi
    │   └── parent/                Verrou · TableauBord · Semaine · Analyse ·
    │                              Contenus · Réglages
    │
    ├── state/
    │   ├── AppContext.tsx         Profil, bibliothèque, réglages, progression
    │   └── useGameSession.ts      Déroulement d'une partie de bout en bout
    │
    ├── theme/index.ts             Couleurs, espacements, typographie, ombres
    └── utils/random.ts            Mélange déterministe (graine dérivée de la clé)
```

## 4. Modèles de données

### 4.1 Contenu (fichiers JSON)

```
ContentManifest
 └── SubjectMeta { key, label, emoji, color, order }
      └── TopicMeta { key, label, emoji }

ContentPack { schemaVersion, id, title, subject, topic, grade,
              difficulty, source, tags, defaultEnabled, items[] }
 └── ContentItem = QcmItem | VraiFauxItem | TexteATrousItem | AssociationItem
                 | OrdreItem | ClassementItem | CalculItem | LectureItem
```

### 4.2 Contenu à l'exécution

```
Exercise { key, packId, subject, topic, skill, difficulty,
           hint, explanation, timeTargetMs, prompt }
```

`key` est unique dans toute l'application : `packId::itemId[::questionId]`.
C'est la clé de la répétition espacée. Un item `lecture` de 4 questions produit
4 exercices distincts, tous porteurs du même texte : chaque question est donc
suivie individuellement.

### 4.3 Données locales

`AttemptRecord` (chaque réponse), `ExerciseState` (mémorisation),
`SkillStat` (agrégat par notion fine), `ProgressState` (points, niveau, série),
`TopicSetting` (activation parent). Voir [SCHEMA-BD.md](SCHEMA-BD.md).

## 5. Navigation

```
RootStack
├── Enfant ─────────── Onglets : 🎮 Jouer · 🏅 Médailles · 🙂 Moi
├── ChoisirSujet
├── Jeu               (plein écran, geste retour désactivé, bilan intégré)
├── VerrouParent      NIP à 4 chiffres
├── Parent ─────────── Onglets : 📊 Tableau · 🗓️ Semaine · 🔍 Analyse · 📦 Contenus
└── Reglages
```

L'enfant ne peut pas atteindre l'espace parent par accident : le cadenas est en haut à droite
de l'accueil et mène au NIP. Il ne s'agit pas de sécurité mais d'un portillon — voir
`VerrouScreen.tsx`.

## 6. Choix techniques justifiés

| Décision | Pourquoi | Alternative écartée |
| --- | --- | --- |
| **Contenu en JSON, code générique** | La contrainte principale n'est pas de coder des exercices mais d'en ajouter chaque semaine pendant des années. Le JSON permet à un non-développeur d'écrire du contenu, et rend la 5e–6e année gratuite en développement. | Exercices codés en TSX : rapide au début, ingérable dès la 3e semaine. |
| **Registre généré (`content:build`)** | Metro ne peut pas parcourir un dossier à l'exécution : chaque JSON doit être importé statiquement. Un script écrit ces imports et valide au passage. | `require.context` (fragile selon les versions), ou lister les packs à la main (oubli garanti). |
| **Import de packs à l'exécution** | Le vrai cas d'usage : l'enseignante envoie un plan, on l'ajoute le soir même depuis le téléphone, sans ordinateur ni republication. | Attendre une mise à jour de l'app. |
| **Validateur unique partagé** | `src/content/validation.ts` sert au script de build *et* à l'import dans l'app. Un pack accepté en ligne de commande le sera aussi sur le téléphone. | Deux validateurs qui divergent au bout de deux mois. |
| **SQLite plutôt qu'AsyncStorage** | On veut des questions comme « les erreurs des 45 derniers jours regroupées par exercice » ou « les notions dues aujourd'hui ». C'est du SQL, pas de la sérialisation d'objets. AsyncStorage obligerait à tout charger en mémoire et à filtrer en JavaScript. | AsyncStorage : suffisant pour des préférences, pas pour un historique d'apprentissage. |
| **Domaine sans dépendances** | Les algorithmes (répétition espacée, diagnostic, recommandation) sont la valeur du projet. Isolés, ils se testent sans simulateur, sans base, sans React. | Logique dans les composants : intestable, donc non testée. |
| **React Navigation plutôt qu'expo-router** | Les routes de l'app sont peu nombreuses et deux espaces cohabitent (enfant / parent) avec des règles différentes. Les déclarer explicitement dans `RootNavigator.tsx` rend cette séparation lisible. | expo-router : excellent pour du web multi-pages, moins parlant ici. |
| **`PanResponder` du cœur de React Native** | Le glisser-déposer n'a besoin que d'un suivi de doigt et d'un test de zone. Reanimated 4 imposerait un plugin Babel, des worklets et une source de pannes au build pour un seul écran. | react-native-reanimated / gesture-handler. |
| **Aucune police d'icônes** | Les emojis sont expressifs, multiplateformes, sans chargement asynchrone et sans écran blanc au démarrage. Le public visé les comprend mieux que des pictogrammes. | `@expo/vector-icons`. |
| **Mélange déterministe** | Les jeux mélangent leurs étiquettes. Avec `Math.random()` direct, chaque rendu redistribue les boutons sous le doigt de l'enfant. La graine dérive de la clé de l'exercice : mélange stable pendant la partie, différent d'un exercice à l'autre. | `Math.random()` à chaque rendu. |
| **Correction au tap pour les QCM** | À 9 ans, un bouton « Valider » supplémentaire casse le rythme sans rien apporter. Les jeux à saisie ou à plusieurs éléments gardent un bouton « Vérifier », car on doit pouvoir se reprendre. | Bouton de validation systématique. |
| **Score partiel** | Classer 4 étiquettes sur 6 n'est pas un échec total. Le score partiel alimente les points et la note de mémorisation, ce qui évite de décourager sur les jeux longs. | Tout ou rien. |
| **Tests en `node --test`** | Zéro dépendance de test à maintenir, exécution en ~300 ms. Node 22 supprime les types TypeScript nativement ; deux hooks de résolution comblent l'écart avec Metro. | Jest : configuration lourde pour tester des fonctions pures. |

## 7. Cycle de vie d'une partie

```
AccueilEnfant ──► Jeu (mode)
                   │
                   ├─ useGameSession
                   │    1. lit états de mémorisation + statistiques (SQLite)
                   │    2. buildSession() : filtre (sujets actifs, mode),
                   │       score, réserve 25 % de nouveautés, entrelace
                   │    3. ouvre une ligne dans `sessions`
                   │
                   ├─ pour chaque exercice :
                   │    GameRenderer ─► réponse ─► gradeExercise()
                   │      ├─ points        computePoints()
                   │      ├─ tentative     INSERT attempts
                   │      ├─ mémorisation  review() → UPSERT exercise_states
                   │      └─ agrégat       applyAttempt() → UPSERT skill_stats
                   │
                   └─ fin : étoiles, série de jours, niveau, médailles,
                            activité quotidienne, puis bilan à l'écran
```

Une partie abandonnée est enregistrée telle quelle : les réponses déjà données comptent.

## 8. Extensibilité

**Ajouter une notion** → un fichier JSON (ou un import depuis l'app). Zéro code.

**Ajouter une médaille** → un objet dans `content/config/achievements.json`
(`metric` + `target`). Métriques disponibles : `sessions`, `perfectSessions`, `streakDays`,
`totalCorrect`, `level`, `points`, `bestCombo`, `masteredExercises`, `subjectCorrect` (+ `scope`).

**Ajouter une matière** → une entrée dans `content/manifest.json`. Un pack déclarant une
matière inconnue reste jouable : `library.ts` crée le nœud manquant automatiquement.

**Ajouter un type de jeu** → c'est le seul cas qui demande du code : un variant dans
`ContentItem`, une branche dans `validation.ts`, `exercises.ts` (conversion et correction),
un composant dans `components/games/`, une ligne dans `GameRenderer`. Environ 150 lignes.

**Passer à la 5e et à la 6e année** → de nouveaux packs avec `grade: 5`. Le champ existe déjà
dans le format et dans la table `profiles`.
