/** Types partagés entre la base de données locale et la logique métier. */

export type SessionMode =
  | 'revision-intelligente'
  | 'revision-5min'
  | 'entrainement'
  | 'defi-chrono'
  | 'mini-jeu-math'
  | 'mini-jeu-lecture';

export interface AttemptRecord {
  id?: number;
  sessionId: number;
  exerciseKey: string;
  packId: string;
  subject: string;
  topic: string;
  skill: string;
  kind: string;
  correct: boolean;
  /** Score partiel entre 0 et 1 (jeux à plusieurs éléments). */
  score: number;
  responseMs: number;
  givenAnswer: string;
  expectedAnswer: string;
  usedHint: boolean;
  createdAt: number;
}

export interface SessionRecord {
  id?: number;
  mode: SessionMode;
  subject: string | null;
  topic: string | null;
  startedAt: number;
  endedAt: number | null;
  total: number;
  correct: number;
  points: number;
  stars: number;
  durationMs: number;
}

/** État de mémorisation d'un exercice (répétition espacée). */
export interface ExerciseState {
  exerciseKey: string;
  subject: string;
  topic: string;
  skill: string;
  /** Facteur de facilité (1.3 à 2.8), inspiré de SM-2. */
  ease: number;
  /** Intervalle courant en jours. */
  intervalDays: number;
  /** Nombre de réussites consécutives. */
  repetitions: number;
  /** Nombre d'oublis (bonne réponse redevenue mauvaise). */
  lapses: number;
  /** Date de la prochaine révision (timestamp ms). */
  dueAt: number;
  lastSeenAt: number;
  lastScore: number;
  attempts: number;
  correct: number;
}

/** Agrégat par notion fine, base de la détection des difficultés. */
export interface SkillStat {
  skill: string;
  subject: string;
  topic: string;
  attempts: number;
  correct: number;
  /** Moyenne mobile pondérée des derniers scores (0 à 1) : réagit vite aux progrès. */
  recentScore: number;
  avgMs: number;
  lastSeenAt: number;
  /** Nombre d'échecs consécutifs. */
  failStreak: number;
}

export interface ProgressState {
  points: number;
  level: number;
  stars: number;
  streakDays: number;
  bestStreak: number;
  /** Jour ISO (AAAA-MM-JJ) de la dernière activité. */
  lastActiveDay: string | null;
  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  totalMs: number;
  bestCombo: number;
  perfectSessions: number;
  avatarId: string;
  themeId: string;
}

export interface AchievementState {
  achievementId: string;
  unlockedAt: number;
}

export interface DailyActivity {
  day: string;
  sessions: number;
  attempts: number;
  correct: number;
  points: number;
  ms: number;
}

/** Réglage parent pour un sujet (matière/sujet activé ou non pour la semaine). */
export interface TopicSetting {
  /** Clé « matiere/sujet ». */
  key: string;
  subject: string;
  topic: string;
  enabled: boolean;
  /** Poids de priorité choisi par le parent : 1 = normal, 2 = à travailler, 3 = prioritaire. */
  weight: number;
  /** Étiquette libre, ex. « Semaine du 8 septembre ». */
  weekLabel: string | null;
  updatedAt: number;
}

export const DEFAULT_PROGRESS: ProgressState = {
  points: 0,
  level: 1,
  stars: 0,
  streakDays: 0,
  bestStreak: 0,
  lastActiveDay: null,
  totalSessions: 0,
  totalAttempts: 0,
  totalCorrect: 0,
  totalMs: 0,
  bestCombo: 0,
  perfectSessions: 0,
  avatarId: 'renard',
  themeId: 'classique',
};
