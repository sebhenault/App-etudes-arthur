/**
 * Schéma de la base de données locale (SQLite).
 *
 * Tout reste sur l'appareil : aucune donnée n'est envoyée sur Internet.
 * Les migrations sont numérotées ; `user_version` (PRAGMA SQLite) sert de curseur,
 * ce qui permet de faire évoluer le schéma sans jamais perdre l'historique d'Arthur.
 */

export const DATABASE_NAME = 'defis-arthur.db';

export interface Migration {
  version: number;
  label: string;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    label: 'Schéma initial',
    statements: [
      `CREATE TABLE IF NOT EXISTS profiles (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        grade         INTEGER NOT NULL DEFAULT 4,
        avatar_id     TEXT NOT NULL DEFAULT 'renard',
        theme_id      TEXT NOT NULL DEFAULT 'classique',
        created_at    INTEGER NOT NULL
      );`,

      // Réglages parent : quels sujets sont travaillés cette semaine.
      `CREATE TABLE IF NOT EXISTS topic_settings (
        profile_id    INTEGER NOT NULL,
        key           TEXT NOT NULL,
        subject       TEXT NOT NULL,
        topic         TEXT NOT NULL,
        enabled       INTEGER NOT NULL DEFAULT 1,
        weight        INTEGER NOT NULL DEFAULT 1,
        week_label    TEXT,
        updated_at    INTEGER NOT NULL,
        PRIMARY KEY (profile_id, key)
      );`,

      // Packs importés par le parent (JSON brut conservé tel quel).
      `CREATE TABLE IF NOT EXISTS imported_packs (
        pack_id       TEXT PRIMARY KEY,
        subject       TEXT NOT NULL,
        topic         TEXT NOT NULL,
        title         TEXT NOT NULL,
        json          TEXT NOT NULL,
        imported_at   INTEGER NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id    INTEGER NOT NULL,
        mode          TEXT NOT NULL,
        subject       TEXT,
        topic         TEXT,
        started_at    INTEGER NOT NULL,
        ended_at      INTEGER,
        total         INTEGER NOT NULL DEFAULT 0,
        correct       INTEGER NOT NULL DEFAULT 0,
        points        INTEGER NOT NULL DEFAULT 0,
        stars         INTEGER NOT NULL DEFAULT 0,
        duration_ms   INTEGER NOT NULL DEFAULT 0
      );`,

      `CREATE TABLE IF NOT EXISTS attempts (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id      INTEGER NOT NULL,
        session_id      INTEGER NOT NULL,
        exercise_key    TEXT NOT NULL,
        pack_id         TEXT NOT NULL,
        subject         TEXT NOT NULL,
        topic           TEXT NOT NULL,
        skill           TEXT NOT NULL,
        kind            TEXT NOT NULL,
        correct         INTEGER NOT NULL,
        score           REAL NOT NULL,
        response_ms     INTEGER NOT NULL,
        given_answer    TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        used_hint       INTEGER NOT NULL DEFAULT 0,
        created_at      INTEGER NOT NULL
      );`,

      `CREATE INDEX IF NOT EXISTS idx_attempts_profile_date ON attempts (profile_id, created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_attempts_skill ON attempts (profile_id, skill);`,
      `CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON attempts (profile_id, exercise_key);`,

      // Répétition espacée : un état par exercice.
      `CREATE TABLE IF NOT EXISTS exercise_states (
        profile_id     INTEGER NOT NULL,
        exercise_key   TEXT NOT NULL,
        subject        TEXT NOT NULL,
        topic          TEXT NOT NULL,
        skill          TEXT NOT NULL,
        ease           REAL NOT NULL,
        interval_days  REAL NOT NULL,
        repetitions    INTEGER NOT NULL,
        lapses         INTEGER NOT NULL,
        due_at         INTEGER NOT NULL,
        last_seen_at   INTEGER NOT NULL,
        last_score     REAL NOT NULL,
        attempts       INTEGER NOT NULL,
        correct        INTEGER NOT NULL,
        PRIMARY KEY (profile_id, exercise_key)
      );`,

      `CREATE INDEX IF NOT EXISTS idx_states_due ON exercise_states (profile_id, due_at);`,

      // Agrégat par notion fine : évite de recalculer tout l'historique à chaque écran.
      `CREATE TABLE IF NOT EXISTS skill_stats (
        profile_id    INTEGER NOT NULL,
        skill         TEXT NOT NULL,
        subject       TEXT NOT NULL,
        topic         TEXT NOT NULL,
        attempts      INTEGER NOT NULL,
        correct       INTEGER NOT NULL,
        recent_score  REAL NOT NULL,
        avg_ms        INTEGER NOT NULL,
        last_seen_at  INTEGER NOT NULL,
        fail_streak   INTEGER NOT NULL,
        PRIMARY KEY (profile_id, skill)
      );`,

      `CREATE TABLE IF NOT EXISTS progress (
        profile_id       INTEGER PRIMARY KEY,
        points           INTEGER NOT NULL DEFAULT 0,
        level            INTEGER NOT NULL DEFAULT 1,
        stars            INTEGER NOT NULL DEFAULT 0,
        streak_days      INTEGER NOT NULL DEFAULT 0,
        best_streak      INTEGER NOT NULL DEFAULT 0,
        last_active_day  TEXT,
        total_sessions   INTEGER NOT NULL DEFAULT 0,
        total_attempts   INTEGER NOT NULL DEFAULT 0,
        total_correct    INTEGER NOT NULL DEFAULT 0,
        total_ms         INTEGER NOT NULL DEFAULT 0,
        best_combo       INTEGER NOT NULL DEFAULT 0,
        perfect_sessions INTEGER NOT NULL DEFAULT 0
      );`,

      `CREATE TABLE IF NOT EXISTS achievements (
        profile_id     INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at    INTEGER NOT NULL,
        PRIMARY KEY (profile_id, achievement_id)
      );`,

      `CREATE TABLE IF NOT EXISTS daily_activity (
        profile_id  INTEGER NOT NULL,
        day         TEXT NOT NULL,
        sessions    INTEGER NOT NULL DEFAULT 0,
        attempts    INTEGER NOT NULL DEFAULT 0,
        correct     INTEGER NOT NULL DEFAULT 0,
        points      INTEGER NOT NULL DEFAULT 0,
        ms          INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (profile_id, day)
      );`,

      // Réglages généraux (NIP parent, durée des défis, etc.).
      `CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
