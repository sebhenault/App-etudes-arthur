import assert from 'node:assert/strict';
import { test } from 'node:test';

import { packToExercises } from '../src/content/exercises.ts';
import { emptySkillStat, applyAttempt } from '../src/domain/mastery.ts';
import {
  buildSession,
  eligibleExercises,
  explainNextSession,
  scoreExercise,
} from '../src/domain/recommendation.ts';
import { DAY_MS, initialState } from '../src/domain/srs.ts';

const now = Date.UTC(2026, 1, 2);

const makePack = (id, subject, topic, count, type = 'qcm') => ({
  schemaVersion: 1,
  id,
  title: id,
  subject,
  topic,
  grade: 4,
  items: Array.from({ length: count }, (_, index) => ({
    id: `i${index}`,
    type,
    skill: `${topic}-${index}`,
    question: `Question ${index} ?`,
    choices: ['A', 'B'],
    answer: 0,
  })),
});

const exercises = [
  ...packToExercises(makePack('fr', 'francais', 'accords', 8)),
  ...packToExercises(makePack('ma', 'mathematique', 'fractions', 8)),
];

const setting = (subject, topic, enabled, weight = 1) => [
  `${subject}/${topic}`,
  { key: `${subject}/${topic}`, subject, topic, enabled, weight, weekLabel: null, updatedAt: now },
];

const allEnabled = new Map([
  setting('francais', 'accords', true),
  setting('mathematique', 'fractions', true),
]);

const baseOptions = (overrides = {}) => ({
  mode: 'revision-intelligente',
  exercises,
  states: new Map(),
  skillStats: new Map(),
  topicSettings: allEnabled,
  now,
  length: 10,
  // Générateur figé : les tests portent sur les priorités, pas sur le hasard.
  random: () => 0.5,
  ...overrides,
});

test('un sujet désactivé par le parent n’est jamais proposé', () => {
  const options = baseOptions({
    topicSettings: new Map([
      setting('francais', 'accords', false),
      setting('mathematique', 'fractions', true),
    ]),
  });
  const pool = eligibleExercises(options);
  assert.ok(pool.length > 0);
  assert.ok(pool.every((exercise) => exercise.subject === 'mathematique'));
});

test('l’entraînement ciblé passe outre l’activation hebdomadaire', () => {
  const options = baseOptions({
    mode: 'entrainement',
    subject: 'francais',
    topic: 'accords',
    topicSettings: new Map([setting('francais', 'accords', false)]),
  });
  const pool = eligibleExercises(options);
  assert.equal(pool.length, 8);
});

test('le mini-jeu de lecture ne retient que les exercices de lecture', () => {
  const withReading = [
    ...exercises,
    ...packToExercises({
      schemaVersion: 1,
      id: 'lec',
      title: 'lec',
      subject: 'francais',
      topic: 'lecture',
      grade: 4,
      items: [
        {
          id: 'l1',
          type: 'lecture',
          passage: { title: 'T', text: 'Texte.' },
          questions: [{ id: 'a', question: 'Q ?', choices: ['A', 'B'], answer: 0 }],
        },
      ],
    }),
  ];
  const pool = eligibleExercises(
    baseOptions({
      mode: 'mini-jeu-lecture',
      exercises: withReading,
      topicSettings: new Map([...allEnabled, setting('francais', 'lecture', true)]),
    }),
  );
  assert.equal(pool.length, 1);
  assert.equal(pool[0].prompt.kind, 'lecture');
});

test('une notion en difficulté passe devant une notion neuve', () => {
  const skill = 'accords-0';
  let stat = emptySkillStat(skill, 'francais', 'accords');
  for (let i = 0; i < 4; i += 1) {
    stat = applyAttempt(stat, {
      sessionId: 1,
      exerciseKey: 'fr::i0',
      packId: 'fr',
      subject: 'francais',
      topic: 'accords',
      skill,
      kind: 'qcm',
      correct: false,
      score: 0,
      responseMs: 8000,
      givenAnswer: 'B',
      expectedAnswer: 'A',
      usedHint: false,
      createdAt: now,
    });
  }
  const options = baseOptions({ skillStats: new Map([[skill, stat]]) });
  const difficile = scoreExercise(exercises[0], options);
  const neuf = scoreExercise(exercises[1], options);
  assert.equal(difficile.reason, 'difficulte');
  assert.equal(neuf.reason, 'nouveau');
  assert.ok(difficile.score > neuf.score);
});

