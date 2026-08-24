/**
 * Révision intelligente : construction de la file d'exercices d'une partie.
 *
 * L'ordre de priorité, du plus fort au plus faible :
 *   1. les notions en difficulté (score récent faible ou échecs consécutifs) ;
 *   2. les révisions dues selon la répétition espacée, d'autant plus qu'elles sont en retard ;
 *   3. les notions en cours d'apprentissage ;
 *   4. la découverte de nouveaux exercices (pour ne pas ressasser) ;
 *   5. les notions maîtrisées, seulement pour entretenir la mémoire.
 *
 * Deux garde-fous rendent la partie agréable :
 *   - le poids choisi par le parent multiplie la priorité d'un sujet ;
 *   - un entrelacement empêche de servir trois exercices de suite sur la même notion.
 */

import type { Exercise } from '../content/exercises';
import { diagnoseSkill, type MasteryLevel } from './mastery';
import { isMastered, isDue, overdueDays } from './srs';
import type { ExerciseState, SessionMode, SkillStat, TopicSetting } from './types';

export interface SessionOptions {
  mode: SessionMode;
  exercises: Exercise[];
  states: Map<string, ExerciseState>;
  skillStats: Map<string, SkillStat>;
  topicSettings: Map<string, TopicSetting>;
  now: number;
  length: number;
  /** Restriction facultative à une matière et/ou un sujet (mode entraînement). */
  subject?: string;
  topic?: string;
  /** Injectable pour rendre les tests déterministes. */
  random?: () => number;
}

export interface ScoredExercise {
  exercise: Exercise;
  score: number;
  reason: RecommendationReason;
}

export type RecommendationReason =
  | 'difficulte'
  | 'revision-due'
  | 'en-cours'
  | 'nouveau'
  | 'entretien';

export const REASON_LABELS: Record<RecommendationReason, string> = {
  difficulte: 'À retravailler',
  'revision-due': 'Révision du jour',
  'en-cours': 'En apprentissage',
  nouveau: 'Nouveau',
  entretien: 'Entretien',
};

/** Nombre d'exercices proposés selon le mode de jeu. */
export const DEFAULT_LENGTHS: Record<SessionMode, number> = {
  'revision-intelligente': 12,
  'revision-5min': 10,
  entrainement: 12,
  'defi-chrono': 15,
  'mini-jeu-math': 12,
  'mini-jeu-lecture': 8,
};

/** Types d'exercices autorisés par mode (undefined = tous). */
const MODE_KINDS: Partial<Record<SessionMode, string[]>> = {
  'defi-chrono': ['qcm', 'vraiFaux', 'calcul'],
  'revision-5min': ['qcm', 'vraiFaux', 'calcul', 'texteATrous'],
  'mini-jeu-math': ['calcul', 'qcm', 'ordre'],
  'mini-jeu-lecture': ['lecture'],
};

/** Matières autorisées par mode (undefined = toutes). */
const MODE_SUBJECTS: Partial<Record<SessionMode, string[]>> = {
  'mini-jeu-math': ['mathematique'],
};

const BASE_SCORES: Record<RecommendationReason, number> = {
  difficulte: 10,
  'revision-due': 7,
  'en-cours': 5,
  nouveau: 4,
  entretien: 1,
};

function reasonFor(
  exercise: Exercise,
  state: ExerciseState | undefined,
  level: MasteryLevel,
  now: number,
): RecommendationReason {
  if (level === 'difficulte') return 'difficulte';
  if (state && isDue(state, now) && state.attempts > 0) return 'revision-due';
  if (!state || state.attempts === 0) return 'nouveau';
  if (isMastered(state)) return 'entretien';
  if (level === 'en-cours') return 'en-cours';
  return 'entretien';
}

/** Calcule la priorité d'un exercice. Exporté pour être testé et expliqué au parent. */
export function scoreExercise(
  exercise: Exercise,
  options: Pick<SessionOptions, 'states' | 'skillStats' | 'topicSettings' | 'now'>,
): ScoredExercise {
  const state = options.states.get(exercise.key);
  const stat = options.skillStats.get(exercise.skill);
  const level: MasteryLevel = stat ? diagnoseSkill(stat).level : 'nouveau';
  const reason = reasonFor(exercise, state, level, options.now);

  let score = BASE_SCORES[reason];

  if (state && isDue(state, options.now)) {
    // Plus une révision est en retard, plus elle est urgente (plafonné à une semaine).
    score += Math.min(overdueDays(state, options.now), 7) * 0.5;
  }
  if (state && state.lapses > 0) score += Math.min(state.lapses, 3) * 0.7;
  if (stat && stat.failStreak > 0) score += Math.min(stat.failStreak, 3) * 0.8;
  if (state && isMastered(state) && !isDue(state, options.now)) score -= 3;

  const setting = options.topicSettings.get(`${exercise.subject}/${exercise.topic}`);
  const weight = setting?.weight ?? 1;
  score *= weight;

  return { exercise, score, reason };
}

