# Algorithmes

Quatre modules purs, sans dépendance à React ni à SQLite, couverts par 75 tests unitaires
(`npm test`). Ce sont eux qui font la différence entre « une appli de quiz » et
« un outil qui sait quoi réviser ».

---

## 1. Répétition espacée — `src/domain/srs.ts`

Inspiré de SM-2, avec deux adaptations pour un enfant de 9-10 ans.

**Adaptation 1 — la note est déduite, pas demandée.** SM-2 demande à l'apprenant d'auto-évaluer
sa difficulté de rappel. Un enfant ne peut pas fournir cette information de façon fiable.
La note est donc calculée :

| Situation | Note |
| --- | --- |
| Rapide (≤ 60 % du temps visé) et juste | 5 |
| Juste dans un délai normal (≤ 150 %) | 4 |
| Juste mais lent, ou avec un indice | 3 |
| Faux avec un score partiel ≥ 0,5 | 2 |
| Faux avec un score partiel > 0 | 1 |
| Complètement faux | 0 |

**Adaptation 2 — des intervalles courts.** L'horizon utile est la semaine scolaire :
`1 → 2 → 4 → 7 → 14 → 30` jours, plafonné à 60. Une notion ratée revient à `dueAt = maintenant`,
donc dès la séance suivante — souvent le jour même.

```
ease ← clamp(ease + 0,1 − (5 − note) × (0,08 + (5 − note) × 0,02),  1,3 … 2,8)

réussite (note ≥ 3) :  repetitions++ ; intervalle = palier[repetitions]
                       note = 3 exactement → intervalle × 0,6 (l'hésitation ne fait
                                                   pas gagner un palier complet)
échec    (note < 3) :  repetitions = 0 ; intervalle = 0 ; lapses++ si déjà su
```

**Maîtrise** : `repetitions ≥ 3` **et** `intervalDays ≥ 7`. Trois bonnes réponses d'affilée
le même jour ne prouvent rien ; c'est l'espacement qui prouve la mémorisation.

---

## 2. Détection des difficultés — `src/domain/mastery.ts`

L'unité d'analyse est la **notion fine** (`skill`), pas la matière. C'est ce qui permet de dire
« Arthur bloque sur les tables de 7 et 8 » au lieu de « Arthur a 68 % en mathématique ».

### Moyenne mobile exponentielle

```
recentScore ← recentScore × (1 − α) + score × α        avec α = 0,35
```

Le taux de réussite global est un mauvais indicateur de progrès : après dix échecs, dix réussites
ne le font monter qu'à 50 %, et l'enfant reste étiqueté « en difficulté » alors qu'il a compris.
La moyenne mobile, elle, remonte en trois ou quatre réponses. C'est exactement ce que teste
`mastery.test.mjs` : *« la moyenne mobile réagit vite à une remontée »*.

### Classement

| Niveau | Condition |
| --- | --- |
| `nouveau` | moins de 3 tentatives — **aucune conclusion n'est tirée** |
| `difficulte` | `recentScore < 0,6` **ou** 2 échecs consécutifs |
| `maitrise` | `recentScore ≥ 0,85` et ≥ 4 tentatives et taux global ≥ 0,75 |
| `en-cours` | tout le reste |

Le déclencheur « 2 échecs consécutifs » attrape les régressions récentes qu'une moyenne
lisserait — typiquement une notion revue en classe d'une nouvelle façon.

### Réussi mais lent

Une notion classée `maitrise` ou `en-cours` avec un temps moyen > 25 s est signalée
**à consolider**. Comprise, mais pas automatisée : c'est le cas typique des tables de
multiplication qu'on recalcule au lieu de les savoir. Le remède proposé est le défi chronométré.

### Erreurs fréquentes

Les tentatives sont regroupées par exercice ; à partir de 2 erreurs, l'exercice est signalé
avec **la réponse erronée la plus souvent donnée**. Cette réponse est plus instructive que le
taux d'échec : si Arthur écrit systématiquement « son » à la place de « sont », le parent voit
la confusion exacte, pas seulement un pourcentage.

---

## 3. Recommandation — `src/domain/recommendation.ts`

### Étape 1 — filtrer

- sujets désactivés par le parent → exclus (sauf entraînement explicitement ciblé) ;
- contraintes du mode : le défi chronométré ne garde que les types rapides
  (`qcm`, `vraiFaux`, `calcul`), le mini-jeu de lecture uniquement les questions de lecture,
  le mini-jeu de calcul uniquement les mathématiques.

