# Format des contenus pédagogiques

Ce document est le contrat entre celui qui écrit les exercices et l'application.
Il suffit de le suivre pour ajouter n'importe quelle notion, sans toucher au code.

## 1. Où déposer un contenu

| Situation | Marche à suivre |
| --- | --- |
| J'ai un ordinateur et le dépôt | Créer `content/<matiere>/<sujet>.json`, puis `npm run content:check && npm run content:build` |
| Je n'ai que le téléphone | Espace parent → **Contenus** → *Importer un fichier JSON* ou *Coller du JSON* |

Dans les deux cas, **le même validateur** s'applique (`src/content/validation.ts`) :
un pack accepté en ligne de commande le sera aussi sur le téléphone.

Un pack importé qui porte l'`id` d'un pack existant le **remplace** : c'est ainsi qu'on corrige
une coquille ou qu'on enrichit un contenu déjà livré.

## 2. Structure d'un pack

```jsonc
{
  "schemaVersion": 1,              // obligatoire — version du format
  "id": "fr-accords-01",           // obligatoire — unique parmi TOUS les packs
  "title": "Les accords dans la phrase",
  "subject": "francais",           // clé de matière (voir manifest.json)
  "topic": "accords",              // clé de sujet
  "grade": 4,
  "difficulty": 2,                 // 1 facile · 2 moyen · 3 difficile (défaut des items)
  "estimatedMinutes": 6,
  "source": "PFEQ – Écrire des textes variés · Cahier Terminus 4e",
  "description": "…",
  "tags": ["accord", "groupe du nom"],
  "defaultEnabled": true,          // le sujet est-il actif à la première ouverture ?
  "items": [ /* … */ ]
}
```

Un **gabarit prêt à remplir** : [`docs/modele-pack.json`](modele-pack.json).

### Champs communs à tous les items

| Champ | Obligatoire | Rôle |
| --- | --- | --- |
| `id` | oui | Unique **dans le pack** |
| `type` | oui | Un des 8 types ci-dessous |
| `skill` | fortement recommandé | Étiquette fine de la notion (`accord-sujet-verbe`, `table-7`). **C'est l'unité d'analyse des difficultés.** Sans elle, le diagnostic reste au niveau du sujet. |
| `difficulty` | non | 1, 2 ou 3 — remplace celle du pack |
| `hint` | non | Indice ; l'utiliser réduit les points et la note de mémorisation |
| `explanation` | non | Affichée après la réponse. **Le champ le plus utile du format** : c'est là que l'enfant apprend. |
| `timeTargetMs` | non | Temps visé pour le bonus de rapidité (valeur par défaut selon le type) |

## 3. Les huit types d'items

### `qcm` — choix multiples
```json
{ "id": "q1", "type": "qcm", "skill": "accord-nom-adjectif",
  "question": "Quelle phrase est correctement accordée ?",
  "choices": ["Les grandes maisons blanches.", "Les grande maisons blanche."],
  "answer": 0,
  "explanation": "L'adjectif reçoit le genre et le nombre du nom." }
```
`answer` est l'**index** (à partir de 0) dans `choices`. 2 à 4 choix ; au-delà, l'écran devient chargé.

### `vraiFaux`
```json
{ "id": "q2", "type": "vraiFaux", "skill": "accord-sujet-verbe",
  "statement": "Dans « Les oiseaux chantent », le sujet est « Les oiseaux ».",
  "answer": true }
```

### `texteATrous` — mot à compléter
```json
{ "id": "q3", "type": "texteATrous", "skill": "homophone-a",
  "prompt": "Ma sœur ___ terminé ses devoirs.",
  "answers": ["a"],
  "hint": "Remplace par « avait »." }
```
`___` marque le trou. `answers` liste **toutes** les réponses acceptées.
La comparaison ignore la casse, les accents et la ponctuation :
`"épuisé"` accepte `epuise`, `Épuisé`, `épuisé.`.

### `association` — relier deux colonnes
```json
{ "id": "q4", "type": "association", "skill": "synonyme",
  "instruction": "Associe chaque mot à son synonyme.",
  "pairs": [ { "left": "content", "right": "joyeux" },
             { "left": "rapide",  "right": "vite" } ] }
```
2 à 6 paires. **Aucune valeur `right` ne doit apparaître deux fois** — sinon l'association
serait ambiguë, et le validateur refuse le pack.

### `ordre` — remettre en ordre
```json
{ "id": "q5", "type": "ordre", "skill": "structure-recit",
  "instruction": "Remets les étapes du récit en ordre.",
  "sequence": ["Situation de départ", "Élément déclencheur", "Péripéties", "Dénouement"] }
```
`sequence` contient les éléments **dans le bon ordre** ; l'application les mélange à l'affichage.
Correction position par position, avec score partiel.

