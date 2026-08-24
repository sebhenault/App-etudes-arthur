/**
 * Détection automatique des forces et des difficultés.
 *
 * L'unité d'analyse n'est pas la matière (trop large pour être utile) mais la
 * « notion fine » (`skill`) déclarée dans chaque exercice : « accord-sujet-verbe »,
 * « table-7 », « division-reste »… C'est ce niveau de détail qui permet de dire
 * au parent « Arthur bloque sur les tables de 7 et 8 », plutôt que
 * « Arthur a 68 % en mathématique ».
 */

import type { AttemptRecord, ExerciseState, SkillStat } from './types';

export type MasteryLevel = 'nouveau' | 'difficulte' | 'en-cours' | 'maitrise';

/** Poids de la moyenne mobile : plus il est élevé, plus les progrès récents comptent. */
export const RECENCY_ALPHA = 0.35;

/** Nombre minimal de tentatives avant de porter un jugement. */
export const MIN_ATTEMPTS_FOR_DIAGNOSIS = 3;

export interface SkillDiagnosis {
  skill: string;
  subject: string;
  topic: string;
  attempts: number;
  correct: number;
  successRate: number;
  recentScore: number;
  avgMs: number;
  failStreak: number;
  level: MasteryLevel;
  /** Vrai quand l'enfant réussit mais lentement : la notion n'est pas automatisée. */
  slow: boolean;
  lastSeenAt: number;
}

export function emptySkillStat(
  skill: string,
  subject: string,
  topic: string,
): SkillStat {
  return {
    skill,
    subject,
    topic,
    attempts: 0,
    correct: 0,
    recentScore: 0,
    avgMs: 0,
    lastSeenAt: 0,
    failStreak: 0,
  };
}

/** Intègre une tentative dans l'agrégat d'une notion. */
export function applyAttempt(stat: SkillStat, attempt: AttemptRecord): SkillStat {
  const attempts = stat.attempts + 1;
  const score = attempt.correct ? 1 : attempt.score;
  return {
    ...stat,
    attempts,
    correct: stat.correct + (attempt.correct ? 1 : 0),
    // Moyenne mobile exponentielle : la première valeur initialise la série.
    recentScore:
      stat.attempts === 0 ? score : stat.recentScore * (1 - RECENCY_ALPHA) + score * RECENCY_ALPHA,
    avgMs: Math.round((stat.avgMs * stat.attempts + attempt.responseMs) / attempts),
    lastSeenAt: attempt.createdAt,
    failStreak: attempt.correct ? 0 : stat.failStreak + 1,
  };
}

/**
 * Seuil de lenteur : au-delà, une bonne réponse est considérée « pas encore automatisée ».
 * 25 secondes correspond à une hésitation nette sur un exercice de révision courte.
 */
export const SLOW_THRESHOLD_MS = 25000;

export function diagnoseSkill(stat: SkillStat): SkillDiagnosis {
  const successRate = stat.attempts === 0 ? 0 : stat.correct / stat.attempts;
  let level: MasteryLevel;

  if (stat.attempts < MIN_ATTEMPTS_FOR_DIAGNOSIS) {
    level = 'nouveau';
  } else if (stat.recentScore < 0.6 || stat.failStreak >= 2) {
    level = 'difficulte';
  } else if (stat.recentScore >= 0.85 && stat.attempts >= 4 && successRate >= 0.75) {
    level = 'maitrise';
  } else {
    level = 'en-cours';
  }

  return {
    skill: stat.skill,
    subject: stat.subject,
    topic: stat.topic,
    attempts: stat.attempts,
    correct: stat.correct,
    successRate,
    recentScore: stat.recentScore,
    avgMs: stat.avgMs,
    failStreak: stat.failStreak,
    level,
    slow: level !== 'difficulte' && stat.avgMs > SLOW_THRESHOLD_MS && stat.attempts >= 3,
    lastSeenAt: stat.lastSeenAt,
  };
}

export interface DiagnosisReport {
  forces: SkillDiagnosis[];
  difficultes: SkillDiagnosis[];
  enCours: SkillDiagnosis[];
  nouveaux: SkillDiagnosis[];
  /** Notions réussies mais lentement : à consolider par des défis chronométrés. */
  aConsolider: SkillDiagnosis[];
}