/** Filtre les exercices selon les sujets activés par le parent et les contraintes du mode. */
export function eligibleExercises(options: SessionOptions): Exercise[] {
  const kinds = MODE_KINDS[options.mode];
  const subjects = MODE_SUBJECTS[options.mode];

  return options.exercises.filter((exercise) => {
    if (options.subject && exercise.subject !== options.subject) return false;
    if (options.topic && exercise.topic !== options.topic) return false;
    if (subjects && !subjects.includes(exercise.subject)) return false;
    if (kinds && !kinds.includes(exercise.prompt.kind)) return false;

    // Le mode entraînement cible explicitement un sujet : le parent l'a choisi,
    // on n'applique donc pas le filtre d'activation hebdomadaire.
    if (options.topic) return true;

    const setting = options.topicSettings.get(`${exercise.subject}/${exercise.topic}`);
    return setting ? setting.enabled : true;
  });
}

/**
 * Entrelace la file pour éviter d'enchaîner deux exercices de la même notion,
 * puis deux exercices du même type de jeu. On garde l'ordre de priorité au maximum.
 */
function interleave(items: ScoredExercise[]): ScoredExercise[] {
  const result: ScoredExercise[] = [];
  const pending = [...items];

  while (pending.length > 0) {
    const previous = result[result.length - 1];
    let index = 0;
    if (previous) {
      const better = pending.findIndex(
        (candidate) =>
          candidate.exercise.skill !== previous.exercise.skill &&
          candidate.exercise.prompt.kind !== previous.exercise.prompt.kind,
      );
      const acceptable = pending.findIndex(
        (candidate) => candidate.exercise.skill !== previous.exercise.skill,
      );
      index = better >= 0 ? better : acceptable >= 0 ? acceptable : 0;
    }
    result.push(pending[index]);
    pending.splice(index, 1);
  }

  return result;
}

/**
 * Construit la file d'exercices d'une partie.
 * Le mélange aléatoire léger (jitter) évite que deux parties consécutives soient identiques.
 */
export function buildSession(options: SessionOptions): ScoredExercise[] {
  const random = options.random ?? Math.random;
  const pool = eligibleExercises(options);
  if (pool.length === 0) return [];

  const scored = pool
    .map((exercise) => {
      const entry = scoreExercise(exercise, options);
      return { ...entry, score: entry.score * (0.85 + random() * 0.3) };
    })
    .sort((a, b) => b.score - a.score);

  const length = Math.min(options.length, scored.length);

  // On réserve au moins un quart de la partie à des exercices jamais vus, pour
  // que l'enfant découvre du contenu même quand beaucoup de révisions sont dues.
  // La réservation est faite AVANT la troncature : sinon les priorités élevées
  // des révisions en retard reprendraient toutes les places.
  const freshQuota = Math.max(1, Math.round(length * 0.25));
  const fresh = scored.filter((entry) => entry.reason === 'nouveau').slice(0, freshQuota);
  const freshKeys = new Set(fresh.map((entry) => entry.exercise.key));
  const rest = scored
    .filter((entry) => !freshKeys.has(entry.exercise.key))
    .slice(0, length - fresh.length);

  const selected = [...fresh, ...rest].sort((a, b) => b.score - a.score);

  return interleave(selected);
}

export interface RevisionAdvice {
  subject: string;
  topic: string;
  skill: string;
  reason: RecommendationReason;
  count: number;
}

/**
 * Résumé destiné au parent : « voici ce que la prochaine séance va travailler ».
 */
export function explainNextSession(session: ScoredExercise[]): RevisionAdvice[] {
  const map = new Map<string, RevisionAdvice>();
  for (const entry of session) {
    const key = `${entry.exercise.skill}:${entry.reason}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        subject: entry.exercise.subject,
        topic: entry.exercise.topic,
        skill: entry.exercise.skill,
        reason: entry.reason,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
