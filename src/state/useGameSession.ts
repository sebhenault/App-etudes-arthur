/**
 * Déroulement d'une partie : construction de la file, correction, calcul des
 * points, enregistrement local et bilan de fin.
 *
 * Toute l'écriture en base passe par ce hook, de sorte qu'un écran de jeu n'a
 * jamais à savoir comment la progression est stockée.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  gradeExercise,
  type Exercise,
  type ExerciseResponse,
  type GradeResult,
} from '../content/exercises';
import * as repo from '../db/repositories';
import {
  computePoints,
  levelForPoints,
  newlyUnlocked,
  starsForSession,
  updateStreak,
  type AchievementDef,
  type AchievementMetrics,
} from '../domain/gamification';
import { applyAttempt, emptySkillStat } from '../domain/mastery';
import { buildSession, DEFAULT_LENGTHS, type ScoredExercise } from '../domain/recommendation';
import { initialState, review } from '../domain/srs';
import type { AttemptRecord, ProgressState, SessionMode } from '../domain/types';
import { useApp } from './AppContext';

export interface SessionSummary {
  total: number;
  correct: number;
  points: number;
  stars: number;
  durationMs: number;
  bestCombo: number;
  newAchievements: AchievementDef[];
  levelBefore: number;
  levelAfter: number;
  /** Notions ratées, pour l'écran de fin et le rappel au parent. */
  missedSkills: { skill: string; subject: string; topic: string }[];
}

export type SessionPhase = 'loading' | 'playing' | 'feedback' | 'finished' | 'empty';

export interface GameSessionOptions {
  mode: SessionMode;
  subject?: string;
  topic?: string;
  length?: number;
  /** Durée du défi chronométré, en secondes (mode `defi-chrono`). */
  timeLimitSeconds?: number;
}

export interface GameSession {
  phase: SessionPhase;
  queue: ScoredExercise[];
  index: number;
  current: Exercise | null;
  result: GradeResult | null;
  points: number;
  correctCount: number;
  combo: number;
  hintVisible: boolean;
  canSubmit: boolean;
  secondsLeft: number | null;
  summary: SessionSummary | null;
  respond: (response: ExerciseResponse | null, immediate?: boolean) => void;
  submit: () => void;
  next: () => void;
  showHint: () => void;
  quit: () => Promise<void>;
}

