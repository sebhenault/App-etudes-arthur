/**
 * Accès aux données locales. Toutes les requêtes SQL de l'application vivent ici :
 * les écrans et la logique métier ne manipulent jamais SQLite directement.
 */

import type { LoadedPack } from '../content/types';
import { toDayKey } from '../domain/gamification';
import {
  DEFAULT_PROGRESS,
  type AchievementState,
  type AttemptRecord,
  type DailyActivity,
  type ExerciseState,
  type ProgressState,
  type SessionMode,
  type SessionRecord,
  type SkillStat,
  type TopicSetting,
} from '../domain/types';
import { getDatabase } from './database';

const bool = (value: number | boolean): boolean => value === 1 || value === true;
const num = (value: boolean): number => (value ? 1 : 0);

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

export interface ProfileRow {
  id: number;
  name: string;
  grade: number;
  avatar_id: string;
  theme_id: string;
  created_at: number;
}

export interface Profile {
  id: number;
  name: string;
  grade: number;
  avatarId: string;
  themeId: string;
  createdAt: number;
}

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  name: row.name,
  grade: row.grade,
  avatarId: row.avatar_id,
  themeId: row.theme_id,
  createdAt: row.created_at,
});

/** Récupère le profil de l'enfant, ou le crée à la première ouverture. */
export async function ensureProfile(defaultName = 'Arthur'): Promise<Profile> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM profiles ORDER BY id LIMIT 1;',
  );
  if (existing) return toProfile(existing);

  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO profiles (name, grade, avatar_id, theme_id, created_at) VALUES (?, ?, ?, ?, ?);',
    [defaultName, 4, DEFAULT_PROGRESS.avatarId, DEFAULT_PROGRESS.themeId, now],
  );
  await db.runAsync('INSERT OR IGNORE INTO progress (profile_id) VALUES (?);', [
    result.lastInsertRowId,
  ]);
  return {
    id: result.lastInsertRowId,
    name: defaultName,
    grade: 4,
    avatarId: DEFAULT_PROGRESS.avatarId,
    themeId: DEFAULT_PROGRESS.themeId,
    createdAt: now,
  };
}

