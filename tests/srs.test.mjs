import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DAY_MS,
  gradeFromResult,
  initialState,
  isMastered,
  review,
} from '../src/domain/srs.ts';

const now = Date.UTC(2026, 0, 15);
const base = () => initialState('pack::item', 'mathematique', 'multiplication', 'table-7', now);

const good = (overrides = {}) => ({
  correct: true,
  score: 1,
  responseMs: 3000,
  timeTargetMs: 6000,
  usedHint: false,
  now,
  ...overrides,
});

test('une réponse rapide et juste vaut la note maximale', () => {
  assert.equal(gradeFromResult(good({ responseMs: 2000 })), 5);
});

test('une réponse juste mais aidée par un indice vaut 3', () => {
  assert.equal(gradeFromResult(good({ usedHint: true })), 3);
});

test('une réponse fausse mais à moitié bonne vaut mieux que rien', () => {
  assert.equal(gradeFromResult(good({ correct: false, score: 0.6 })), 2);
  assert.equal(gradeFromResult(good({ correct: false, score: 0 })), 0);
});

test('les réussites successives espacent la révision', () => {
  let state = base();
  const intervals = [];
  for (let i = 0; i < 4; i += 1) {
    state = review(state, good({ now: now + i * DAY_MS }));
    intervals.push(state.intervalDays);
  }
  assert.deepEqual(intervals, [1, 2, 4, 7]);
  assert.equal(state.repetitions, 4);
});

test('un échec ramène la notion dans la séance courante', () => {
  let state = base();
  state = review(state, good());
  state = review(state, good({ now: now + DAY_MS }));
  assert.ok(state.intervalDays > 0);

  const failed = review(state, good({ correct: false, score: 0, now: now + 2 * DAY_MS }));
  assert.equal(failed.repetitions, 0);
  assert.equal(failed.intervalDays, 0);
  assert.equal(failed.dueAt, now + 2 * DAY_MS);
  assert.equal(failed.lapses, 1);
});

test('les échecs répétés font baisser le facteur de facilité', () => {
  let state = base();
  const first = state.ease;
  for (let i = 0; i < 3; i += 1) {
    state = review(state, good({ correct: false, score: 0, now: now + i * DAY_MS }));
  }
  assert.ok(state.ease < first);
  assert.ok(state.ease >= 1.3);
});

test('la maîtrise demande 3 réussites et un intervalle d’au moins une semaine', () => {
  let state = base();
  assert.equal(isMastered(state), false);
  for (let i = 0; i < 3; i += 1) {
    state = review(state, good({ now: now + i * DAY_MS }));
  }
  assert.equal(state.repetitions, 3);
  assert.equal(isMastered(state), false); // intervalle de 4 jours seulement
  state = review(state, good({ now: now + 4 * DAY_MS }));
  assert.equal(isMastered(state), true);
});

test('une réponse hésitante n’accorde pas un palier complet', () => {
  let state = base();
  state = review(state, good());
  state = review(state, good());
  const hesitant = review(state, good({ usedHint: true }));
  const confident = review(state, good());
  assert.ok(hesitant.intervalDays < confident.intervalDays);
});

test('le compteur de tentatives et de réussites suit les résultats', () => {
  let state = base();
  state = review(state, good());
  state = review(state, good({ correct: false, score: 0 }));
  assert.equal(state.attempts, 2);
  assert.equal(state.correct, 1);
});
