import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Muted,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  Spacer,
  Title,
} from '../../components/ui';
import * as repo from '../../db/repositories';
import { achievementProgress, type AchievementMetrics } from '../../domain/gamification';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

const TIER_COLORS: Record<string, string> = {
  bronze: '#C87A3C',
  argent: '#8E9AAF',
  or: '#E1A93B',
};

/** Vitrine des médailles : ce qui est gagné, et ce qui reste à portée. */
export function MedaillesScreen() {
  const { profile, progress, unlockedAchievements } = useApp();
  const [metrics, setMetrics] = useState<AchievementMetrics | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!profile) return;
        const [subjectCorrect, mastered] = await Promise.all([
          repo.getSubjectCorrectCounts(profile.id),
          repo.countMastered(profile.id),
        ]);
        if (cancelled) return;
        setMetrics({
          sessions: progress.totalSessions,
          perfectSessions: progress.perfectSessions,
          streakDays: progress.streakDays,
          totalCorrect: progress.totalCorrect,
          level: progress.level,
          points: progress.points,
          bestCombo: progress.bestCombo,
          masteredExercises: mastered,
          subjectCorrect,
        });
      })();
      return () => {
        cancelled = true;
      };
    }, [profile, progress]),
  );

  const list = metrics ? achievementProgress(metrics, unlockedAchievements) : [];
  const unlocked = list.filter((item) => item.unlocked);
  const locked = list.filter((item) => !item.unlocked);

  return (
    <Screen>
      <Title>Mes médailles</Title>
      <Muted>
        {unlocked.length} médaille{unlocked.length > 1 ? 's' : ''} sur {list.length}
      </Muted>

      <SectionTitle>Gagnées</SectionTitle>
      {unlocked.length === 0 ? (
        <Card>
          <Muted>Aucune médaille pour l’instant. Joue une partie pour commencer !</Muted>
        </Card>
      ) : (
        <View style={styles.grid}>
          {unlocked.map((item) => (
            <View
              key={item.def.id}
              style={[styles.medal, { borderColor: TIER_COLORS[item.def.tier] ?? palette.bleu }]}
            >
              <Text style={styles.medalEmoji}>{item.def.emoji}</Text>
              <Text style={styles.medalLabel} numberOfLines={2}>
                {item.def.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <SectionTitle>À débloquer</SectionTitle>
      {locked.map((item) => (
        <Card key={item.def.id} style={styles.lockedCard}>
          <Row gap={spacing.md}>
            <Text style={styles.lockedEmoji}>{item.def.emoji}</Text>
            <View style={styles.flex}>
              <Text style={styles.lockedTitle}>{item.def.label}</Text>
              <Muted>{item.def.description}</Muted>
              <Spacer size={spacing.sm} />
              <ProgressBar
                ratio={item.ratio}
                height={8}
                color={TIER_COLORS[item.def.tier] ?? palette.bleu}
              />
              <Muted>
                {Math.min(item.value, item.def.target)} / {item.def.target}
              </Muted>
            </View>
          </Row>
        </Card>
      ))}
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  medal: {
    width: '30%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 3,
    backgroundColor: palette.fondCarte,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  medalEmoji: { fontSize: 34 },
  medalLabel: { ...typography.minuscule, color: palette.texte, textAlign: 'center' },
  lockedCard: { marginBottom: spacing.sm, opacity: 0.9 },
  lockedEmoji: { fontSize: 30, opacity: 0.5 },
  lockedTitle: { ...typography.corpsFort, color: palette.texte },
});