export async function updateProfile(
  profileId: number,
  patch: Partial<Pick<Profile, 'name' | 'grade' | 'avatarId' | 'themeId'>>,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (patch.name !== undefined) {
    fields.push('name = ?');
    values.push(patch.name);
  }
  if (patch.grade !== undefined) {
    fields.push('grade = ?');
    values.push(patch.grade);
  }
  if (patch.avatarId !== undefined) {
    fields.push('avatar_id = ?');
    values.push(patch.avatarId);
  }
  if (patch.themeId !== undefined) {
    fields.push('theme_id = ?');
    values.push(patch.themeId);
  }
  if (fields.length === 0) return;
  values.push(profileId);
  await db.runAsync(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?;`, values);
}

// ---------------------------------------------------------------------------
// Sujets activés par le parent
// ---------------------------------------------------------------------------

interface TopicSettingRow {
  key: string;
  subject: string;
  topic: string;
  enabled: number;
  weight: number;
  week_label: string | null;
  updated_at: number;
}

export async function getTopicSettings(profileId: number): Promise<Map<string, TopicSetting>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TopicSettingRow>(
    'SELECT key, subject, topic, enabled, weight, week_label, updated_at FROM topic_settings WHERE profile_id = ?;',
    [profileId],
  );
  return new Map(
    rows.map((row) => [
      row.key,
      {
        key: row.key,
        subject: row.subject,
        topic: row.topic,
        enabled: bool(row.enabled),
        weight: row.weight,
        weekLabel: row.week_label,
        updatedAt: row.updated_at,
      },
    ]),
  );
}

/**
 * Crée les réglages manquants pour les sujets présents dans la bibliothèque.
 * Appelé au démarrage : un pack ajouté par le parent apparaît ainsi tout seul
 * dans le tableau de bord, avec la valeur `defaultEnabled` déclarée dans le JSON.
 */
export async function seedTopicSettings(
  profileId: number,
  entries: { key: string; subject: string; topic: string; defaultEnabled: boolean }[],
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      await db.runAsync(
        `INSERT OR IGNORE INTO topic_settings (profile_id, key, subject, topic, enabled, weight, week_label, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, NULL, ?);`,
        [profileId, entry.key, entry.subject, entry.topic, num(entry.defaultEnabled), now],
      );
    }
  });
}

export async function setTopicEnabled(
  profileId: number,
  key: string,
  enabled: boolean,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE topic_settings SET enabled = ?, updated_at = ? WHERE profile_id = ? AND key = ?;',
    [num(enabled), Date.now(), profileId, key],
  );
}

export async function setTopicWeight(
  profileId: number,
  key: string,
  weight: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE topic_settings SET weight = ?, updated_at = ? WHERE profile_id = ? AND key = ?;',
    [weight, Date.now(), profileId, key],
  );
}

/** Active ou désactive tous les sujets d'une matière d'un seul geste. */
export async function setSubjectEnabled(
  profileId: number,
  subject: string,
  enabled: boolean,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE topic_settings SET enabled = ?, updated_at = ? WHERE profile_id = ? AND subject = ?;',
    [num(enabled), Date.now(), profileId, subject],
  );
}

/** Prépare une nouvelle semaine : tout désactiver, puis n'activer que la liste reçue. */
export async function applyWeekPlan(
  profileId: number,
  enabledKeys: string[],
  weekLabel: string | null,
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE topic_settings SET enabled = 0, week_label = ?, updated_at = ? WHERE profile_id = ?;',
      [weekLabel, now, profileId],
    );
    for (const key of enabledKeys) {
      await db.runAsync(
        'UPDATE topic_settings SET enabled = 1, week_label = ?, updated_at = ? WHERE profile_id = ? AND key = ?;',
        [weekLabel, now, profileId, key],
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Packs importés
// ---------------------------------------------------------------------------

interface ImportedPackRow {
  pack_id: string;
  json: string;
  imported_at: number;
}

export async function listImportedPacks(): Promise<LoadedPack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ImportedPackRow>(
    'SELECT pack_id, json, imported_at FROM imported_packs ORDER BY imported_at DESC;',
  );
  const packs: LoadedPack[] = [];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.json);
      packs.push({ ...parsed, origin: 'imported', importedAt: row.imported_at });
    } catch {
      // Un pack corrompu est ignoré plutôt que de bloquer le démarrage.
    }
  }
  return packs;
}

export async function saveImportedPack(pack: LoadedPack, json: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO imported_packs (pack_id, subject, topic, title, json, imported_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(pack_id) DO UPDATE SET
       subject = excluded.subject, topic = excluded.topic, title = excluded.title,
       json = excluded.json, imported_at = excluded.imported_at;`,
    [pack.id, pack.subject, pack.topic, pack.title, json, Date.now()],
  );
}

export async function deleteImportedPack(packId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM imported_packs WHERE pack_id = ?;', [packId]);
}

// ---------------------------------------------------------------------------
// Parties et tentatives
// ---------------------------------------------------------------------------

export async function startSession(
  profileId: number,
  mode: SessionMode,
  subject: string | null,
  topic: string | null,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO sessions (profile_id, mode, subject, topic, started_at) VALUES (?, ?, ?, ?, ?);',
    [profileId, mode, subject, topic, Date.now()],
  );
  return result.lastInsertRowId;
}

export async function recordAttempt(profileId: number, attempt: AttemptRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO attempts (profile_id, session_id, exercise_key, pack_id, subject, topic, skill, kind,
       correct, score, response_ms, given_answer, expected_answer, used_hint, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      profileId,
      attempt.sessionId,
      attempt.exerciseKey,
      attempt.packId,
      attempt.subject,
      attempt.topic,
      attempt.skill,
      attempt.kind,
      num(attempt.correct),
      attempt.score,
      attempt.responseMs,
      attempt.givenAnswer,
      attempt.expectedAnswer,
      num(attempt.usedHint),
      attempt.createdAt,
    ],
  );
}

