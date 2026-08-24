import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, EmptyState, Muted, Row, Screen, SectionTitle, Title } from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

/**
 * Choix libre d'un sujet. Les sujets désactivés par le parent restent visibles
 * mais grisés : l'enfant comprend qu'ils existent, sans pouvoir s'y égarer.
 */
export function ChoisirSujetScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { library, topicSettings } = useApp();
  const [openSubject, setOpenSubject] = useState<string | null>(
    library.subjects[0]?.key ?? null,
  );

  if (library.subjects.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="📭"
          title="Aucun contenu pour l'instant"
          description="Demande à un parent d'activer des sujets dans l'espace parent."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Choisis ton sujet</Title>
      <Muted>Touche une matière, puis le sujet que tu veux travailler.</Muted>

      {library.subjects.map((subject) => {
        const open = openSubject === subject.key;
        return (
          <View key={subject.key}>
            <SectionTitle>
              <Text style={{ color: subject.color }}>
                {subject.emoji} {subject.label}
              </Text>
            </SectionTitle>

            <Card
              onPress={() => setOpenSubject(open ? null : subject.key)}
              accessibilityLabel={`${subject.label}, ${open ? 'replier' : 'déplier'}`}
              style={[styles.subjectCard, { borderColor: subject.color }]}
            >
              <Row style={styles.spread}>
                <Body>
                  {subject.topics.length} sujet{subject.topics.length > 1 ? 's' : ''} ·{' '}
                  {subject.exerciseCount} exercices
                </Body>
                <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
              </Row>
            </Card>

            {open
              ? subject.topics.map((topic) => {
                  const setting = topicSettings.get(`${subject.key}/${topic.key}`);
                  const enabled = setting ? setting.enabled : true;
                  return (
                    <Card
                      key={topic.key}
                      style={[styles.topicCard, !enabled && styles.disabled]}
                      onPress={
                        enabled
                          ? () =>
                              navigation.navigate('Jeu', {
                                mode: 'entrainement',
                                subject: subject.key,
                                topic: topic.key,
                                title: topic.label,
                              })
                          : undefined
                      }
                      accessibilityLabel={`${topic.label}${enabled ? '' : ', désactivé par le parent'}`}
                    >
                      <Row gap={spacing.md}>
                        <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                        <View style={styles.flex}>
                          <Body>{topic.label}</Body>
                          <Muted>
                            {enabled
                              ? `${topic.exerciseCount} exercices`
                              : 'Pas au programme cette semaine'}
                          </Muted>
                        </View>
                        {enabled ? <Text style={styles.play}>▶</Text> : <Text>🔒</Text>}
                      </Row>
                    </Card>
                  );
                })
              : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spread: { justifyContent: 'space-between' },
  subjectCard: { borderWidth: 2, borderRadius: radius.md },
  topicCard: { marginTop: spacing.sm },
  disabled: { opacity: 0.45 },
  topicEmoji: { fontSize: 28 },
  chevron: { ...typography.sousTitre, color: palette.texteDoux },
  play: { fontSize: 20, color: palette.bleu },
});
