/**
 * Répétition espacée (spaced repetition) adaptée à un enfant de 9-10 ans.
 *
 * Le principe : une notion réussie revient de plus en plus tard, une notion
 * ratée revient très vite. L'algorithme s'inspire de SM-2 mais avec des
 * intervalles courts (l'horizon utile est la semaine scolaire, pas l'année) et
 * une note dérivée automatiquement du résultat plutôt que d'une auto-évaluation,
 * qu'un enfant ne peut pas fournir de façon fiable.
 */

import type { ExerciseState } from './types';

export const DAY_MS = 86400000;

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const DEFAULT_EASE = 2.2;

/** Paliers d'intervalle en jours. Une notion maîtrisée revient au plus tard dans 30 jours. */
export const INTERVAL_STEPS = [1, 2, 4, 7, 14, 30];

export interface ReviewInput {
  correct: boolean;
  /** Score partiel entre 0 et 1. */
  score: number;
  responseMs: number;
  timeTargetMs: number;
  usedHint: boolean;
  now: number;
}

/**
 * Note de 0 à 5, dérivée du résultat, du temps de réponse et de l'usage d'un indice.
 * 0-2 = échec, 3 = juste mais laborieux, 4 = bien, 5 = rapide et sûr.
 */
export function gradeFromResult(input: ReviewInput): number {
  if (!input.correct) {
    // Une réponse partiellement bonne vaut mieux que rien : 1 plutôt que 0.
    return input.score >= 0.5 ? 2 : input.score > 0 ? 1 : 0;
  }
  if (input.usedHint) return 3;
  if (input.timeTargetMs > 0 && input.responseMs <= input.timeTargetMs * 0.6) return 5;
  if (input.timeTargetMs > 0 && input.responseMs <= input.timeTargetMs * 1.5) return 4;
  return 3;
}

export function initialState(
  exerciseKey: string,
  subject: string,
  topic: string,
  skill: string,
  now: number,
): ExerciseState {
  return {
    exerciseKey,
    subject,
    topic,
    skill,
    ease: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now,
    lastSeenAt: now,
    lastScore: 0,
    attempts: 0,
    correct: 0,
  };
}

/** Applique un résultat à l'état de mémorisation et retourne le nouvel état. */
export function review(state: ExerciseState, input: ReviewInput): ExerciseState {
  const grade = gradeFromResult(input);
  const passed = grade >= 3;

  let ease = state.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  ease = Math.max(MIN_EASE, Math.min(MAX_EASE, ease));

  let repetitions: number;
  let intervalDays: number;
  let lapses = state.lapses;

  if (!passed) {
    repetitions = 0;
    lapses = state.repetitions > 0 ? state.lapses + 1 : state.lapses;
    // Une notion ratée revient dès la prochaine séance (le jour même).
    intervalDays = 0;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions <= INTERVAL_STEPS.length) {
      intervalDays = INTERVAL_STEPS[repetitions - 1];
    } else {
      intervalDays = Math.min(60, Math.round(state.intervalDays * ease));
    }
    // Une réponse hésitante (note 3) ne fait pas gagner un palier complet.
    if (grade === 3) intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
  }

  return {
    ...state,
    ease,
    repetitions,
    lapses,
    intervalDays,
    dueAt: input.now + intervalDays * DAY_MS,
    lastSeenAt: input.now,
    lastScore: input.correct ? 1 : input.score,
    attempts: state.attempts + 1,
    correct: state.correct + (input.correct ? 1 : 0),
  };
}

/** Une notion est « maîtrisée » après 3 réussites consécutives et un intervalle d'au moins une semaine. */
export const isMastered = (state: ExerciseState): boolean =>
  state.repetitions >= 3 && state.intervalDays >= 7;

/** Retard de révision, en jours (0 si la notion n'est pas encore due). */
export const overdueDays = (state: ExerciseState, now: number): number =>
  Math.max(0, (now - state.dueAt) / DAY_MS);

export const isDue = (state: ExerciseState, now: number): boolean => state.dueAt <= now;