export async function finishSession(
  sessionId: number,
  summary: { total: number; correct: number; points: number; stars: number; durationMs: number },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sessions SET ended_at = ?, total = ?, correct = ?, points = ?, stars = ?, duration_ms = ?
     WHERE id = ?;`,
    [
      Date.now(),
      summary.total,
      summary.correct,
      summary.points,
      summary.stars,
      summary.durationMs,
      sessionId,
    ],
  );
}

interface SessionRow {
  id: number;
  mode: string;
  subject: string | null;
  topic: string | null;
  started_at: number;
  ended_at: number | null;
  total: number;
  correct: number;
  points: number;
  stars: number;
  duration_ms: number;
}

export async function getRecentSessions(
  profileId: number,
  limit = 20,
): Promise<SessionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE profile_id = ? AND ended_at IS NOT NULL ORDER BY started_at DESC LIMIT ?;',
    [profileId, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    mode: row.mode as SessionMode,
    subject: row.subject,
    topic: row.topic,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    total: row.total,
    correct: row.correct,
    points: row.points,
    stars: row.stars,
    durationMs: row.duration_ms,
  }));
}

interface AttemptRow {
  id: number;
  session_id: number;
  exercise_key: string;
  pack_id: string;
  subject: string;
  topic: string;
  skill: string;
  kind: string;
  correct: number;
  score: number;
  response_ms: number;
  given_answer: string;
  expected_answer: string;
  used_hint: number;
  created_at: number;
}

const toAttempt = (row: AttemptRow): AttemptRecord => ({
  id: row.id,
  sessionId: row.session_id,
  exerciseKey: row.exercise_key,
  packId: row.pack_id,
  subject: row.subject,
  topic: row.topic,
  skill: row.skill,
  kind: row.kind,
  correct: bool(row.correct),
  score: row.score,
  responseMs: row.response_ms,
  givenAnswer: row.given_answer,
  expectedAnswer: row.expected_answer,
  usedHint: bool(row.used_hint),
  createdAt: row.created_at,
});

export async function getRecentAttempts(
  profileId: number,
  limit = 300,
): Promise<AttemptRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AttemptRow>(
    'SELECT * FROM attempts WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?;',
    [profileId, limit],
  );
  return rows.map(toAttempt);
}

/** Tentatives d'une période donnée, pour l'analyse des erreurs fréquentes. */
export async function getAttemptsSince(
  profileId: number,
  since: number,
): Promise<AttemptRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AttemptRow>(
    'SELECT * FROM attempts WHERE profile_id = ? AND created_at >= ? ORDER BY created_at DESC;',
    [profileId, since],
  );
  return rows.map(toAttempt);
}

export async function getSubjectCorrectCounts(
  profileId: number,
): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ subject: string; total: number }>(
    'SELECT subject, COUNT(*) AS total FROM attempts WHERE profile_id = ? AND correct = 1 GROUP BY subject;',
    [profileId],
  );
  return Object.fromEntries(rows.map((row) => [row.subject, row.total]));
}

// ---------------------------------------------------------------------------
// Répétition espacée
// ---------------------------------------------------------------------------

interface ExerciseStateRow {
  exercise_key: string;
  subject: string;
  topic: string;
  skill: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: number;
  last_seen_at: number;
  last_score: number;
  attempts: number;
  correct: number;
}

const toState = (row: ExerciseStateRow): ExerciseState => ({
  exerciseKey: row.exercise_key,
  subject: row.subject,
  topic: row.topic,
  skill: row.skill,
  ease: row.ease,
  intervalDays: row.interval_days,
  repetitions: row.repetitions,
  lapses: row.lapses,
  dueAt: row.due_at,
  lastSeenAt: row.last_seen_at,
  lastScore: row.last_score,
  attempts: row.attempts,
  correct: row.correct,
});

export async function getExerciseStates(profileId: number): Promise<Map<string, ExerciseState>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseStateRow>(
    'SELECT * FROM exercise_states WHERE profile_id = ?;',
    [profileId],
  );
  return new Map(rows.map((row) => [row.exercise_key, toState(row)]));
}

export async function saveExerciseState(
  profileId: number,
  state: ExerciseState,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO exercise_states (profile_id, exercise_key, subject, topic, skill, ease, interval_days,
       repetitions, lapses, due_at, last_seen_at, last_score, attempts, correct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(profile_id, exercise_key) DO UPDATE SET
       ease = excluded.ease, interval_days = excluded.interval_days, repetitions = excluded.repetitions,
       lapses = excluded.lapses, due_at = excluded.due_at, last_seen_at = excluded.last_seen_at,
       last_score = excluded.last_score, attempts = excluded.attempts, correct = excluded.correct;`,
    [
      profileId,
      state.exerciseKey,
      state.subject,
      state.topic,
      state.skill,
      state.ease,
      state.intervalDays,
      state.repetitions,
      state.lapses,
      state.dueAt,
      state.lastSeenAt,
      state.lastScore,
      state.attempts,
      state.correct,
    ],
  );
}

