/**
 * Système de motivation : points, niveaux, étoiles, séries, médailles et déblocages.
 *
 * Les médailles et les récompenses sont décrites dans `content/config/*.json` :
 * on ajoute une médaille en ajoutant un objet JSON, sans toucher au code.
 */

import achievementsConfig from '../../content/config/achievements.json';
import rewardsConfig from '../../content/config/recompenses.json';
import type { ProgressState } from './types';

export type AchievementTier = 'bronze' | 'argent' | 'or';

export interface AchievementDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  metric: string;
  scope?: string;
  target: number;
  tier: AchievementTier;
}

export interface RewardAvatar {
  id: string;
  emoji: string;
  label: string;
  unlockLevel: number;
}

export interface RewardTheme {
  id: string;
  label: string;
  primary: string;
  unlockLevel: number;
}

export const ACHIEVEMENTS: AchievementDef[] = (
  achievementsConfig.achievements as AchievementDef[]
).slice();

export const AVATARS: RewardAvatar[] = rewardsConfig.avatars as RewardAvatar[];
export const THEMES: RewardTheme[] = rewardsConfig.themes as RewardTheme[];

// ---------------------------------------------------------------------------
// Points
// ---------------------------------------------------------------------------

export const BASE_POINTS = 10;

/** Un exercice difficile rapporte davantage. */
const DIFFICULTY_MULTIPLIER: Record<number, number> = { 1: 1, 2: 1.2, 3: 1.5 };

export interface PointsInput {
  correct: boolean;
  /** Score partiel entre 0 et 1. */
  score: number;
  difficulty: number;
  responseMs: number;
  timeTargetMs: number;
  /** Nombre de bonnes réponses consécutives AVANT celle-ci. */
  combo: number;
  usedHint: boolean;
}

export interface PointsBreakdown {
  base: number;
  speedBonus: number;
  comboBonus: number;
  total: number;
}

/**
 * Calcule les points d'un exercice.
 * Une réponse partiellement bonne rapporte proportionnellement : l'enfant qui
 * classe 4 mots sur 6 n'a pas travaillé pour rien.
 */
export function computePoints(input: PointsInput): PointsBreakdown {
  const multiplier = DIFFICULTY_MULTIPLIER[input.difficulty] ?? 1;
  const effectiveScore = input.correct ? 1 : Math.max(0, Math.min(1, input.score));
  let base = Math.round(BASE_POINTS * multiplier * effectiveScore);
  if (input.usedHint) base = Math.round(base * 0.7);

  let speedBonus = 0;
  if (input.correct && input.responseMs > 0 && input.responseMs < input.timeTargetMs) {
    const ratio = 1 - input.responseMs / input.timeTargetMs;
    speedBonus = Math.round(5 * ratio);
  }

  const comboBonus = input.correct ? Math.min(input.combo, 5) * 2 : 0;

  return { base, speedBonus, comboBonus, total: base + speedBonus + comboBonus };
}

// ---------------------------------------------------------------------------
// Niveaux
// ---------------------------------------------------------------------------

/** Points cumulés nécessaires pour atteindre un niveau donné. */
export function pointsForLevel(level: number): number {
  if (level <= 1) return 0;
  // Progression douce : 150, 375, 675, 1050… (chaque palier coûte 75 de plus)
  const n = level - 1;
  return 150 * n + 75 * ((n * (n - 1)) / 2);
}