### Étape 2 — donner une priorité

| Raison | Base | Détection |
| --- | --- | --- |
| `difficulte` | 10 | La notion est diagnostiquée en difficulté |
| `revision-due` | 7 | Déjà vu, `dueAt` atteint |
| `en-cours` | 5 | En apprentissage |
| `nouveau` | 4 | Jamais rencontré |
| `entretien` | 1 | Maîtrisé et pas encore dû |

```
score  = base
       + min(joursDeRetard, 7) × 0,5      révision en retard = plus urgente
       + min(lapses, 3) × 0,7             notion déjà oubliée par le passé
       + min(failStreak, 3) × 0,8         échecs récents consécutifs
       − 3                                si maîtrisé et non dû
score ×= poids du sujet (1, 2 ou 3, réglé par le parent)
score ×= aléa entre 0,85 et 1,15          deux parties ne sont jamais identiques
```

### Étape 3 — réserver de la nouveauté

**Au moins 25 % de la partie est réservée à des exercices jamais vus**, et cette réservation est
faite *avant* la troncature à la longueur voulue. Sans cela, un enfant qui accumule du retard ne
verrait plus jamais de contenu neuf : les révisions dues, mieux notées, prendraient toutes les
places. (Ce défaut existait dans la première version et est verrouillé par un test.)

### Étape 4 — entrelacer

Deux exercices consécutifs ne portent jamais sur la même notion, et si possible pas sur le même
type de jeu. L'entrelacement (*interleaving*) est mieux établi que le blocage par thème pour la
rétention, et il évite l'effet « dix additions de suite » qui fait décrocher.

### Longueurs par défaut

| Mode | Exercices |
| --- | --- |
| Révision du jour | 12 |
| 5 minutes chrono | 10 |
| Entraînement ciblé | 12 |
| Défi chronométré | 15 (ou jusqu'à la fin des 90 s) |
| Calcul éclair | 12 |
| Lecture détective | 8 |

`explainNextSession()` retourne le même résultat en langage clair — c'est ce qu'affiche le
tableau de bord parent sous « La prochaine révision travaillera ».

---

## 4. Gamification — `src/domain/gamification.ts`

### Points

```
base        = 10 × multiplicateur(difficulté 1/2/3 → 1 / 1,2 / 1,5) × score
              (× 0,7 si un indice a été utilisé)
rapidité    = 5 × (1 − temps / tempsVisé)        si juste et plus rapide que la cible
série       = min(combo, 5) × 2                  plafonné, pour ne pas tout miser sur l'enchaînement
total       = base + rapidité + série
```

Le **score partiel** compte : classer 4 étiquettes sur 6 rapporte les deux tiers des points.
Un jeu long raté de peu ne doit pas donner l'impression d'avoir travaillé pour rien.

### Niveaux

`pointsPourNiveau(n) = 150 × (n−1) + 75 × (n−1)(n−2)/2` → 0, 150, 375, 675, 1050, 1500…
Chaque palier coûte 75 points de plus que le précédent : la progression reste visible longtemps
sans devenir instantanée.

### Étoiles

3 étoiles à partir de 90 % de réussite, 2 à 70 %, 1 à 50 %.

### Série de jours

Comparaison de jours calendaires locaux. Jouer deux jours de suite allonge la série ;
sauter un jour la remet à 1 sans effacer le record ; rejouer le même jour ne compte pas deux fois.

### Médailles

Chaque médaille est un couple *(métrique, cible)* décrit en JSON — voir
[FORMAT-CONTENU.md](FORMAT-CONTENU.md#5-médailles-et-récompenses). Le code ne connaît aucune
médaille en particulier : il évalue des métriques. Ajouter une médaille ne demande donc
aucune modification de code.

### Déblocages

Avatars et thèmes s'ouvrent à des niveaux donnés. L'accueil affiche en permanence la
**prochaine** récompense et le nombre de points qui en séparent : un objectif proche et concret
motive mieux qu'un compteur abstrait.

---

## 5. Ce que les algorithmes ne font pas

- **Aucun jugement de valeur affiché à l'enfant.** Le bilan de partie propose « on refait ça
  ensemble demain », jamais « tu es faible en français ». Le diagnostic détaillé est réservé
  au parent.
- **Aucune conclusion sur données insuffisantes.** Moins de 3 tentatives → `nouveau`.
- **Aucun envoi de données.** Tout est calculé sur l'appareil, à partir de la base locale.
