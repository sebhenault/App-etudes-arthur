import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Body,
  Card,
  Muted,
  Row,
  Screen,
  SecondaryButton,
  SectionTitle,
  Spacer,
  StatTile,
  Title,
} from '../../components/ui';
import * as repo from '../../db/repositories';
import { buildDiagnosis } from '../../domain/mastery';
import {
  buildSession,
  explainNextSession,
  REASON_LABELS,
  type RevisionAdvice,
} from '../../domain/recommendation';
import type { DailyActivity, SessionRecord } from '../../domain/types';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

const MODE_LABELS: Record<string, string> = {
  'revision-intelligente': 'Révision du jour',
  'revision-5min': '5 minutes chrono',
  entrainement: 'Entraînement',
  'defi-chrono': 'Défi chronométré',
  'mini-jeu-math': 'Calcul éclair',
  'mini-jeu-lecture': 'Lecture détective',
};

const formatDay = (day: string): string => {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
};

/** Vue d'ensemble pour le parent : activité, réussite, et ce qui vient ensuite. */
export function TableauBordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, progress, library, topicSettings, dueCount } = useApp();

  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [advice, setAdvice] = useState<RevisionAdvice[]>([]);
  const [struggling, setStruggling] = useState(0);
  const [mastered, setMastered] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!profile) return;
        const [daily, recent, states, stats, masteredCount] = await Promise.all([
          repo.getDailyActivity(profile.id, 14),
          repo.getRecentSessions(profile.id, 5),
          repo.getExerciseStates(profile.id),
          repo.getSkillStats(profile.id),
          repo.countMastered(profile.id),
        ]);
        if (cancelled) return;

        const diagnosis = buildDiagnosis([...stats.values()]);
        const nextSession = buildSession({
          mode: 'revision-intelligente',
          exercises: library.exercises,
          states,
          skillStats: stats,
          topicSettings,
          now: Date.now(),
          length: 12,
        });

        setActivity(daily);
        setSessions(recent);
        setStruggling(diagnosis.difficultes.length);
        setMastered(masteredCount);
        setAdvice(explainNextSession(nextSession).slice(0, 6));
      })();
      return () => {
        cancelled = true;
      };
    }, [profile, library, topicSettings]),
  );

  const successRate =
    progress.totalAttempts === 0
      ? 0
      : Math.round((progress.totalCorrect / progress.totalAttempts) * 100);
  const maxActivity = Math.max(1, ...activity.map((day) => day.attempts));
  const activeTopics = [...topicSettings.values()].filter((setting) => setting.enabled).length;

  return (
    <Screen>
      <Row style={styles.spread}>
        <View style={styles.flex}>
          <Title>Tableau de bord</Title>
          <Muted>Progression de {profile?.name ?? 'Arthur'}</Muted>
        </View>
        <SecondaryButton label="⚙️" onPress={() => navigation.navigate('Reglages')} />
      </Row>

      <SectionTitle>En un coup d'œil</SectionTitle>
      <Row gap={spacing.sm} style={styles.wrap}>
        <StatTile label="de réussite" value={`${successRate} %`} emoji="🎯" color={palette.succes} />
        <StatTile label="exercices faits" value={String(progress.totalAttempts)} emoji="📝" />
        <StatTile
          label="notions à revoir"
          value={String(dueCount)}
          emoji="🔁"
          color={palette.orange}
        />
        <StatTile
          label="notions en difficulté"
          value={String(struggling)}
          emoji="⚠️"
          color={struggling > 0 ? palette.erreur : palette.succes}
        />
        <StatTile label="notions maîtrisées" value={String(mastered)} emoji="✅" color={palette.succes} />
        <StatTile
          label="jours d'affilée"
          value={String(progress.streakDays)}
          emoji="🔥"
          color={palette.rouge}
        />
      </Row>

      <SectionTitle>Activité des 14 derniers jours</SectionTitle>
      <Card>
        {activity.length === 0 ? (
          <Muted>Aucune activité enregistrée pour l'instant.</Muted>
        ) : (
          <View style={styles.chart}>
            {activity.map((day) => (
              <View key={day.day} style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: Math.max(4, (day.attempts / maxActivity) * 90),
                      backgroundColor:
                        day.attempts === 0
                          ? palette.bordure
                          : day.correct / Math.max(1, day.attempts) >= 0.7
                            ? palette.succes
                            : palette.orange,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{formatDay(day.day)}</Text>
              </View>
            ))}
          </View>
        )}
        <Spacer size={spacing.sm} />
        <Muted>Hauteur = nombre d'exercices · vert = plus de 70 % de réussite ce jour-là</Muted>
      </Card>

      <SectionTitle>La prochaine révision travaillera</SectionTitle>
      <Card>
        {advice.length === 0 ? (
          <Muted>
            Active des sujets dans l'onglet « Semaine » pour préparer la prochaine séance.
          </Muted>
        ) : (
          advice.map((item) => (
            <Row key={`${item.skill}-${item.reason}`} style={styles.adviceRow} gap={spacing.sm}>
              <Badge
                label={REASON_LABELS[item.reason]}
                color={
                  item.reason === 'difficulte'
                    ? palette.erreur
                    : item.reason === 'revision-due'
                      ? palette.orange
                      : palette.bleu
                }
              />
              <Body style={styles.flex}>{item.skill.replace(/-/g, ' ')}</Body>
              <Muted>× {item.count}</Muted>
            </Row>
          ))
        )}
        <Spacer size={spacing.sm} />
        <Muted>{activeTopics} sujet(s) actif(s) cette semaine.</Muted>
      </Card>

      <SectionTitle>Dernières parties</SectionTitle>
      {sessions.length === 0 ? (
        <Card>
          <Muted>Aucune partie terminée pour l'instant.</Muted>
        </Card>
      ) : (
        sessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <Row style={styles.spread}>
              <View style={styles.flex}>
                <Body>{MODE_LABELS[session.mode] ?? session.mode}</Body>
                <Muted>
                  {new Date(session.startedAt).toLocaleDateString('fr-CA')} ·{' '}
                  {Math.round(session.durationMs / 60000)} min
                </Muted>
              </View>
              <View style={styles.sessionScore}>
                <Text style={styles.sessionValue}>
                  {session.correct}/{session.total}
                </Text>
                <Muted>{'⭐'.repeat(session.stars) || '—'}</Muted>
              </View>
            </Row>
          </Card>
        ))
      )}
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spread: { justifyContent: 'space-between' },
  wrap: { flexWrap: 'wrap' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120 },
  bar: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: radius.sm },
  barLabel: { ...typography.minuscule, color: palette.texteDoux, fontSize: 9 },
  adviceRow: { marginBottom: spacing.sm },
  sessionCard: { marginBottom: spacing.sm },
  sessionScore: { alignItems: 'flex-end' },
  sessionValue: { ...typography.corpsFort, color: palette.texte },
});
