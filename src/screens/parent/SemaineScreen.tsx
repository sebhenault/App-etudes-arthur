import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Body,
  Card,
  Chip,
  Muted,
  Row,
  Screen,
  SecondaryButton,
  SectionTitle,
  Spacer,
  Title,
  ToggleRow,
} from '../../components/ui';
import * as repo from '../../db/repositories';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

const WEIGHT_LABELS: Record<number, string> = {
  1: 'Normal',
  2: 'À travailler',
  3: 'Prioritaire',
};

/**
 * Cœur de l'usage hebdomadaire : le parent coche ce qui a été vu en classe.
 * Seuls les sujets activés alimentent les révisions de la semaine.
 */
export function SemaineScreen() {
  const { profile, library, topicSettings, refresh } = useApp();
  const [weekLabel, setWeekLabel] = useState('');
  const [saving, setSaving] = useState(false);

  if (!profile) return <Screen />;

  const currentLabel =
    [...topicSettings.values()].find((setting) => setting.weekLabel)?.weekLabel ?? null;

  const toggleTopic = async (key: string, enabled: boolean) => {
    await repo.setTopicEnabled(profile.id, key, enabled);
    await refresh();
  };

  const changeWeight = async (key: string, weight: number) => {
    await repo.setTopicWeight(profile.id, key, weight);
    await refresh();
  };

  const toggleSubject = async (subject: string, enabled: boolean) => {
    await repo.setSubjectEnabled(profile.id, subject, enabled);
    await refresh();
  };

  const startNewWeek = () => {
    Alert.alert(
      'Nouvelle semaine',
      'Tous les sujets vont être désactivés. Tu pourras ensuite cocher ceux vus en classe cette semaine.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout désactiver',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            await repo.applyWeekPlan(profile.id, [], weekLabel.trim() || null);
            await refresh();
            setSaving(false);
          },
        },
      ],
    );
  };

  const activeCount = [...topicSettings.values()].filter((setting) => setting.enabled).length;

  return (
    <Screen>
      <Title>Le plan de la semaine</Title>
      <Muted>
        Coche uniquement les sujets travaillés en classe. Les révisions d'Arthur porteront sur
        ceux-là.
      </Muted>

      <Spacer />

      <Card>
        <Body>Semaine en cours</Body>
        <Spacer size={spacing.sm} />
        <TextInput
          value={weekLabel}
          onChangeText={setWeekLabel}
          placeholder={currentLabel ?? 'Ex. : Semaine du 8 septembre'}
          placeholderTextColor={palette.texteDoux}
          style={styles.input}
          accessibilityLabel="Nom de la semaine"
        />
        <Spacer size={spacing.md} />
        <Row gap={spacing.sm}>
          <SecondaryButton
            label="Tout désactiver"
            onPress={startNewWeek}
            color={palette.orange}
            disabled={saving}
            style={styles.flex}
          />
        </Row>
        <Spacer size={spacing.sm} />
        <Muted>{activeCount} sujet(s) actif(s)</Muted>
      </Card>

      {library.subjects.map((subject) => {
        const topics = subject.topics.map((topic) => ({
          topic,
          key: `${subject.key}/${topic.key}`,
          setting: topicSettings.get(`${subject.key}/${topic.key}`),
        }));
        const allOn = topics.every((entry) => entry.setting?.enabled);

        return (
          <View key={subject.key}>
            <SectionTitle
              right={
                <SecondaryButton
                  label={allOn ? 'Tout retirer' : 'Tout activer'}
                  onPress={() => toggleSubject(subject.key, !allOn)}
                  color={subject.color}
                  style={styles.smallButton}
                />
              }
            >
              <Text style={{ color: subject.color }}>
                {subject.emoji} {subject.label}
              </Text>
            </SectionTitle>

            <Card>
              {topics.map((entry, index) => {
                const enabled = entry.setting?.enabled ?? true;
                const weight = entry.setting?.weight ?? 1;
                return (
                  <View
                    key={entry.key}
                    style={[styles.topicRow, index > 0 && styles.topicSeparator]}
                  >
                    <ToggleRow
                      label={`${entry.topic.emoji ?? ''} ${entry.topic.label}`.trim()}
                      description={`${entry.topic.exerciseCount} exercices · ${entry.topic.packs.length} pack(s)`}
                      value={enabled}
                      onValueChange={(next) => toggleTopic(entry.key, next)}
                      color={subject.color}
                    />
                    {enabled ? (
                      <Row gap={spacing.sm} style={styles.weights}>
                        <Muted>Priorité :</Muted>
                        {[1, 2, 3].map((value) => (
                          <Chip
                            key={value}
                            label={WEIGHT_LABELS[value]}
                            active={weight === value}
                            color={subject.color}
                            onPress={() => changeWeight(entry.key, value)}
                          />
                        ))}
                      </Row>
                    ) : null}
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}

      <Spacer size={spacing.xl} />
      <Card>
        <Muted>
          Astuce : mets « Prioritaire » sur la notion de l'évaluation à venir. Elle sortira trois
          fois plus souvent dans les révisions.
        </Muted>
      </Card>
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    paddingHorizontal: spacing.md,
    ...typography.corps,
    color: palette.texte,
  },
  smallButton: { minHeight: 40, paddingHorizontal: spacing.md },
  topicRow: { paddingVertical: spacing.sm },
  topicSeparator: { borderTopWidth: 1, borderTopColor: palette.bordure },
  weights: { flexWrap: 'wrap', marginTop: spacing.xs },
});
