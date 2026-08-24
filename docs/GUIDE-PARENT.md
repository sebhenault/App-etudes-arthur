# Guide du parent

Sans jargon. Cinq minutes de lecture, deux minutes d'usage par semaine.

---

## La première fois

1. Ouvrir l'application. Elle démarre directement dans l'espace d'Arthur.
2. Toucher le **cadenas 🔒** en haut à droite.
3. Choisir un **NIP à 4 chiffres** (à saisir deux fois). C'est ce qui empêche Arthur d'aller
   modifier ses propres réglages — rien de plus, ce n'est pas un coffre-fort.
4. Aller dans l'onglet **🗓️ Semaine** et cocher ce qui est travaillé en classe en ce moment.

C'est tout. Arthur peut jouer.

---

## Chaque semaine (2 minutes)

Quand l'enseignante envoie son plan :

1. Cadenas 🔒 → NIP → onglet **🗓️ Semaine**
2. Écrire le nom de la semaine (ex. « Semaine du 8 septembre ») — facultatif mais pratique
3. **Tout désactiver**, puis cocher les sujets de la semaine
4. Mettre **Prioritaire** sur la notion de l'évaluation à venir : elle sortira trois fois
   plus souvent dans les révisions

Les sujets non cochés ne disparaissent pas : ils apparaissent grisés chez Arthur, avec un
cadenas. Ce qu'il a déjà appris n'est pas perdu — il reviendra tout seul quand vous le
réactiverez.

---

## Chaque jour (5 minutes pour l'enfant)

Arthur ouvre l'application et touche **🎯 Révision du jour**. Il n'a rien à choisir :
l'application décide en fonction de ce qu'il a raté, de ce qu'il est temps de revoir et
de ce qu'il n'a pas encore vu.

Les autres boutons, s'il veut varier :

| Bouton | Ce que c'est |
| --- | --- |
| ⏱️ 5 minutes chrono | Une révision plus courte, uniquement des exercices rapides |
| ⚡ Défi chronométré | 90 secondes, un maximum de bonnes réponses — bon pour les automatismes |
| 📚 Choisir un sujet | Il décide lui-même quoi travailler |
| 🧮 Calcul éclair / 🔎 Lecture détective | Deux mini-jeux ciblés |

La régularité compte plus que la durée : cinq minutes tous les soirs valent mieux que
quarante minutes le dimanche. C'est le sens de la série 🔥 affichée sur l'accueil.

---

## Lire les résultats

### Onglet 📊 Tableau

- **Notions à revoir** : ce que l'application prévoit de faire ressortir bientôt.
- **Notions en difficulté** : là où Arthur bloque vraiment. Trois ou quatre, c'est normal.
- **Le graphique** : un bâton par jour, sa hauteur = le nombre d'exercices, sa couleur = vert
  au-delà de 70 % de réussite. On y voit d'un coup d'œil les jours sautés.
- **« La prochaine révision travaillera »** : ce que l'application a décidé. Si cela ne
  correspond pas au programme, c'est le signe qu'il faut ajuster l'onglet Semaine.

### Onglet 🔍 Analyse

- **⚠️ Difficultés** : les notions précises qui coincent, avec le taux récent et le temps moyen.
- **🐢 Réussi, mais lentement** : Arthur y arrive, mais en recalculant à chaque fois. Ce n'est
  pas une difficulté, c'est un manque d'automatisme — le **défi chronométré** est fait pour ça.
- **💪 Forces** : à mentionner à voix haute. Un enfant qui révise a besoin d'entendre ce qui
  fonctionne.
- **🔁 Erreurs qui reviennent** : le bloc le plus utile. Il affiche **la mauvaise réponse
  qu'Arthur donne le plus souvent**. Si c'est toujours « son » à la place de « sont », vous
  savez exactement quoi réexpliquer en trente secondes.

---

## Ajouter du contenu

Onglet **📦 Contenus** → *Importer un fichier JSON* ou *Coller du JSON*.

Utile quand l'enseignante envoie une liste de mots de vocabulaire, une dictée ou une notion
qui n'est pas encore dans l'application. Le format est décrit dans
[FORMAT-CONTENU.md](FORMAT-CONTENU.md), avec un gabarit à remplir dans
[modele-pack.json](modele-pack.json).

Si le fichier contient une erreur, l'application refuse l'import et affiche précisément
ce qui ne va pas. Rien ne peut être cassé.

---

## Questions fréquentes

**Arthur peut-il aller dans l'espace parent ?**
Il faut le NIP. S'il le découvre, changez-le dans *Réglages*.

**Les données sont-elles envoyées quelque part ?**
Non. Aucune requête réseau, aucun compte. Tout est dans une base sur le téléphone.

**Que se passe-t-il si je désinstalle l'application ?**
Tout est effacé. Une sauvegarde du téléphone (iCloud, Google) est le seul moyen de conserver
l'historique. Un export manuel est prévu dans une prochaine version.

**Arthur a répondu au hasard pendant une partie, cela fausse-t-il tout ?**
Peu. Les diagnostics s'appuient sur une moyenne mobile qui demande au moins trois tentatives,
et une seule mauvaise séance est vite compensée par les suivantes.

**Il refait toujours les mêmes exercices.**
C'est voulu au début : la répétition espacée fait revenir ce qui n'est pas encore su.
Si l'impression persiste, activez plus de sujets dans l'onglet Semaine, ou ajoutez un pack.
Un quart de chaque partie est toujours réservé à des exercices jamais vus.

**Il perd sa série 🔥 et se décourage.**
La série repart à 1 après un jour sauté, mais le **record** est conservé et visible dans
l'onglet 🙂 Moi. Les points, les niveaux et les médailles, eux, ne se perdent jamais.

**Puis-je remettre les compteurs à zéro ?**
*Réglages → Effacer la progression*. Les contenus et les réglages de sujets sont conservés.