test('une révision en retard devient plus urgente de jour en jour', () => {
  const key = exercises[0].key;
  const state = {
    ...initialState(key, 'francais', 'accords', 'accords-0', now),
    attempts: 3,
    correct: 2,
    repetitions: 1,
  };
  const recent = scoreExercise(
    exercises[0],
    baseOptions({ states: new Map([[key, { ...state, dueAt: now }]]) }),
  );
  const enRetard = scoreExercise(
    exercises[0],
    baseOptions({ states: new Map([[key, { ...state, dueAt: now - 5 * DAY_MS }]]) }),
  );
  assert.equal(recent.reason, 'revision-due');
  assert.ok(enRetard.score > recent.score);
});

test('une notion maîtrisée et pas encore due est mise de côté', () => {
  const key = exercises[0].key;
  const state = {
    ...initialState(key, 'francais', 'accords', 'accords-0', now),
    attempts: 5,
    correct: 5,
    repetitions: 4,
    intervalDays: 14,
    dueAt: now + 10 * DAY_MS,
  };
  const entry = scoreExercise(exercises[0], baseOptions({ states: new Map([[key, state]]) }));
  assert.equal(entry.reason, 'entretien');
  assert.ok(entry.score <= 0);
});

test('le poids « prioritaire » du parent triple la priorité', () => {
  const normal = scoreExercise(exercises[0], baseOptions());
  const prioritaire = scoreExercise(
    exercises[0],
    baseOptions({
      topicSettings: new Map([
        setting('francais', 'accords', true, 3),
        setting('mathematique', 'fractions', true),
      ]),
    }),
  );
  assert.equal(prioritaire.score, normal.score * 3);
});

test('la partie respecte la longueur demandée et évite les doublons', () => {
  const session = buildSession(baseOptions({ length: 6 }));
  assert.equal(session.length, 6);
  const keys = session.map((entry) => entry.exercise.key);
  assert.equal(new Set(keys).size, 6);
});

test('deux exercices de suite ne portent pas sur la même notion', () => {
  const repeated = packToExercises({
    schemaVersion: 1,
    id: 'rep',
    title: 'rep',
    subject: 'francais',
    topic: 'accords',
    grade: 4,
    items: Array.from({ length: 8 }, (_, index) => ({
      id: `r${index}`,
      type: 'qcm',
      // Seulement deux notions distinctes : l'entrelacement doit alterner.
      skill: index % 2 === 0 ? 'alpha' : 'beta',
      question: `Q${index} ?`,
      choices: ['A', 'B'],
      answer: 0,
    })),
  });
  const session = buildSession(
    baseOptions({
      exercises: repeated,
      topicSettings: new Map([setting('francais', 'accords', true)]),
      length: 8,
    }),
  );
  for (let i = 1; i < session.length; i += 1) {
    assert.notEqual(session[i].exercise.skill, session[i - 1].exercise.skill);
  }
});

test('une partie garde de la place pour du contenu jamais vu', () => {
  const states = new Map();
  // Tous les exercices sauf deux ont déjà été vus et sont dus.
  exercises.slice(0, exercises.length - 2).forEach((exercise) => {
    states.set(exercise.key, {
      ...initialState(exercise.key, exercise.subject, exercise.topic, exercise.skill, now),
      attempts: 2,
      correct: 1,
      repetitions: 1,
      dueAt: now - DAY_MS,
    });
  });
  const session = buildSession(baseOptions({ states, length: 8 }));
  assert.ok(session.some((entry) => entry.reason === 'nouveau'));
});

test('sans aucun sujet actif, la partie est vide', () => {
  const session = buildSession(
    baseOptions({
      topicSettings: new Map([
        setting('francais', 'accords', false),
        setting('mathematique', 'fractions', false),
      ]),
    }),
  );
  assert.equal(session.length, 0);
});

test('le résumé pour le parent regroupe par notion et par raison', () => {
  const session = buildSession(baseOptions({ length: 6 }));
  const advice = explainNextSession(session);
  const total = advice.reduce((sum, item) => sum + item.count, 0);
  assert.equal(total, 6);
  assert.ok(advice.every((item) => typeof item.reason === 'string'));
});