export function useGameSession(options: GameSessionOptions): GameSession {
  const { profile, library, topicSettings, progress, unlockedAchievements, refresh } = useApp();

  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [queue, setQueue] = useState<ScoredExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  /** Vrai dès que l'enfant a saisi quelque chose : active le bouton « Vérifier ». */
  const [hasResponse, setHasResponse] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    options.mode === 'defi-chrono' ? (options.timeLimitSeconds ?? 90) : null,
  );

  const pendingResponse = useRef<ExerciseResponse | null>(null);
  const questionStartedAt = useRef<number>(Date.now());
  const sessionIdRef = useRef<number | null>(null);
  const sessionStartedAt = useRef<number>(Date.now());
  const missedRef = useRef<{ skill: string; subject: string; topic: string }[]>([]);
  const finishedRef = useRef(false);

  const current = queue[index]?.exercise ?? null;

  // --- Construction de la file ------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    if (!profile) return;

    (async () => {
      const [states, skillStats] = await Promise.all([
        repo.getExerciseStates(profile.id),
        repo.getSkillStats(profile.id),
      ]);
      if (cancelled) return;

      const built = buildSession({
        mode: options.mode,
        exercises: library.exercises,
        states,
        skillStats,
        topicSettings,
        now: Date.now(),
        length: options.length ?? DEFAULT_LENGTHS[options.mode],
        subject: options.subject,
        topic: options.topic,
      });

      if (built.length === 0) {
        setPhase('empty');
        return;
      }

      const sessionId = await repo.startSession(
        profile.id,
        options.mode,
        options.subject ?? null,
        options.topic ?? null,
      );
      if (cancelled) return;

      sessionIdRef.current = sessionId;
      sessionStartedAt.current = Date.now();
      questionStartedAt.current = Date.now();
      setQueue(built);
      setPhase('playing');
    })();

    return () => {
      cancelled = true;
    };
    // La file est construite une seule fois au montage de l'écran de jeu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // --- Fin de partie ----------------------------------------------------------
  const finish = useCallback(
    async (finalPoints: number, finalCorrect: number, answered: number) => {
      if (!profile || finishedRef.current) return;
      finishedRef.current = true;

      const durationMs = Date.now() - sessionStartedAt.current;
      const total = Math.max(answered, 1);
      const stars = starsForSession(finalCorrect, total);
      const perfect = finalCorrect === total && total >= 5;

      if (sessionIdRef.current !== null) {
        await repo.finishSession(sessionIdRef.current, {
          total: answered,
          correct: finalCorrect,
          points: finalPoints,
          stars,
          durationMs,
        });
      }

      const streak = updateStreak(progress, Date.now());
      const nextProgress: ProgressState = {
        ...progress,
        points: progress.points + finalPoints,
        stars: progress.stars + stars,
        streakDays: streak.streakDays,
        bestStreak: streak.bestStreak,
        lastActiveDay: streak.lastActiveDay,
        totalSessions: progress.totalSessions + 1,
        totalAttempts: progress.totalAttempts + answered,
        totalCorrect: progress.totalCorrect + finalCorrect,
        totalMs: progress.totalMs + durationMs,
        bestCombo: Math.max(progress.bestCombo, bestCombo),
        perfectSessions: progress.perfectSessions + (perfect ? 1 : 0),
      };
      nextProgress.level = levelForPoints(nextProgress.points);

      await repo.saveProgress(profile.id, nextProgress);
      await repo.bumpDailyActivity(profile.id, {
        sessions: 1,
        attempts: answered,
        correct: finalCorrect,
        points: finalPoints,
        ms: durationMs,
      });

      const [subjectCorrect, mastered] = await Promise.all([
        repo.getSubjectCorrectCounts(profile.id),
        repo.countMastered(profile.id),
      ]);

      const metrics: AchievementMetrics = {
        sessions: nextProgress.totalSessions,
        perfectSessions: nextProgress.perfectSessions,
        streakDays: nextProgress.streakDays,
        totalCorrect: nextProgress.totalCorrect,
        level: nextProgress.level,
        points: nextProgress.points,
        bestCombo: nextProgress.bestCombo,
        masteredExercises: mastered,
        subjectCorrect,
      };
      const unlocked = newlyUnlocked(metrics, unlockedAchievements);
      await repo.unlockAchievements(
        profile.id,
        unlocked.map((achievement) => achievement.id),
      );

      setSummary({
        total: answered,
        correct: finalCorrect,
        points: finalPoints,
        stars,
        durationMs,
        bestCombo,
        newAchievements: unlocked,
        levelBefore: progress.level,
        levelAfter: nextProgress.level,
        missedSkills: missedRef.current,
      });
      setPhase('finished');
      await refresh();
    },
    [profile, progress, bestCombo, unlockedAchievements, refresh],
  );

  // --- Chronomètre du défi ----------------------------------------------------
  // Les valeurs courantes passent par des refs : sans cela, l'intervalle serait
  // recréé à chaque réponse et le compte à rebours dériverait.
  const liveRef = useRef({ points, correctCount, answered: 0 });
  liveRef.current = { points, correctCount, answered: index + (phase === 'feedback' ? 1 : 0) };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (options.mode !== 'defi-chrono') return;
    if (phase === 'finished' || phase === 'loading' || phase === 'empty') return;
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value === null) return null;
        if (value <= 1) {
          clearInterval(timer);
          const live = liveRef.current;
          void finishRef.current(live.points, live.correctCount, live.answered);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [options.mode, phase]);

  // --- Réponse et correction --------------------------------------------------
  const respond = useCallback((response: ExerciseResponse | null, immediate = false) => {
    pendingResponse.current = response;
    setHasResponse(response !== null);
    // `submit` est défini plus bas : on passe par une ref pour éviter une dépendance circulaire.
    if (immediate && response) submitRef.current();
  }, []);

  const submit = useCallback(() => {
    if (!profile || !current || phase !== 'playing') return;
    const response = pendingResponse.current ?? { kind: 'skipped' as const };
    const grade = gradeExercise(current, response);
    const responseMs = Date.now() - questionStartedAt.current;

    const breakdown = computePoints({
      correct: grade.correct,
      score: grade.score,
      difficulty: current.difficulty,
      responseMs,
      timeTargetMs: current.timeTargetMs,
      combo,
      usedHint: hintVisible,
    });

    const nextPoints = points + breakdown.total;
    const nextCorrect = correctCount + (grade.correct ? 1 : 0);
    const nextCombo = grade.correct ? combo + 1 : 0;

    setResult(grade);
    setPoints(nextPoints);
    setCorrectCount(nextCorrect);
    setCombo(nextCombo);
    setBestCombo((best) => Math.max(best, nextCombo));
    setPhase('feedback');

    if (!grade.correct) {
      missedRef.current = [
        ...missedRef.current,
        { skill: current.skill, subject: current.subject, topic: current.topic },
      ];
    }

    // Enregistrement local (tentative, mémorisation, statistiques de notion).
    void (async () => {
      const now = Date.now();
      const attempt: AttemptRecord = {
        sessionId: sessionIdRef.current ?? 0,
        exerciseKey: current.key,
        packId: current.packId,
        subject: current.subject,
        topic: current.topic,
        skill: current.skill,
        kind: current.prompt.kind,
        correct: grade.correct,
        score: grade.score,
        responseMs,
        givenAnswer: grade.given,
        expectedAnswer: grade.expected,
        usedHint: hintVisible,
        createdAt: now,
      };
      await repo.recordAttempt(profile.id, attempt);

      const states = await repo.getExerciseStates(profile.id);
      const previous =
        states.get(current.key) ??
        initialState(current.key, current.subject, current.topic, current.skill, now);
      await repo.saveExerciseState(
        profile.id,
        review(previous, {
          correct: grade.correct,
          score: grade.score,
          responseMs,
          timeTargetMs: current.timeTargetMs,
          usedHint: hintVisible,
          now,
        }),
      );

      const stats = await repo.getSkillStats(profile.id);
      const stat =
        stats.get(current.skill) ??
        emptySkillStat(current.skill, current.subject, current.topic);
      await repo.saveSkillStat(profile.id, applyAttempt(stat, attempt));
    })();
  }, [profile, current, phase, combo, hintVisible, points, correctCount]);

  const submitRef = useRef(submit);
  submitRef.current = submit;

  const next = useCallback(() => {
    pendingResponse.current = null;
    setHasResponse(false);
    setResult(null);
    setHintVisible(false);
    if (index + 1 >= queue.length) {
      void finish(points, correctCount, queue.length);
      return;
    }
    setIndex((value) => value + 1);
    questionStartedAt.current = Date.now();
    setPhase('playing');
  }, [index, queue.length, points, correctCount, finish]);

  const quit = useCallback(async () => {
    // Une partie abandonnée compte quand même : les réponses déjà données sont enregistrées.
    if (finishedRef.current || !profile) return;
    await finish(points, correctCount, index);
  }, [finish, points, correctCount, index, profile]);

  const canSubmit = phase === 'playing' && hasResponse;

  return {
    phase,
    queue,
    index,
    current,
    result,
    points,
    correctCount,
    combo,
    hintVisible,
    canSubmit,
    secondsLeft,
    summary,
    respond,
    submit,
    next,
    showHint: () => setHintVisible(true),
    quit,
  };
}
