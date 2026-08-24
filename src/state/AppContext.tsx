/**
 * État global de l'application : profil, bibliothèque de contenu, réglages
 * parent et progression. Un seul contexte suffit : les données sont petites et
 * toujours utilisées ensemble.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { buildLibrary, type ContentLibrary } from '../content/library';
import type { LoadedPack } from '../content/types';
import * as repo from '../db/repositories';
import { levelForPoints } from '../domain/gamification';
import type { ProgressState, TopicSetting } from '../domain/types';

export interface AppState {
  ready: boolean;
  error: string | null;
  profile: repo.Profile | null;
  library: ContentLibrary;
  importedPacks: LoadedPack[];
  topicSettings: Map<string, TopicSetting>;
  progress: ProgressState;
  unlockedAchievements: Set<string>;
  dueCount: number;
  /** Recharge tout depuis la base (après une partie ou un changement parent). */
  refresh: () => Promise<void>;
  /** Recharge uniquement la bibliothèque (après import ou suppression d'un pack). */
  reloadLibrary: () => Promise<void>;
  setProfilePatch: (patch: Partial<repo.Profile>) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const INITIAL_PROGRESS: ProgressState = {
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<repo.Profile | null>(null);
  const [importedPacks, setImportedPacks] = useState<LoadedPack[]>([]);
  const [library, setLibrary] = useState<ContentLibrary>(() => buildLibrary([]));
  const [topicSettings, setTopicSettings] = useState<Map<string, TopicSetting>>(new Map());
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [dueCount, setDueCount] = useState(0);

  /**
   * Crée les réglages manquants pour tous les sujets de la bibliothèque.
   * C'est ce qui rend la plateforme extensible : un pack déposé dans `content/`
   * ou importé par le parent apparaît automatiquement dans le tableau de bord.
   */
  const syncTopicSettings = useCallback(
    async (profileId: number, contentLibrary: ContentLibrary) => {
      const entries = contentLibrary.subjects.flatMap((subject) =>
        subject.topics.map((topic) => ({
          key: `${subject.key}/${topic.key}`,
          subject: subject.key,
          topic: topic.key,
          // Un sujet est actif par défaut si au moins un de ses packs le demande.
          defaultEnabled: topic.packs.some((pack) => pack.defaultEnabled !== false),
        })),
      );
      await repo.seedTopicSettings(profileId, entries);
      setTopicSettings(await repo.getTopicSettings(profileId));
    },
    [],
  );

  const load = useCallback(async () => {
    const loadedProfile = await repo.ensureProfile('Arthur');
    const packs = await repo.listImportedPacks();
    const contentLibrary = buildLibrary(packs);

    await syncTopicSettings(loadedProfile.id, contentLibrary);

    const [loadedProgress, achievements, due] = await Promise.all([
      repo.getProgress(loadedProfile.id),
      repo.getAchievements(loadedProfile.id),
      repo.countDue(loadedProfile.id, Date.now()),
    ]);

    setProfile(loadedProfile);
    setImportedPacks(packs);
    setLibrary(contentLibrary);
    setProgress({ ...loadedProgress, level: levelForPoints(loadedProgress.points) });
    setUnlockedAchievements(new Set(achievements.map((a) => a.achievementId)));
    setDueCount(due);
  }, [syncTopicSettings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    try {
      await load();
      setError(null);
    } catch (refreshError) {
      setError((refreshError as Error).message);
    }
  }, [load]);

  const reloadLibrary = useCallback(async () => {
    if (!profile) return;
    const packs = await repo.listImportedPacks();
    const contentLibrary = buildLibrary(packs);
    setImportedPacks(packs);
    setLibrary(contentLibrary);
    await syncTopicSettings(profile.id, contentLibrary);
  }, [profile, syncTopicSettings]);

  const setProfilePatch = useCallback(
    async (patch: Partial<repo.Profile>) => {
      if (!profile) return;
      await repo.updateProfile(profile.id, patch);
      setProfile({ ...profile, ...patch });
      if (patch.avatarId || patch.themeId) {
        setProgress((current) => ({
          ...current,
          avatarId: patch.avatarId ?? current.avatarId,
          themeId: patch.themeId ?? current.themeId,
        }));
      }
    },
    [profile],
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      error,
      profile,
      library,
      importedPacks,
      topicSettings,
      progress,
      unlockedAchievements,
      dueCount,
      refresh,
      reloadLibrary,
      setProfilePatch,
    }),
    [
      ready,
      error,
      profile,
      library,
      importedPacks,
      topicSettings,
      progress,
      unlockedAchievements,
      dueCount,
      refresh,
      reloadLibrary,
      setProfilePatch,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp doit être utilisé à l’intérieur de <AppProvider>.');
  return context;
}

/** Raccourci pratique : l'identifiant du profil courant (0 tant que rien n'est chargé). */
export const useProfileId = (): number => useApp().profile?.id ?? 0;
