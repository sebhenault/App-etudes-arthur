# Plan de développement

## Où en est le projet

Les phases 1 à 5 sont **livrées et vérifiables** (`npm run verifier` : contenu, types, 75 tests).
Le MVP est dépassé : l'application est utilisable telle quelle au quotidien.

---

## Phase 0 — Socle (fait)

- Projet Expo SDK 57 + TypeScript strict, React Navigation 7
- Thème, bibliothèque de composants réutilisables
- Base SQLite avec migrations numérotées

## Phase 1 — Plateforme de contenu (fait)

C'est la phase qui décide de la durée de vie du projet, donc elle vient **avant** les jeux.

- Format JSON documenté, 8 types d'items
- Validateur unique partagé build / exécution
- Script de génération du registre (`npm run content:build`)
- Bibliothèque à l'exécution : fusion packs livrés + importés, création automatique
  des matières inconnues
- 19 packs, 175 items alignés PFEQ

## Phase 2 — Moteur de jeu (fait)

- Les 8 composants de jeu, dont un glisser-déposer réel (`PanResponder`)
- Correction avec score partiel, explication après chaque réponse
- Enregistrement de chaque tentative (résultat, temps, réponse donnée)

## Phase 3 — Progression et motivation (fait)

- Points (difficulté, rapidité, série), niveaux, étoiles
- Série de jours consécutifs
- 16 médailles déclaratives, avatars et thèmes débloquables
- Bilan de partie avec encouragement adapté au résultat

## Phase 4 — Intelligence (fait)

- Répétition espacée adaptée aux enfants
- Détection des difficultés par notion fine, avec moyenne mobile
- Repérage « réussi mais lent »
- Erreurs fréquentes avec réponse erronée dominante
- Construction de séance : priorités, quota de nouveauté, entrelacement

## Phase 5 — Espace parent (fait)

- Verrou NIP
- Tableau de bord : indicateurs, activité 14 jours, aperçu de la prochaine séance
- Plan de la semaine : activation par sujet, poids de priorité, étiquette de semaine
- Analyse détaillée
- Gestion des contenus : import fichier ou copier-coller, suppression
- Réglages : prénom, NIP, remise à zéro

---

## Ce que serait le MVP minimal

Si le projet devait être refait avec le moins d'effort possible, ce sous-ensemble suffirait
à être utile dès le premier soir (≈ 2 jours de travail) :

1. Format JSON + validateur (phase 1) — **non négociable**, tout le reste en dépend
2. Deux types de jeux : `qcm` et `calcul`
3. Écran de jeu + bilan
4. Activation des sujets par le parent
5. Points et série de jours
6. Enregistrement des tentatives dans SQLite

Tout le reste (répétition espacée, analyse, six autres types de jeux, médailles) s'ajoute
ensuite **sans rien casser**, parce que les tentatives sont enregistrées depuis le premier jour.
C'est le seul choix vraiment irréversible : commencer à collecter les données tout de suite.

---

## Prochaines étapes suggérées

### Phase 6 — Usage réel (priorité haute)

| Élément | Pourquoi |
| --- | --- |
| **Rappel quotidien** (`expo-notifications`, local uniquement) | « Ta révision de 5 minutes t'attend » à 18 h 30. La régularité est le premier facteur de progrès. |
| **Sauvegarde / restauration** (export JSON via `expo-sharing`) | Aujourd'hui, désinstaller efface tout. Un export manuel suffit. |
| **Retour haptique** (`expo-haptics`, déjà installé) | Une vibration courte à la bonne réponse rend la correction plus lisible. |
| **Sons** | Les mêmes signaux, pour ceux qui jouent sans regarder. |

### Phase 7 — Contenu

| Élément | Pourquoi |
| --- | --- |
| **Doubler la bibliothèque** (≈ 400 items) | Trois semaines d'usage épuisent la nouveauté sur les sujets étroits. |
| **Générateur d'exercices de calcul** | Un pack pourrait décrire une *règle* (« multiplications à deux chiffres ») plutôt que 12 items figés — inépuisable, sans rédaction. |
| **Dictée audio** (`expo-speech`) | Type d'item `dictee` : l'appareil lit la phrase, l'enfant l'écrit. Très demandé en 4e année. |
| **Import par lot** | Un fichier contenant plusieurs packs, pour une semaine entière d'un coup. |

### Phase 8 — Analyse

| Élément | Pourquoi |
| --- | --- |
| **Rapport hebdomadaire** | Un résumé du dimanche : progrès, points de blocage, suggestions. |
| **Courbes par notion** | Voir une difficulté se résorber sur 6 semaines. |
| **Mode « préparation d'examen »** | Une date cible et une notion : la répétition espacée densifie les révisions jusque-là. |
| **Explication de la sélection** | Toucher un exercice pour savoir pourquoi il a été proposé. |

### Phase 9 — Extension

| Élément | Pourquoi |
| --- | --- |
| **5e et 6e année** | Uniquement des packs `grade: 5` / `grade: 6`. Le champ existe déjà partout. |
| **Plusieurs enfants** | La base est déjà multi-profils (`profile_id` sur toutes les tables) ; il manque l'écran de sélection. |
| **Mode « à deux »** | Le parent lit l'énoncé, l'enfant répond : une variante d'affichage. |
| **Partage de packs** | Exporter un pack en QR code ou en fichier, pour l'échanger entre parents d'une même classe. |

---

## Ce qui est délibérément exclu

| Écarté | Raison |
| --- | --- |
| **Compte utilisateur, synchronisation cloud** | Les données d'apprentissage d'un enfant de 9 ans n'ont rien à faire sur un serveur. Contrainte posée dès le départ. |
| **Publicité, achats intégrés** | Application familiale. |
| **Classements entre enfants** | La comparaison démotive celui qui a le plus besoin de réviser. La progression se compare à soi-même. |
| **Chronomètre partout** | Le temps est mesuré (utile au diagnostic) mais visible uniquement dans le mode « défi », choisi volontairement. |
| **Génération de contenu par IA dans l'app** | Nécessiterait le réseau et une clé d'API, et produirait des exercices non relus. Le contenu reste écrit et validé par un humain. |