export function levelForPoints(points: number): number {
  let level = 1;
  while (points >= pointsForLevel(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  pointsInLevel: number;
  pointsNeeded: number;
  ratio: number;
}

export function levelProgress(points: number): LevelProgress {
  const level = levelForPoints(points);
  const floor = pointsForLevel(level);
  const ceiling = pointsForLevel(level + 1);
  const pointsInLevel = points - floor;
  const pointsNeeded = ceiling - floor;
  return {
    level,
    pointsInLevel,
    pointsNeeded,
    ratio: pointsNeeded === 0 ? 1 : Math.min(1, pointsInLevel / pointsNeeded),
  };
}

// ---------------------------------------------------------------------------
// Étoiles
// ---------------------------------------------------------------------------

/** 0 à 3 étoiles selon le pourcentage de réussite de la partie. */
export function starsForSession(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Série de jours consécutifs
// ---------------------------------------------------------------------------

export const toDayKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const dayDifference = (from: string, to: string): number => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
};

export interface StreakUpdate {
  streakDays: number;
  bestStreak: number;
  lastActiveDay: string;
  /** Vrai si l'enfant vient d'allonger sa série aujourd'hui. */
  extended: boolean;
}

/** Met à jour la série de jours consécutifs après une partie terminée. */
export function updateStreak(progress: ProgressState, now: number): StreakUpdate {
  const today = toDayKey(now);
  if (progress.lastActiveDay === today) {
    return {
      streakDays: progress.streakDays,
      bestStreak: progress.bestStreak,
      lastActiveDay: today,
      extended: false,
    };
  }
  const gap = progress.lastActiveDay ? dayDifference(progress.lastActiveDay, today) : null;
  const streakDays = gap === 1 ? progress.streakDays + 1 : 1;
  return {
    streakDays,
    bestStreak: Math.max(progress.bestStreak, streakDays),
    lastActiveDay: today,
    extended: true,
  };
}

// ---------------------------------------------------------------------------
// Médailles
// ---------------------------------------------------------------------------

export interface AchievementMetrics {
  sessions: number;
  perfectSessions: number;
  streakDays: number;
  totalCorrect: number;
  level: number;
  points: number;
  bestCombo: number;
  masteredExercises: number;
  /** Bonnes réponses par matière (clé = clé de matière). */
  subjectCorrect: Record<string, number>;
}

function metricValue(def: AchievementDef, metrics: AchievementMetrics): number {
  if (def.metric === 'subjectCorrect') {
    return def.scope ? (metrics.subjectCorrect[def.scope] ?? 0) : 0;
  }
  const value = (metrics as unknown as Record<string, unknown>)[def.metric];
  return typeof value === 'number' ? value : 0;
}

export interface AchievementProgress {
  def: AchievementDef;
  value: number;
  unlocked: boolean;
  ratio: number;
}

/** Avancement de chaque médaille, pour l'écran « Mes médailles ». */
export function achievementProgress(
  metrics: AchievementMetrics,
  unlockedIds: Set<string>,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const value = metricValue(def, metrics);
    return {
      def,
      value,
      unlocked: unlockedIds.has(def.id) || value >= def.target,
      ratio: def.target === 0 ? 1 : Math.min(1, value / def.target),
    };
  });
}

/** Médailles nouvellement atteintes (à célébrer à la fin d'une partie). */
export function newlyUnlocked(
  metrics: AchievementMetrics,
  alreadyUnlocked: Set<string>,
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (def) => !alreadyUnlocked.has(def.id) && metricValue(def, metrics) >= def.target,
  );
}

// ---------------------------------------------------------------------------
// Déblocages
// ---------------------------------------------------------------------------

export const unlockedAvatars = (level: number): RewardAvatar[] =>
  AVATARS.filter((avatar) => avatar.unlockLevel <= level);

export const unlockedThemes = (level: number): RewardTheme[] =>
  THEMES.filter((theme) => theme.unlockLevel <= level);

/** Prochaine récompense à débloquer, pour donner un objectif visible à l'enfant. */
export function nextReward(level: number): { label: string; emoji: string; level: number } | null {
  const avatar = AVATARS.find((a) => a.unlockLevel > level);
  const theme = THEMES.find((t) => t.unlockLevel > level);
  const candidates: { label: string; emoji: string; level: number }[] = [];
  if (avatar) candidates.push({ label: avatar.label, emoji: avatar.emoji, level: avatar.unlockLevel });
  if (theme) candidates.push({ label: `Thème ${theme.label}`, emoji: '🎨', level: theme.unlockLevel });
  candidates.sort((a, b) => a.level - b.level);
  return candidates[0] ?? null;
}
