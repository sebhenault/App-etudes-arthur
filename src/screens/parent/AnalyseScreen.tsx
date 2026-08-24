import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Body,
  Card,
  EmptyState,
  Muted,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  Spacer,
  Title,
} from '../../components/ui';
import { exerciseTitle } from '../../content/exercises';
import * as repo from '../../db/repositories';
import {
  buildDiagnosis,
  frequentErrors,
  summarizeByTopic,
  type DiagnosisReport,
  type FrequentError,
  type TopicSummary,
} from '../../domain/mastery';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

const DAYS_ANALYZED = 45;

const readableSkill = (skill: string) => skill.replace(/-/g, ' ');

/**
 * Analyse détaillée : forces, difficultés, erreurs récurrentes.
 * Chaque bloc répond à une question concrète que se pose le parent.
 */
export function AnalyseScreen() {
  const { profile, library } = useApp();
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [errors, setErrors] = useState<FrequentError[]>([]);
  const [topics, setTopics] = useState<TopicSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!profile) return;
        const since = Date.now() - DAYS_ANALYZED * 86400000;
        const [stats, states, attempts] = await Promise.all([
          repo.getSkillStats(profile.id),
          repo.getExerciseStates(profile.id),
          repo.getAttemptsSince(profile.id, since),
        ]);
        if (cancelled) return;
        const statList = [...stats.values()];
        setReport(buildDiagnosis(statList));
        setErrors(frequentErrors(attempts).slice(0, 8));
        setTopics(summarizeByTopic(statList, [...states.values()]));
      })();
      return () => {
        cancelled = true;
      };
    }, [profile]),
  );

  const labelForTopic = (subjectKey: string, topicKey: string) => {
    const subject = library.subjectByKey.get(subjectKey);
    const topic = subject?.topics.find((item) => item.key === topicKey);
    return {
      subject: subject?.label ?? subjectKey,
      topic: topic?.label ?? topicKey,
      color: subject?.color ?? palette.bleu,
      emoji: topic?.emoji ?? '📘',
    };
  };

  if (!report) return <Screen />;

  const hasData = report.forces.length + report.difficultes.length + report.enCours.length > 0;

  if (!hasData) {
    return (
      <Screen>
        <Title>Analyse</Title>
        <Spacer />
        <EmptyState
          emoji="📊"
          title="Pas encore assez de données"
          description="Après quelques parties, tu verras ici les forces d'Arthur, ses difficultés et ses erreurs récurrentes."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Analyse</Title>
      <Muted>Basée sur les {DAYS_ANALYZED} derniers jours d'activité.</Muted>

      <SectionTitle>⚠️ Difficultés à travailler</SectionTitle>
      {report.difficultes.length === 0 ? (
        <Card>
          <Muted>Aucune difficulté marquée en ce moment. Beau travail !</Muted>
        </Card>
      ) : (
        report.difficultes.slice(0, 8).map((item) => {
          const info = labelForTopic(item.subject, item.topic);
          return (
            <Card key={item.skill} style={styles.itemCard}>
              <Row style={styles.spread}>
                <View style={styles.flex}>
                  <Body>{readableSkill(item.skill)}</Body>
                  <Muted>
                    {info.subject} · {info.topic}
                  </Muted>
                </View>
                <Badge label={`${Math.round(item.recentScore * 100)} %`} color={palette.erreur} />
              </Row>
              <Spacer size={spacing.sm} />
              <ProgressBar ratio={item.recentScore} color={palette.erreur} height={8} />
              <Spacer size={spacing.xs} />
              <Muted>
                {item.correct}/{item.attempts} réussites · {Math.round(item.avgMs / 1000)} s en moyenne
                {item.failStreak >= 2 ? ` · ${item.failStreak} échecs d'affilée` : ''}
              </Muted>
            </Card>
          );
        })
      )}

      {report.aConsolider.length > 0 ? (
        <>
          <SectionTitle>🐢 Réussi, mais lentement</SectionTitle>
          <Card>
            <Muted>
              Ces notions sont comprises mais pas encore automatiques. Un défi chronométré aide à
              les ancrer.
            </Muted>
            <Spacer size={spacing.sm} />
            {report.aConsolider.slice(0, 5).map((item) => (
              <Row key={item.skill} style={styles.spread}>
                <Body style={styles.flex}>{readableSkill(item.skill)}</Body>
                <Muted>{Math.round(item.avgMs / 1000)} s</Muted>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>💪 Forces</SectionTitle>
      {report.forces.length === 0 ? (
        <Card>
          <Muted>Les forces apparaîtront après quelques réussites répétées.</Muted>
        </Card>
      ) : (
        <Card>
          <View style={styles.chips}>
            {report.forces.slice(0, 12).map((item) => (
              <View key={item.skill} style={styles.forceChip}>
                <Text style={styles.forceText}>{readableSkill(item.skill)}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <SectionTitle>🔁 Erreurs qui reviennent</SectionTitle>
      {errors.length === 0 ? (
        <Card>
          <Muted>Aucune erreur répétée détectée.</Muted>
        </Card>
      ) : (
        errors.map((error) => {
          const exercise = library.exerciseByKey.get(error.exerciseKey);
          const info = labelForTopic(error.subject, error.topic);
          return (
            <Card key={error.exerciseKey} style={styles.itemCard}>
              <Body numberOfLines={3}>
                {exercise ? exerciseTitle(exercise) : readableSkill(error.skill)}
              </Body>
              <Spacer size={spacing.xs} />
              <Muted>
                {info.subject} · {info.topic} — {error.errorCount} erreur(s) sur {error.totalCount}{' '}
                essai(s)
              </Muted>
              {error.topWrongAnswer ? (
                <>
                  <Spacer size={spacing.xs} />
                  <Text style={styles.wrongAnswer}>
                    Réponse donnée le plus souvent : « {error.topWrongAnswer} »
                  </Text>
                </>
              ) : null}
            </Card>
          );
        })
      )}

      <SectionTitle>📚 Vue par sujet</SectionTitle>
      {topics.map((summary) => {
        const info = labelForTopic(summary.subject, summary.topic);
        return (
          <Card key={`${summary.subject}/${summary.topic}`} style={styles.itemCard}>
            <Row style={styles.spread}>
              <Body style={styles.flex}>
                {info.emoji} {info.topic}
              </Body>
              <Badge
                label={`${Math.round(summary.successRate * 100)} %`}
                color={
                  summary.successRate >= 0.8
                    ? palette.succes
                    : summary.successRate >= 0.6
                      ? palette.orange
                      : palette.erreur
                }
              />
            </Row>
            <Spacer size={spacing.sm} />
            <ProgressBar
              ratio={summary.successRate}
              height={8}
              color={info.color}
            />
            <Spacer size={spacing.xs} />
            <Muted>
              {summary.attempts} exercices · {summary.mastered} notion(s) maîtrisée(s) ·{' '}
              {summary.struggling} en difficulté
            </Muted>
          </Card>
        );
      })}
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spread: { justifyContent: 'space-between' },
  itemCard: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  forceChip: {
    backgroundColor: palette.succesDoux,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: palette.succes,
  },
  forceText: { ...typography.minuscule, color: palette.succes },
  wrongAnswer: { ...typography.petit, color: palette.erreur },
});