### `classement` — glisser-déposer
```json
{ "id": "q6", "type": "classement", "skill": "genre-nombre",
  "instruction": "Glisse chaque groupe dans la bonne colonne.",
  "buckets": ["Singulier", "Pluriel"],
  "tokens": [ { "text": "un chandail chaud", "bucket": "Singulier" },
              { "text": "des bottes mouillées", "bucket": "Pluriel" } ] }
```
2 ou 3 colonnes (au-delà, c'est illisible sur un téléphone), 4 à 6 étiquettes.
Chaque `bucket` d'un token doit exister dans `buckets`.

### `calcul` — réponse numérique
```json
{ "id": "q7", "type": "calcul", "skill": "table-7",
  "question": "7 × 8 = ?", "answer": 56,
  "unit": "cm", "tolerance": 0, "timeTargetMs": 6000 }
```
Pavé numérique intégré (chiffres, signe moins, effacement).
`tolerance` autorise une marge d'erreur ; `unit` est purement décoratif.

### `lecture` — texte suivi de questions
```json
{ "id": "q8", "type": "lecture",
  "passage": { "title": "La cabane à sucre", "text": "Chaque printemps, …" },
  "questions": [
    { "id": "a", "question": "Quand la sève coule-t-elle ?",
      "choices": ["Au printemps", "En été"], "answer": 0, "skill": "reperage-information" },
    { "id": "b", "question": "Pourquoi faut-il de la patience ?",
      "choices": ["…", "…"], "answer": 1, "skill": "inference" }
  ] }
```
**Chaque question devient un exercice indépendant** (le texte reste affiché au-dessus).
Une question peut porter sa propre `skill` : on distingue ainsi le repérage d'information
de l'inférence, deux compétences très différentes à l'épreuve ministérielle.

## 4. Le manifeste des matières

`content/manifest.json` décrit les matières et sujets, leur libellé, leur emoji, leur couleur
et leur ordre d'affichage.

```json
{ "key": "francais", "label": "Français", "emoji": "📚", "color": "#5B7CFA", "order": 1,
  "topics": [ { "key": "accords", "label": "Les accords", "emoji": "🧩" } ] }
```

Un pack qui déclare une matière ou un sujet **absent du manifeste reste jouable** :
l'application crée le nœud manquant en dérivant le libellé de la clé
(`nouvelle-france` → « Nouvelle france »). Le validateur émet alors un avertissement,
pas une erreur — l'ajout urgent d'un contenu n'est jamais bloqué par un oubli de manifeste.

## 5. Médailles et récompenses

`content/config/achievements.json` — une médaille = une métrique et une cible :

```json
{ "id": "serie-7", "label": "Une semaine complète", "emoji": "🗓️",
  "description": "Joue 7 jours d'affilée.",
  "metric": "streakDays", "target": 7, "tier": "or" }
```

| Métrique | Mesure |
| --- | --- |
| `sessions` | parties terminées |
| `perfectSessions` | parties sans aucune erreur (au moins 5 exercices) |
| `streakDays` | jours consécutifs |
| `totalCorrect` | bonnes réponses cumulées |
| `level`, `points` | niveau atteint, points cumulés |
| `bestCombo` | plus longue série de bonnes réponses d'affilée |
| `masteredExercises` | notions maîtrisées (3 réussites + intervalle ≥ 7 jours) |
| `subjectCorrect` | bonnes réponses dans une matière — préciser `"scope": "francais"` |

`tier` (`bronze`, `argent`, `or`) ne sert qu'à la couleur du cadre.

`content/config/recompenses.json` — avatars et thèmes, débloqués par `unlockLevel`.

## 6. Validation

```bash
npm run content:check     # rapport détaillé, sortie non nulle si erreur
npm run content:build     # revalide puis régénère le registre
```

**Erreurs** (le pack est refusé) : `schemaVersion` manquant ou trop récent, `id`/`title`/`subject`/
`topic`/`grade` manquants, type inconnu, identifiants d'items en double, index de réponse hors
des choix, `answers` vide, association ambiguë, token visant une colonne inexistante,
moins de deux choix, `answer` non booléen pour un `vraiFaux`.

**Avertissements** (le pack passe) : item sans `skill`, moins de 6 exercices jouables,
deux choix identiques, colonne sans aucune étiquette, plus de 6 paires, sujet absent
du manifeste, sujet du manifeste sans aucun pack.

## 7. Conseils de rédaction pour la 4e année

- **Une notion par item.** Un exercice qui teste l'accord *et* la conjugaison ne dit rien
  sur ce qui bloque.
- **Toujours remplir `explanation`.** C'est le moment où l'enfant apprend quelque chose.
  Formuler la règle, pas le constat : « L'adjectif reçoit le genre et le nombre du nom »
  plutôt que « Non, ce n'est pas ça ».
- **Choisir des distracteurs réalistes.** Une mauvaise réponse doit correspondre à une erreur
  que l'enfant fait vraiment : l'écran d'analyse affiche la réponse erronée la plus fréquente,
  ce qui révèle la confusion exacte.
- **Nommer les `skill` de façon stable.** `table-7` dans tous les packs de multiplication permet
  d'agréger. Un `skill` renommé repart de zéro dans les statistiques.
- **Viser 8 à 14 items par pack** : de quoi alimenter plusieurs révisions de 5 minutes.
- **Ancrer dans le quotidien québécois** (cabane à sucre, hockey, tuque, fleuve Saint-Laurent) :
  la compréhension de lecture y gagne beaucoup.
- **`timeTargetMs` court sur les automatismes** (6 s pour une table), long sur le raisonnement.
