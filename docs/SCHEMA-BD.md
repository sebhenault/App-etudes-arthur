# Schéma de la base de données locale

Moteur : **SQLite** via `expo-sqlite`, fichier `defis-arthur.db` sur l'appareil.
Aucune synchronisation, aucun serveur. Journalisation WAL activée.

Les migrations sont numérotées et pilotées par le `PRAGMA user_version` :
`src/db/schema.ts` liste les migrations, `src/db/database.ts` applique celles qui manquent
au démarrage. Faire évoluer le schéma plus tard n'efface donc jamais l'historique d'Arthur.

## Vue d'ensemble

```
profiles ──┬── topic_settings      ce que le parent a activé cette semaine
           ├── sessions ── attempts   chaque partie, chaque réponse
           ├── exercise_states        répétition espacée (1 ligne / exercice)
           ├── skill_stats            agrégat par notion fine
           ├── progress               points, niveau, série de jours
           ├── achievements           médailles débloquées
           └── daily_activity         un agrégat par jour

imported_packs   packs JSON ajoutés par le parent (indépendant du profil)
settings         réglages généraux (NIP parent…)
```

## Tables

### `profiles`
| Colonne | Type | Rôle |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT | Prénom affiché (« Arthur ») |
| `grade` | INTEGER | Année scolaire — prévu pour la 5e et la 6e |
| `avatar_id`, `theme_id` | TEXT | Personnalisation débloquée par le niveau |
| `created_at` | INTEGER | Horodatage ms |

Un seul profil en pratique ; la table en accepte plusieurs pour une fratrie.

### `topic_settings` — le plan de la semaine
`PRIMARY KEY (profile_id, key)` où `key` vaut `"francais/accords"`.

| Colonne | Rôle |
| --- | --- |
| `enabled` | 0/1 — le sujet alimente-t-il les révisions ? |
| `weight` | 1 normal · 2 à travailler · 3 prioritaire (multiplie la priorité) |
| `week_label` | Étiquette libre, ex. « Semaine du 8 septembre » |

Les lignes manquantes sont créées au démarrage à partir de la bibliothèque
(`seedTopicSettings`), avec la valeur `defaultEnabled` du pack. **Un pack ajouté apparaît donc
tout seul dans le tableau de bord parent.**

### `imported_packs`
`pack_id` (PK), `subject`, `topic`, `title`, `json` (le pack brut), `imported_at`.
Le JSON est conservé intact : il peut être revalidé après une évolution du format.

### `sessions`
Une ligne par partie : `mode`, `subject`/`topic` (entraînement ciblé), `started_at`, `ended_at`,
`total`, `correct`, `points`, `stars`, `duration_ms`.
Une partie abandonnée est finalisée avec ce qui a été répondu.

### `attempts` — le journal de référence
Une ligne par réponse. C'est la source de vérité : tout le reste peut être recalculé à partir d'elle.

| Colonne | Rôle |
| --- | --- |
| `exercise_key` | `packId::itemId[::questionId]` |
| `pack_id`, `subject`, `topic`, `skill`, `kind` | Dénormalisés pour interroger sans jointure |
| `correct`, `score` | Réussite, et score partiel entre 0 et 1 |
| `response_ms` | Temps de réponse — sert à repérer les notions non automatisées |
| `given_answer`, `expected_answer` | Texte lisible → « erreur la plus fréquente » dans l'analyse |
| `used_hint` | Un indice utilisé réduit points et note de mémorisation |

Index : `(profile_id, created_at)`, `(profile_id, skill)`, `(profile_id, exercise_key)`.

### `exercise_states` — répétition espacée
`PRIMARY KEY (profile_id, exercise_key)`, index sur `(profile_id, due_at)`.

`ease` (1,3–2,8), `interval_days`, `repetitions`, `lapses`, `due_at`, `last_seen_at`,
`last_score`, `attempts`, `correct`.

Notion maîtrisée = `repetitions >= 3 AND interval_days >= 7`.

### `skill_stats` — agrégat par notion fine
`PRIMARY KEY (profile_id, skill)`.

`attempts`, `correct`, `recent_score` (moyenne mobile exponentielle, α = 0,35),
`avg_ms`, `last_seen_at`, `fail_streak`.

Cet agrégat est mis à jour à chaque réponse, ce qui évite de relire tout l'historique
pour afficher un écran.

### `progress`
`points`, `level`, `stars`, `streak_days`, `best_streak`, `last_active_day` (jour ISO),
`total_sessions`, `total_attempts`, `total_correct`, `total_ms`, `best_combo`, `perfect_sessions`.

### `achievements`
`PRIMARY KEY (profile_id, achievement_id)` + `unlocked_at`.
Seuls les identifiants sont stockés : la définition d'une médaille vit dans le JSON.

### `daily_activity`
`PRIMARY KEY (profile_id, day)` (jour `AAAA-MM-JJ`) : `sessions`, `attempts`, `correct`,
`points`, `ms`. Alimente le graphique des 14 derniers jours sans balayer `attempts`.

### `settings`
`key` / `value`. Contient le NIP parent (`parent.pin`).
Ce NIP est un **portillon parental**, pas un secret : il est stocké en clair, comme les
autres préférences. Il empêche l'enfant d'aller changer ses propres réglages, rien de plus.

## Requêtes typiques

```sql
-- Notions dues aujourd'hui
SELECT COUNT(*) FROM exercise_states WHERE profile_id = ? AND due_at <= ?;

-- Erreurs des 45 derniers jours, pour l'analyse
SELECT * FROM attempts WHERE profile_id = ? AND created_at >= ? ORDER BY created_at DESC;

-- Bonnes réponses par matière (médailles « As des maths »…)
SELECT subject, COUNT(*) FROM attempts WHERE profile_id = ? AND correct = 1 GROUP BY subject;
```

C'est exactement ce qui justifie SQLite plutôt qu'AsyncStorage : ces questions se posent
en SQL et se répondent en millisecondes, sans charger l'historique en mémoire.

## Effacement

*Réglages → Effacer la progression* vide `attempts`, `sessions`, `exercise_states`,
`skill_stats`, `achievements`, `daily_activity` et `progress`.
**Sont conservés** : le profil, les réglages de sujets et les packs importés — on remet
les compteurs à zéro sans avoir à tout reconfigurer.
