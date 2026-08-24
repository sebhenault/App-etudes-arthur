# Maquettes textuelles des écrans

Conventions : `[  ]` bouton · `( )` interrupteur · `▓▓░░` barre de progression.
Toutes les cibles tactiles font au moins 56 px de haut.

---

## ESPACE ENFANT

### 1. Accueil — onglet 🎮 Jouer

```
┌─────────────────────────────────────────────┐
│  ╭───╮                                  ╭──╮│
│  │🦊 │  Salut Arthur !                  │🔒││  ← accès parent (NIP)
│  ╰───╯  🔥 4 jours d'affilée             ╰──╯│
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Niveau 3                        410 pts │ │
│ │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │ Encore 265 points pour le niveau 4 ·    │ │
│ │ prochaine récompense : 🫎 Orignal (niv 3)│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Que veux-tu faire ?                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🎯  Révision du jour                    │ │
│ │     8 notions à revoir                  │ │
│ ├─────────────────────────────────────────┤ │
│ │ ⏱️  5 minutes chrono                    │ │
│ │     Une révision courte et rapide       │ │
│ ├─────────────────────────────────────────┤ │
│ │ ⚡  Défi chronométré                    │ │
│ │     Le plus de bonnes réponses en 90 s  │ │
│ ├─────────────────────────────────────────┤ │
│ │ 📚  Choisir un sujet                    │ │
│ │     5 matières disponibles              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Mini-jeux                                  │
│  ┌──────────────┐  ┌──────────────┐         │
│  │      🧮      │  │      🔎      │         │
│  │ Calcul éclair│  │Lecture détect│         │
│  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────┤
│    🎮 Jouer    🏅 Médailles    🙂 Moi        │
└─────────────────────────────────────────────┘
```

Quatre boutons, une phrase chacun, zéro menu. L'enfant peut lancer une révision
en un seul geste depuis l'ouverture de l'application.

### 2. Choisir un sujet

```
┌─────────────────────────────────────────────┐
│  ‹ Choisir un sujet                         │
│  Touche une matière, puis le sujet.         │
│                                             │
│  📚 Français                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 6 sujets · 68 exercices              ▾  │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🧩  Les accords                      ▶  │ │
│ │     12 exercices                        │ │
│ ├─────────────────────────────────────────┤ │
│ │ ⏳  La conjugaison                   ▶  │ │
│ │     14 exercices                        │ │
│ ├─────────────────────────────────────────┤ │
│ │ 👯  Les homophones                   🔒 │ │  ← désactivé cette semaine
│ │     Pas au programme cette semaine      │ │
│ └─────────────────────────────────────────┘ │
│  🔢 Mathématique                            │
│  …                                          │
└─────────────────────────────────────────────┘
```

Les sujets désactivés restent **visibles mais grisés** : l'enfant comprend qu'ils existent
sans pouvoir s'y égarer.

### 3. Écran de jeu — choix multiples

```
┌─────────────────────────────────────────────┐
│ (✕)  Révision du jour             120 pts   │
│      3 / 12 · Choix multiple      🔥 x4     │
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                             │
│  Quelle phrase est correctement             │
│  accordée ?                                 │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ (A)  Les grandes maisons blanches sont  │ │
│ │      vieilles.                          │ │
│ ├─────────────────────────────────────────┤ │
│ │ (B)  Les grande maisons blanche sont    │ │
│ │      vieille.                           │ │
│ ├─────────────────────────────────────────┤ │
│ │ (C)  Les grandes maison blanches sont   │ │
│ │      vieille.                           │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  [ 💡 Indice ]        Touche ta réponse 👆  │
└─────────────────────────────────────────────┘
```

Après la réponse (corrigée au tap) :

```
│ ┌─────────────────────────────────────────┐ │
│ │ 🎉 Bravo, c'est exact !                 │ │
│ │ Dans le groupe du nom, l'adjectif reçoit│ │
│ │ le genre et le nombre du nom.           │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│         [ ➡️  Continuer ]                   │
└─────────────────────────────────────────────┘
```

### 4. Écran de jeu — glisser-déposer