/** Classe toutes les notions en forces / difficultés / en cours. */
export function buildDiagnosis(stats: SkillStat[]): DiagnosisReport {
  const diagnoses = stats.map(diagnoseSkill);
  const byWeakness = (a: SkillDiagnosis, b: SkillDiagnosis) => a.recentScore - b.recentScore;
  const byStrength = (a: SkillDiagnosis, b: SkillDiagnosis) => b.recentScore - a.recentScore;

  return {
    forces: diagnoses.filter((d) => d.level === 'maitrise').sort(byStrength),
    difficultes: diagnoses.filter((d) => d.level === 'difficulte').sort(byWeakness),
    enCours: diagnoses.filter((d) => d.level === 'en-cours').sort(byWeakness),
    nouveaux: diagnoses.filter((d) => d.level === 'nouveau'),
    aConsolider: diagnoses.filter((d) => d.slow).sort((a, b) => b.avgMs - a.avgMs),
  };
}

// ---------------------------------------------------------------------------
// Erreurs fréquentes
// ---------------------------------------------------------------------------

export interface FrequentError {
  exerciseKey: string;
  subject: string;
  topic: string;
  skill: string;
  errorCount: number;
  totalCount: number;
  /** Réponse erronée la plus souvent donnée : elle révèle souvent la confusion. */
  topWrongAnswer: string | null;
  lastAt: number;
}

/** Regroupe les erreurs par exercice pour repérer les confusions récurrentes. */
export function frequentErrors(attempts: AttemptRecord[], minErrors = 2): FrequentError[] {
  const grouped = new Map<
    string,
    FrequentError & { wrongAnswers: Map<string, number> }
  >();

  for (const attempt of attempts) {
    let entry = grouped.get(attempt.exerciseKey);
    if (!entry) {
      entry = {
        exerciseKey: attempt.exerciseKey,
        subject: attempt.subject,
        topic: attempt.topic,
        skill: attempt.skill,
        errorCount: 0,
        totalCount: 0,
        topWrongAnswer: null,
        lastAt: 0,
        wrongAnswers: new Map(),
      };
      grouped.set(attempt.exerciseKey, entry);
    }
    entry.totalCount += 1;
    entry.lastAt = Math.max(entry.lastAt, attempt.createdAt);
    if (!attempt.correct) {
      entry.errorCount += 1;
      const answer = attempt.givenAnswer.trim();
      if (answer.length > 0) {
        entry.wrongAnswers.set(answer, (entry.wrongAnswers.get(answer) ?? 0) + 1);
      }
    }
  }

  return [...grouped.values()]
    .filter((entry) => entry.errorCount >= minErrors)
    .map(({ wrongAnswers, ...entry }) => {
      const top = [...wrongAnswers.entries()].sort((a, b) => b[1] - a[1])[0];
      return { ...entry, topWrongAnswer: top ? top[0] : null };
    })
    .sort((a, b) => b.errorCount - a.errorCount || b.lastAt - a.lastAt);
}

// ---------------------------------------------------------------------------
// Vue par sujet, pour le tableau de bord parent
// ---------------------------------------------------------------------------

export interface TopicSummary {
  subject: string;
  topic: string;
  attempts: number;
  correct: number;
  successRate: number;
  avgMs: number;
  mastered: number;
  inProgress: number;
  struggling: number;
  lastSeenAt: number;
}

export function summarizeByTopic(
  stats: SkillStat[],
  states: ExerciseState[],
): TopicSummary[] {
  const map = new Map<string, TopicSummary>();
  const keyOf = (subject: string, topic: string) => `${subject}/${topic}`;

  for (const stat of stats) {
    const key = keyOf(stat.subject, stat.topic);
    const entry =
      map.get(key) ??
      {
        subject: stat.subject,
        topic: stat.topic,
        attempts: 0,
        correct: 0,
        successRate: 0,
        avgMs: 0,
        mastered: 0,
        inProgress: 0,
        struggling: 0,
        lastSeenAt: 0,
      };
    const diagnosis = diagnoseSkill(stat);
    entry.attempts += stat.attempts;
    entry.correct += stat.correct;
    entry.avgMs =
      entry.attempts === 0
        ? 0
        : Math.round((entry.avgMs * (entry.attempts - stat.attempts) + stat.avgMs * stat.attempts) /
            entry.attempts);
    entry.lastSeenAt = Math.max(entry.lastSeenAt, stat.lastSeenAt);
    if (diagnosis.level === 'maitrise') entry.mastered += 1;
    else if (diagnosis.level === 'difficulte') entry.struggling += 1;
    else if (diagnosis.level === 'en-cours') entry.inProgress += 1;
    map.set(key, entry);
  }

  // Les états de répétition espacée servent uniquement à dater la dernière révision.
  for (const state of states) {
    const key = keyOf(state.subject, state.topic);
    const entry = map.get(key);
    if (entry) entry.lastSeenAt = Math.max(entry.lastSeenAt, state.lastSeenAt);
  }

  return [...map.values()]
    .map((entry) => ({
      ...entry,
      successRate: entry.attempts === 0 ? 0 : entry.correct / entry.attempts,
    }))
    .sort((a, b) => a.successRate - b.successRate);
}