export async function countDue(profileId: number, now: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM exercise_states WHERE profile_id = ? AND due_at <= ?;',
    [profileId, now],
  );
  return row?.total ?? 0;
}

export async function countMastered(profileId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM exercise_states WHERE profile_id = ? AND repetitions >= 3 AND interval_days >= 7;',
    [profileId],
  );
  return row?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Statistiques par notion
// ---------------------------------------------------------------------------

interface SkillStatRow {
  skill: string;
  subject: string;
  topic: string;
  attempts: number;
  correct: number;
  recent_score: number;
  avg_ms: number;
  last_seen_at: number;
  fail_streak: number;
}

export async function getSkillStats(profileId: number): Promise<Map<string, SkillStat>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SkillStatRow>(
    'SELECT * FROM skill_stats WHERE profile_id = ?;',
    [profileId],
  );
  return new Map(
    rows.map((row) => [
      row.skill,
      {
        skill: row.skill,
        subject: row.subject,
        topic: row.topic,
        attempts: row.attempts,
        correct: row.correct,
        recentScore: row.recent_score,
        avgMs: row.avg_ms,
        lastSeenAt: row.last_seen_at,
        failStreak: row.fail_streak,
      },
    ]),
  );
}

export async function saveSkillStat(profileId: number, stat: SkillStat): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO skill_stats (profile_id, skill, subject, topic, attempts, correct, recent_score, avg_ms, last_seen_at, fail_streak)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(profile_id, skill) DO UPDATE SET
       subject = excluded.subject, topic = excluded.topic, attempts = excluded.attempts,
       correct = excluded.correct, recent_score = excluded.recent_score, avg_ms = excluded.avg_ms,
       last_seen_at = excluded.last_seen_at, fail_streak = excluded.fail_streak;`,
    [
      profileId,
      stat.skill,
      stat.subject,
      stat.topic,
      stat.attempts,
      stat.correct,
      stat.recentScore,
      stat.avgMs,
      stat.lastSeenAt,
      stat.failStreak,
    ],
  );
}

// ---------------------------------------------------------------------------
// Progression et médailles
// ---------------------------------------------------------------------------

interface ProgressRow {
  points: number;
  level: number;
  stars: number;
  streak_days: number;
  best_streak: number;
  last_active_day: string | null;
  total_sessions: number;
  total_attempts: number;
  total_correct: number;
  total_ms: number;
  best_combo: number;
  perfect_sessions: number;
}

export async function getProgress(profileId: number): Promise<ProgressState> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO progress (profile_id) VALUES (?);', [profileId]);
  const row = await db.getFirstAsync<ProgressRow>(
    'SELECT * FROM progress WHERE profile_id = ?;',
    [profileId],
  );
  const profile = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?;', [
    profileId,
  ]);
  if (!row) return { ...DEFAULT_PROGRESS };
  return {
    points: row.points,
    level: row.level,
    stars: row.stars,
    streakDays: row.streak_days,
    bestStreak: row.best_streak,
    lastActiveDay: row.last_active_day,
    totalSessions: row.total_sessions,
    totalAttempts: row.total_attempts,
    totalCorrect: row.total_correct,
    totalMs: row.total_ms,
    bestCombo: row.best_combo,
    perfectSessions: row.perfect_sessions,
    avatarId: profile?.avatar_id ?? DEFAULT_PROGRESS.avatarId,
    themeId: profile?.theme_id ?? DEFAULT_PROGRESS.themeId,
  };
}

export async function saveProgress(profileId: number, progress: ProgressState): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO progress (profile_id, points, level, stars, streak_days, best_streak, last_active_day,
       total_sessions, total_attempts, total_correct, total_ms, best_combo, perfect_sessions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(profile_id) DO UPDATE SET
       points = excluded.points, level = excluded.level, stars = excluded.stars,
       streak_days = excluded.streak_days, best_streak = excluded.best_streak,
       last_active_day = excluded.last_active_day, total_sessions = excluded.total_sessions,
       total_attempts = excluded.total_attempts, total_correct = excluded.total_correct,
       total_ms = excluded.total_ms, best_combo = excluded.best_combo,
       perfect_sessions = excluded.perfect_sessions;`,
    [
      profileId,
      progress.points,
      progress.level,
      progress.stars,
      progress.streakDays,
      progress.bestStreak,
      progress.lastActiveDay,
      progress.totalSessions,
      progress.totalAttempts,
      progress.totalCorrect,
      progress.totalMs,
      progress.bestCombo,
      progress.perfectSessions,
    ],
  );
}

