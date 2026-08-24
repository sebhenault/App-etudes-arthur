import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyAttempt,
  buildDiagnosis,
  diagnoseSkill,
  emptySkillStat,
  frequentErrors,
  summarizeByTopic,
} from '../src/domain/mastery.ts';

const attempt = (overrides = {}) => ({
  sessionId: 1,
  exerciseKey: 'pack::item',
  packId: 'pack',
  subject: 'francais',
  topic: 'accords',
  skill: 'accord-sujet-verbe',
  kind: 'qcm',
  correct: true,
  score: 1,
  responseMs: 5000,
  givenAnswer: 'ok',
  expectedAnswer: 'ok',
  usedHint: false,
  createdAt: Date.UTC(2026, 0, 10),
  ...overrides,
});

const feed = (results) => {
  let stat = emptySkillStat('accord-sujet-verbe', 'francais', 'accords');
  results.forEach((correct) => {
    stat = applyAttempt(stat, attempt({ correct, score: correct ? 1 : 0 }));
  });
  return stat;
};

test('sans assez de tentatives, aucune conclusion n’est tirée', () => {
  assert.equal(diagnoseSkill(feed([true, true])).level, 'nouveau');
});

test('des échecs répétés déclenchent le diagnostic de difficulté', () => {
  assert.equal(diagnoseSkill(feed([false, false, false, false])).level, 'difficulte');
});

test('deux échecs consécutifs suffisent, même après de bons résultats', () => {
  const stat = feed([true, true, true, true, false, false]);
  assert.equal(stat.failStreak, 2);
  assert.equal(diagnoseSkill(stat).level, 'difficulte');
});

test('des réussites constantes donnent une force', () => {
  assert.equal(diagnoseSkill(feed([true, true, true, true, true, true])).level, 'maitrise');
});

test('la moyenne mobile réagit vite à une remontée', () => {
  const stat = feed([false, false, false, true, true, true, true, true]);
  const diagnosis = diagnoseSkill(stat);
  // Le taux global reste sous 65 % mais le score récent, lui, est déjà remonté.
  assert.ok(diagnosis.successRate < 0.7);
  assert.ok(diagnosis.recentScore > 0.7);
  assert.notEqual(diagnosis.level, 'difficulte');
});

test('une notion réussie mais lente est signalée à consolider', () => {
  let stat = emptySkillStat('table-7', 'mathematique', 'multiplication');
  for (let i = 0; i < 5; i += 1) {
    stat = applyAttempt(stat, attempt({ skill: 'table-7', responseMs: 40000 }));
  }
  const diagnosis = diagnoseSkill(stat);
  assert.equal(diagnosis.level, 'maitrise');
  assert.equal(diagnosis.slow, true);
  assert.equal(buildDiagnosis([stat]).aConsolider.length, 1);
});

test('le rapport range les notions dans les bonnes catégories', () => {
  const forte = feed([true, true, true, true, true]);
  const faible = { ...feed([false, false, false, false]), skill: 'homophone-a' };
  const report = buildDiagnosis([forte, faible]);
  assert.equal(report.forces.length, 1);
  assert.equal(report.difficultes.length, 1);
  assert.equal(report.difficultes[0].skill, 'homophone-a');
});

test('les erreurs fréquentes remontent la mauvaise réponse la plus donnée', () => {
  const attempts = [
    attempt({ correct: false, givenAnswer: 'sont' }),
    attempt({ correct: false, givenAnswer: 'sont' }),
    attempt({ correct: false, givenAnswer: 'son' }),
    attempt({ correct: true }),
    attempt({ exerciseKey: 'autre::x', correct: false, givenAnswer: 'a' }),
  ];
  const errors = frequentErrors(attempts);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].exerciseKey, 'pack::item');
  assert.equal(errors[0].errorCount, 3);
  assert.equal(errors[0].totalCount, 4);
  assert.equal(errors[0].topWrongAnswer, 'sont');
});

test('le résumé par sujet trie du plus faible au plus fort', () => {
  const faible = { ...feed([false, false, false, false]), topic: 'homophones', skill: 'h' };
  const forte = { ...feed([true, true, true, true, true]), topic: 'accords', skill: 'a' };
  const summary = summarizeByTopic([forte, faible], []);
  assert.equal(summary.length, 2);
  assert.equal(summary[0].topic, 'homophones');
  assert.ok(summary[0].successRate < summary[1].successRate);
});
