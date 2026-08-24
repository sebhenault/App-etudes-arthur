import { StyleSheet, Text, View } from 'react-native';

import {
  BigButton,
  Body,
  Card,
  Muted,
  Row,
  Screen,
  SecondaryButton,
  SectionTitle,
  Spacer,
  Stars,
  Title,
} from '../../components/ui';
import type { SessionSummary } from '../../state/useGameSession';
import { palette, radius, spacing, typography } from '../../theme';

const encouragement = (ratio: number): { emoji: string; text: string } => {
  if (ratio >= 0.9) return { emoji: '🏅', text: 'Excellent ! Tu maîtrises vraiment bien.' };
  if (ratio >= 0.7) return { emoji: '💪', text: 'Beau travail ! Continue comme ça.' };
  if (ratio >= 0.5) return { emoji: '🌱', text: 'Tu progresses. On révise encore un peu ?' };
  return { emoji: '🤝', text: 'C’était difficile. On refait ça ensemble demain !' };
};

/** Bilan de fin de partie : jamais de jugement négatif, toujours une piste concrète. */
export function ResultatView({
  summary,
  onReplay,
  onHome,
}: {
  summary: SessionSummary;
  onReplay: () => void;
  onHome: () => void;
}) {
  const ratio = summary.total === 0 ? 0 : summary.correct / summary.total;
  const message = encouragement(ratio);
  const minutes = Math.max(1, Math.round(summary.durationMs / 60000));

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>{message.emoji}</Text>
        <Title>Partie terminée !</Title>
        <Stars count={summary.stars} size={38} />
        <Body>{message.text}</Body>
      </View>

      <Spacer />

      <Card>
        <Row style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {summary.correct}/{summary.total}
            </Text>
            <Muted>bonnes réponses</Muted>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: palette.orange }]}>+{summary.points}</Text>
            <Muted>points</Muted>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: palette.violet }]}>{minutes} min</Text>
            <Muted>de travail</Muted>
          </View>
        </Row>
        {summary.bestCombo >= 3 ? (
          <>
            <Spacer size={spacing.md} />
            <Muted>🔥 Meilleure série : {summary.bestCombo} bonnes réponses d’affilée</Muted>
          </>
        ) : null}
      </Card>

      {summary.levelAfter > summary.levelBefore ? (
        <>
          <Spacer />
          <Card style={styles.levelUp}>
            <Text style={styles.bigEmoji}>🎉</Text>
            <Title>Niveau {summary.levelAfter} atteint !</Title>
            <Muted>Va voir dans « Moi » si un nouvel avatar t’attend.</Muted>
          </Card>
        </>
      ) : null}

      {summary.newAchievements.length > 0 ? (
        <>
          <SectionTitle>Nouvelles médailles</SectionTitle>
          {summary.newAchievements.map((achievement) => (
            <Card key={achievement.id} style={styles.achievement}>
              <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
              <View style={styles.flex}>
                <Body>{achievement.label}</Body>
                <Muted>{achievement.description}</Muted>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {summary.missedSkills.length > 0 ? (
        <>
          <SectionTitle>À revoir bientôt</SectionTitle>
          <Card>
            <Muted>
              Ces notions reviendront automatiquement dans ta prochaine révision :
            </Muted>
            <Spacer size={spacing.sm} />
            {[...new Set(summary.missedSkills.map((item) => item.skill))].slice(0, 5).map((skill) => (
              <Text key={skill} style={styles.skill}>
                • {skill.replace(/-/g, ' ')}
              </Text>
            ))}
          </Card>
        </>
      ) : null}

      <Spacer />
      <BigButton label="Rejouer" emoji="🔁" onPress={onReplay} />
      <Spacer size={spacing.md} />
      <SecondaryButton label="Retour à l’accueil" onPress={onHome} />
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: spacing.sm },
  bigEmoji: { fontSize: 56 },
  stats: { justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...typography.titre, color: palette.bleu },
  levelUp: { alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF7E3' },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  achievementEmoji: { fontSize: 34 },
  skill: { ...typography.corps, color: palette.texte },
});
