import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  achievementProgress,
  computePoints,
  levelForPoints,
  levelProgress,
  newlyUnlocked,
  nextReward,
  pointsForLevel,
  starsForSession,
  toDayKey,
  unlockedAvatars,
  updateStreak,
} from '../src/domain/gamification.ts';

const basePoints = (overrides = {}) => ({
  correct: true,
  score: 1,
  difficulty: 2,
  responseMs: 6000,
  timeTargetMs: 12000,
  combo: 0,
  usedHint: false,
  ...overrides,
});

test('une bonne réponse rapporte plus qu’une mauvaise', () => {
  assert.ok(computePoints(basePoints()).total > computePoints(basePoints({ correct: false, score: 0 })).total);
});

test('une réponse partiellement bonne rapporte proportionnellement', () => {
  const partiel = computePoints(basePoints({ correct: false, score: 0.5 }));
  assert.ok(partiel.total > 0);
  assert.ok(partiel.total < computePoints(basePoints()).total);
});

test('la rapidité donne un bonus, la lenteur non', () => {
  const rapide = computePoints(basePoints({ responseMs: 1000 }));
  const lent = computePoints(basePoints({ responseMs: 12000 }));
  assert.ok(rapide.speedBonus > 0);
  assert.equal(lent.speedBonus, 0);
});

test('un indice réduit les points sans les annuler', () => {
  const avec = computePoints(basePoints({ usedHint: true }));
  const sans = computePoints(basePoints());
  assert.ok(avec.base < sans.base);
  assert.ok(avec.base > 0);
});

test('le bonus de série est plafonné', () => {
  assert.equal(computePoints(basePoints({ combo: 3 })).comboBonus, 6);
  assert.equal(computePoints(basePoints({ combo: 20 })).comboBonus, 10);
});

test('un exercice difficile rapporte plus qu’un facile', () => {
  assert.ok(
    computePoints(basePoints({ difficulty: 3 })).base >
      computePoints(basePoints({ difficulty: 1 })).base,
  );
});

test('les paliers de niveau sont croissants', () => {
  const paliers = [1, 2, 3, 4, 5].map(pointsForLevel);
  assert.deepEqual(paliers, [0, 150, 375, 675, 1050]);
  for (let i = 1; i < paliers.length; i += 1) {
    assert.ok(paliers[i] > paliers[i - 1]);
  }
});

test('le niveau se déduit des points cumulés', () => {
  assert.equal(levelForPoints(0), 1);
  assert.equal(levelForPoints(149), 1);
  assert.equal(levelForPoints(150), 2);
  assert.equal(levelForPoints(1050), 5);
});

test('la barre de progression reste entre 0 et 1', () => {
  const progress = levelProgress(200);
  assert.equal(progress.level, 2);
  assert.ok(progress.ratio > 0 && progress.ratio < 1);
});

test('les étoiles récompensent le pourcentage de réussite', () => {
  assert.equal(starsForSession(10, 10), 3);
  assert.equal(starsForSession(8, 10), 2);
  assert.equal(starsForSession(5, 10), 1);
  assert.equal(starsForSession(2, 10), 0);
  assert.equal(starsForSession(0, 0), 0);
});

const day = (y, m, d) => new Date(y, m - 1, d, 12).getTime();

test('jouer deux jours de suite allonge la série', () => {
  const progress = { streakDays: 3, bestStreak: 5, lastActiveDay: toDayKey(day(2026, 3, 10)) };
  const update = updateStreak(progress, day(2026, 3, 11));
  assert.equal(update.streakDays, 4);
  assert.equal(update.extended, true);
});

test('sauter un jour remet la série à 1 sans effacer le record', () => {
  const progress = { streakDays: 6, bestStreak: 6, lastActiveDay: toDayKey(day(2026, 3, 10)) };
  const update = updateStreak(progress, day(2026, 3, 13));
  assert.equal(update.streakDays, 1);
  assert.equal(update.bestStreak, 6);
});

test('rejouer le même jour ne compte pas deux fois', () => {
  const progress = { streakDays: 2, bestStreak: 4, lastActiveDay: toDayKey(day(2026, 3, 10)) };
  const update = updateStreak(progress, day(2026, 3, 10));
  assert.equal(update.streakDays, 2);
  assert.equal(update.extended, false);
});

const metrics = (overrides = {}) => ({
  sessions: 0,
  perfectSessions: 0,
  streakDays: 0,
  totalCorrect: 0,
  level: 1,
  points: 0,
  bestCombo: 0,
  masteredExercises: 0,
  subjectCorrect: {},
  ...overrides,
});

test('une médaille se débloque quand la cible est atteinte', () => {
  const unlocked = newlyUnlocked(metrics({ sessions: 1 }), new Set());
  assert.ok(unlocked.some((achievement) => achievement.id === 'premier-pas'));
});

test('une médaille déjà obtenue n’est pas annoncée deux fois', () => {
  const unlocked = newlyUnlocked(metrics({ sessions: 1 }), new Set(['premier-pas']));
  assert.ok(!unlocked.some((achievement) => achievement.id === 'premier-pas'));
});

test('les médailles par matière lisent la bonne clé', () => {
  const unlocked = newlyUnlocked(
    metrics({ subjectCorrect: { mathematique: 50 } }),
    new Set(),
  );
  const ids = unlocked.map((achievement) => achievement.id);
  assert.ok(ids.includes('calculateur'));
  assert.ok(!ids.includes('mots-croises'));
});

test('l’avancement d’une médaille est un ratio borné', () => {
  const progress = achievementProgress(metrics({ totalCorrect: 50 }), new Set());
  const centurion = progress.find((item) => item.def.id === 'cent-bonnes');
  assert.equal(centurion.ratio, 0.5);
  assert.equal(centurion.unlocked, false);
});

test('les avatars se débloquent avec le niveau', () => {
  assert.ok(unlockedAvatars(1).length >= 2);
  assert.ok(unlockedAvatars(10).length > unlockedAvatars(1).length);
});

test('la prochaine récompense est celle du plus petit niveau à venir', () => {
  const reward = nextReward(1);
  assert.ok(reward);
  assert.ok(reward.level > 1);
  assert.equal(nextReward(999), null);
});