export async function getAchievements(profileId: number): Promise<AchievementState[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ achievement_id: string; unlocked_at: number }>(
    'SELECT achievement_id, unlocked_at FROM achievements WHERE profile_id = ? ORDER BY unlocked_at DESC;',
    [profileId],
  );
  return rows.map((row) => ({ achievementId: row.achievement_id, unlockedAt: row.unlocked_at }));
}

export async function unlockAchievements(profileId: number, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      await db.runAsync(
        'INSERT OR IGNORE INTO achievements (profile_id, achievement_id, unlocked_at) VALUES (?, ?, ?);',
        [profileId, id, now],
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Activité quotidienne
// ---------------------------------------------------------------------------

export async function bumpDailyActivity(
  profileId: number,
  delta: { attempts: number; correct: number; points: number; ms: number; sessions: number },
  when = Date.now(),
): Promise<void> {
  const db = await getDatabase();
  const day = toDayKey(when);
  await db.runAsync(
    `INSERT INTO daily_activity (profile_id, day, sessions, attempts, correct, points, ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(profile_id, day) DO UPDATE SET
       sessions = sessions + excluded.sessions,
       attempts = attempts + excluded.attempts,
       correct  = correct  + excluded.correct,
       points   = points   + excluded.points,
       ms       = ms       + excluded.ms;`,
    [profileId, day, delta.sessions, delta.attempts, delta.correct, delta.points, delta.ms],
  );
}

export async function getDailyActivity(
  profileId: number,
  days = 30,
): Promise<DailyActivity[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    day: string;
    sessions: number;
    attempts: number;
    correct: number;
    points: number;
    ms: number;
  }>(
    'SELECT * FROM daily_activity WHERE profile_id = ? ORDER BY day DESC LIMIT ?;',
    [profileId, days],
  );
  return rows.reverse();
}

// ---------------------------------------------------------------------------
// Réglages généraux
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value],
  );
}

/** Efface la progression tout en conservant le profil et les réglages de sujets. */
export async function resetProgress(profileId: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM attempts WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM sessions WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM exercise_states WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM skill_stats WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM achievements WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM daily_activity WHERE profile_id = ?;', [profileId]);
    await db.runAsync('DELETE FROM progress WHERE profile_id = ?;', [profileId]);
    await db.runAsync('INSERT INTO progress (profile_id) VALUES (?);', [profileId]);
  });
}