```
│  Glisse chaque groupe dans la bonne colonne.│
│ ┌───────────────┐ ┌───────────────┐         │
│ │  Singulier    │ │   Pluriel     │         │
│ │ ┌───────────┐ │ │ ┌───────────┐ │         │
│ │ │ma tuque   │ │ │ │des bottes │ │         │
│ │ │bleue      │ │ │ │mouillées  │ │         │
│ │ └───────────┘ │ │ └───────────┘ │         │
│ │  Dépose ici   │ │               │         │
│ └───────────────┘ └───────────────┘         │
│                                             │
│  ╭──────────────────╮ ╭──────────────────╮  │
│  │ un chandail chaud│ │ les cahiers neufs│  │  ← déplaçables au doigt
│  ╰──────────────────╯ ╰──────────────────╯  │
│                                             │
│  Fais glisser une étiquette vers une        │
│  colonne (ou touche-la puis touche la       │
│  colonne).                                  │
├─────────────────────────────────────────────┤
│  [ 💡 Indice ]       [ ✅  Vérifier ]       │
└─────────────────────────────────────────────┘
```

Deux gestes possibles, volontairement : le glisser (attendu) et le tap-tap (secours quand le
doigt dérape, et seule voie accessible aux lecteurs d'écran).

### 5. Écran de jeu — calcul rapide

```
│  7 × 8 = ?                                  │
│ ┌─────────────────────────────────────────┐ │
│ │                 56                      │ │
│ └─────────────────────────────────────────┘ │
│  ┌───┐ ┌───┐ ┌───┐                          │
│  │ 1 │ │ 2 │ │ 3 │                          │
│  ├───┤ ├───┤ ├───┤                          │
│  │ 4 │ │ 5 │ │ 6 │                          │
│  ├───┤ ├───┤ ├───┤                          │
│  │ 7 │ │ 8 │ │ 9 │                          │
│  ├───┤ ├───┤ ├───┤                          │
│  │ − │ │ 0 │ │ ⌫ │                          │
│  └───┘ └───┘ └───┘                          │
```

Pavé numérique intégré : le clavier système masquerait la moitié de l'écran sur un téléphone.

### 6. Autres jeux (résumé)

| Type | Interaction |
| --- | --- |
| Vrai ou faux | Deux grandes cartes 👍 / 👎 |
| Mot à compléter | La phrase avec un champ de saisie **à l'intérieur** : elle se complète en écrivant |
| Association | Colonne gauche / colonne droite mélangée ; toucher à gauche, puis à droite |
| Mets en ordre | Les étiquettes montent une à une dans une bande numérotée ; toucher une étiquette placée la renvoie dans la réserve |
| Lecture | Le texte dans un cadre défilant, les questions dessous ; le texte reste visible pour toutes les questions |

### 7. Bilan de partie

```
┌─────────────────────────────────────────────┐
│                    🏅                       │
│            Partie terminée !                │
│              ⭐ ⭐ ⭐                        │
│    Excellent ! Tu maîtrises vraiment bien.  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │   11/12         +148          5 min     │ │
│ │ bonnes rép.     points     de travail   │ │
│ │                                         │ │
│ │ 🔥 Meilleure série : 7 bonnes d'affilée │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Nouvelles médailles                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🎯  Sans faute !                        │ │
│ │     Réussis une partie sans erreur.     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  À revoir bientôt                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Ces notions reviendront dans ta         │ │
│ │ prochaine révision :                    │ │
│ │ • accord sujet verbe                    │ │
│ └─────────────────────────────────────────┘ │
│         [ 🔁  Rejouer ]                     │
│         [ Retour à l'accueil ]              │
└─────────────────────────────────────────────┘
```

Le message d'encouragement dépend du résultat, et reste positif même à 30 % :
« C'était difficile. On refait ça ensemble demain ! »

### 8. Médailles — onglet 🏅

```
│  Mes médailles                              │
│  6 médailles sur 16                         │
│  Gagnées                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │  👣  │ │  🎯  │ │  🔥  │                 │
│  │Premier│ │ Sans │ │3 jours│                │
│  │  pas  │ │ faute│ │de suite│               │
│  └──────┘ └──────┘ └──────┘                 │
│  À débloquer                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 💯  Centurion                           │ │
│ │     Réussis 100 exercices.              │ │
│ │     ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  62 / 100      │ │
│ └─────────────────────────────────────────┘ │
```

Les médailles verrouillées affichent leur avancement : un objectif visible motive
davantage qu'une case vide.

### 9. Moi — onglet 🙂

```
│  Moi, Arthur                                │
│  Niveau 3   ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░      │
│  Mes chiffres                               │
│  ┌────────┐┌────────┐┌────────┐             │
│  │   ⭐   ││   🔥   ││   🎮   │             │
│  │  410   ││   4    ││   17   │             │
│  │ points ││ jours  ││parties │             │
│  └────────┘└────────┘└────────┘             │
│  ┌────────┐┌────────┐┌────────┐             │
│  │  🎯 82%││ ⏱️ 96 ││ 🏅  6  │             │
│  │réussite││minutes ││meilleure│             │
│  └────────┘└────────┘└────────┘             │
│  Mon avatar                                 │
│  ┌────┐┌────┐┌────┐┌────┐                   │
│  │ 🦊 ││ 🦫 ││ 🦉 ││ 🔒 │                   │
│  │Renard││Castor││Hibou││Niv.5│              │
│  └────┘└────┘└────┘└────┘                   │
│  Mon thème                                  │
│  [Classique] [Forêt] [🔒 Niv. 6]            │
│                                             │
│  Toutes tes données restent sur cet         │
│  appareil. Rien n'est envoyé sur Internet.  │
```

---

## ESPACE PARENT

### 10. Verrou

```
│                    🔒                       │
│              Espace parent                  │
│        Entre ton NIP à 4 chiffres.          │
│                                             │
│            ●    ●    ○    ○                 │
│                                             │
│           ┌───┐ ┌───┐ ┌───┐                 │
│           │ 1 │ │ 2 │ │ 3 │                 │
│           │ 4 │ │ 5 │ │ 6 │                 │
│           │ 7 │ │ 8 │ │ 9 │                 │
│           │   │ │ 0 │ │ ⌫ │                 │
│           └───┘ └───┘ └───┘                 │
│              [ Retour ]                     │
│           [ ❓ NIP oublié ]                  │
```

À la première ouverture, l'écran propose de **créer** le NIP (saisie puis confirmation).

### 11. Tableau de bord — onglet 📊

```
│  Tableau de bord                      [⚙️]  │
│  Progression d'Arthur                       │
│  En un coup d'œil                           │
│  ┌────────┐┌────────┐┌────────┐             │
│  │ 🎯 82% ││ 📝 214 ││ 🔁  8  │             │
│  │réussite││exercices││à revoir│             │
│  └────────┘└────────┘└────────┘             │
│  ┌────────┐┌────────┐┌────────┐             │
│  │ ⚠️  3  ││ ✅ 27  ││ 🔥  4  │             │
│  │difficulté││maîtrisées││jours │            │
│  └────────┘└────────┘└────────┘             │
│                                             │
│  Activité des 14 derniers jours             │
│ ┌─────────────────────────────────────────┐ │
│ │      ▂  ▅  █  ▃     ▆  █  ▄  ▂  █  ▅   │ │
│ │ 12/03 … … … … … … … … … … … … … 25/03  │ │
│ │ Hauteur = exercices · vert = +70 %      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  La prochaine révision travaillera          │
│ ┌─────────────────────────────────────────┐ │
│ │ [À retravailler] accord sujet verbe × 3 │ │
│ │ [Révision du jour] table 7          × 2 │ │
│ │ [Nouveau] fractions equivalentes    × 3 │ │
│ │ 9 sujet(s) actif(s) cette semaine.      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Dernières parties                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Révision du jour            11/12       │ │
│ │ 2026-03-24 · 5 min           ⭐⭐⭐      │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  📊 Tableau  🗓️ Semaine  🔍 Analyse  📦 Contenus │
└─────────────────────────────────────────────┘
```

Le bloc « La prochaine révision travaillera » rend l'algorithme **vérifiable** :
le parent voit ce que l'application a décidé et peut le corriger dans l'onglet Semaine.

### 12. Semaine — onglet 🗓️

```
│  Le plan de la semaine                      │
│  Coche uniquement les sujets travaillés en  │
│  classe.                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Semaine en cours                        │ │
│ │ [ Semaine du 8 septembre            ]   │ │
│ │ [       Tout désactiver             ]   │ │
│ │ 9 sujet(s) actif(s)                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  📚 Français              [ Tout retirer ]  │
│ ┌─────────────────────────────────────────┐ │
│ │ 🧩 Les accords                     (●)  │ │
│ │    12 exercices · 1 pack                │ │
│ │    Priorité : (Normal) [À travailler]   │ │
│ │               [Prioritaire]             │ │
│ │ ─────────────────────────────────────── │ │
│ │ ⏳ La conjugaison                  (●)  │ │
│ │ ─────────────────────────────────────── │ │
│ │ 👯 Les homophones                  ( )  │ │
│ └─────────────────────────────────────────┘ │
│  🔢 Mathématique          [ Tout activer ]  │
│  …                                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Astuce : mets « Prioritaire » sur la    │ │
│ │ notion de l'évaluation à venir. Elle    │ │
│ │ sortira trois fois plus souvent.        │ │
│ └─────────────────────────────────────────┘ │
```

C'est l'écran le plus utilisé du projet : deux minutes le lundi soir.

### 13. Analyse — onglet 🔍

```
│  Analyse                                    │
│  Basée sur les 45 derniers jours.           │
│                                             │
│  ⚠️ Difficultés à travailler                │
│ ┌─────────────────────────────────────────┐ │
│ │ accord sujet verbe            [ 42 % ]  │ │
│ │ Français · Les accords                  │ │
│ │ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │ │
│ │ 5/12 réussites · 18 s en moyenne ·      │ │
│ │ 2 échecs d'affilée                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  🐢 Réussi, mais lentement                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Ces notions sont comprises mais pas     │ │
│ │ encore automatiques. Un défi            │ │
│ │ chronométré aide à les ancrer.          │ │
│ │ table 7                          31 s   │ │
│ │ division reste                   28 s   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  💪 Forces                                  │
│ ┌─────────────────────────────────────────┐ │
│ │ (lire fraction) (synonyme) (table 5)    │ │
│ │ (pluriel irregulier) (etats matiere)    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  🔁 Erreurs qui reviennent                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Mes amis ___ arrivés en retard.         │ │
│ │ Français · Les homophones —             │ │
│ │ 4 erreur(s) sur 6 essai(s)              │ │
│ │ Réponse donnée le plus souvent : « son »│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  📚 Vue par sujet                           │
│ ┌─────────────────────────────────────────┐ │
│ │ 👯 Les homophones             [ 48 % ]  │ │
│ │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░         │ │
│ │ 24 exercices · 1 maîtrisée · 3 en diff. │ │
│ └─────────────────────────────────────────┘ │
```

« Réponse donnée le plus souvent : *son* » vaut mieux qu'un pourcentage :
le parent sait exactement quoi expliquer.

### 14. Contenus — onglet 📦

```
│  Contenus                                   │
│  21 pack(s) · 198 exercices jouables        │
│                                             │
│  Ajouter un contenu                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Dépose un fichier JSON envoyé par       │ │
│ │ l'enseignante, ou colle son contenu.    │ │
│ │  [ 📥  Importer un fichier JSON ]       │ │
│ │  [     Coller du JSON           ]       │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ {                                   │ │ │
│ │ │   "schemaVersion": 1,               │ │ │
│ │ │   "id": "fr-nouveau-01",            │ │ │
│ │ │ …                                   │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │  [   Valider et importer   ]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Packs importés (2)                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Dictée de la semaine 12   [ Supprimer ] │ │
│ │ francais · vocabulaire · 10 items       │ │
│ │ Importé le 2026-03-22                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Packs livrés avec l'application (19)       │
│ ┌─────────────────────────────────────────┐ │
│ │ 📚 Français                             │ │
│ │ Les accords — Les accords dans…     12  │ │
│ │ La conjugaison — La conjugaison…    14  │ │
│ └─────────────────────────────────────────┘ │
```

En cas de refus, l'alerte liste les erreurs précises (« item ex-03 : answer doit être un index
valide entre 0 et 2 »).

### 15. Réglages

```
│  Réglages                                   │
│  Profil                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Prénom de l'enfant                      │ │
│ │ [ Arthur                            ]   │ │
│ │        [ Enregistrer ]                  │ │
│ │ Année scolaire : 4e année (Québec)      │ │
│ └─────────────────────────────────────────┘ │
│  NIP parent                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ [ ••••                              ]   │ │
│ │    [ Mettre à jour le NIP ]             │ │
│ └─────────────────────────────────────────┘ │
│  Confidentialité                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Tout reste sur cet appareil.            │ │
│ │ Aucune requête réseau, aucun compte.    │ │
│ └─────────────────────────────────────────┘ │
│  Zone sensible                              │
│  [ 🗑️  Effacer la progression ]             │
```

---

## Principes d'interface retenus

| Espace enfant | Espace parent |
| --- | --- |
| Énoncés en 22 px, gras | Densité d'information assumée |
| Cibles ≥ 56 px | Cibles standard |
| Une action visible par écran | Plusieurs réglages par écran |
| Emojis plutôt que pictogrammes | Chiffres, barres, badges |
| Aucun texte négatif | Diagnostic factuel et détaillé |
| Correction immédiate et expliquée | Historique et tendances |
