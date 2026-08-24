import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BigButton,
  Body,
  Card,
  Muted,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  Spacer,
  Title,
} from '../../components/ui';
import { AVATARS, levelProgress, nextReward } from '../../domain/gamification';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, themeColor, typography } from '../../theme';

/** Écran d'accueil de l'enfant : sa progression, puis quatre gros boutons de jeu. */
export function AccueilEnfantScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, progress, dueCount, library } = useApp();

  const level = levelProgress(progress.points);
  const avatar = AVATARS.find((item) => item.id === progress.avatarId) ?? AVATARS[0];
  const reward = nextReward(level.level);
  const color = themeColor(progress.themeId);

  const activeSubjects = library.subjects.length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: `${color}22`, borderColor: color }]}>
          <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
        </View>
        <View style={styles.flex}>
          <Title>Salut {profile?.name ?? 'Arthur'} !</Title>
          <Muted>
            {progress.streakDays > 0
              ? `🔥 ${progress.streakDays} jour${progress.streakDays > 1 ? 's' : ''} d'affilée`
              : 'Prêt pour ta séance du jour ?'}
          </Muted>
        </View>
        <Pressable
          onPress={() => navigation.navigate('VerrouParent')}
          accessibilityRole="button"
          accessibilityLabel="Espace parent, protégé par un NIP"
          style={styles.lock}
        >
          <Text style={styles.lockEmoji}>🔒</Text>
        </Pressable>
      </View>

      <Spacer size={spacing.lg} />

      <Card>
        <Row style={styles.spread}>
          <Text style={styles.levelLabel}>Niveau {level.level}</Text>
          <Text style={styles.points}>{progress.points} pts</Text>
        </Row>
        <Spacer size={spacing.sm} />
        <ProgressBar ratio={level.ratio} color={color} />
        <Spacer size={spacing.sm} />
        <Muted>
          Encore {Math.max(0, level.pointsNeeded - level.pointsInLevel)} points pour le niveau{' '}
          {level.level + 1}
          {reward ? ` · prochaine récompense : ${reward.emoji} ${reward.label} (niveau ${reward.level})` : ''}
        </Muted>
      </Card>

      <SectionTitle>Que veux-tu faire ?</SectionTitle>

      <View style={styles.buttons}>
        <BigButton
          label="Révision du jour"
          subtitle={
            dueCount > 0
              ? `${dueCount} notion${dueCount > 1 ? 's' : ''} à revoir`
              : 'Un mélange choisi pour toi'
          }
          emoji="🎯"
          color={color}
          onPress={() =>
            navigation.navigate('Jeu', {
              mode: 'revision-intelligente',
              title: 'Révision du jour',
            })
          }
        />
        <BigButton
          label="5 minutes chrono"
          subtitle="Une révision courte et rapide"
          emoji="⏱️"
          color={palette.orange}
          onPress={() =>
            navigation.navigate('Jeu', { mode: 'revision-5min', title: '5 minutes chrono' })
          }
        />
        <BigButton
          label="Défi chronométré"
          subtitle="Le plus de bonnes réponses en 90 secondes"
          emoji="⚡"
          color={palette.violet}
          onPress={() =>
            navigation.navigate('Jeu', {
              mode: 'defi-chrono',
              timeLimitSeconds: 90,
              title: 'Défi chronométré',
            })
          }
        />
        <BigButton
          label="Choisir un sujet"
          subtitle={`${activeSubjects} matière${activeSubjects > 1 ? 's' : ''} disponible${activeSubjects > 1 ? 's' : ''}`}
          emoji="📚"
          color={palette.turquoise}
          onPress={() => navigation.navigate('ChoisirSujet')}
        />
      </View>

      <SectionTitle>Mini-jeux</SectionTitle>
      <Row gap={spacing.md}>
        <Card
          style={styles.mini}
          onPress={() => navigation.navigate('Jeu', { mode: 'mini-jeu-math', title: 'Calcul éclair' })}
          accessibilityLabel="Mini-jeu de calcul"
        >
          <Text style={styles.miniEmoji}>🧮</Text>
          <Body>Calcul éclair</Body>
        </Card>
        <Card
          style={styles.mini}
          onPress={() =>
            navigation.navigate('Jeu', { mode: 'mini-jeu-lecture', title: 'Lecture détective' })
          }
          accessibilityLabel="Mini-jeu de lecture"
        >
          <Text style={styles.miniEmoji}>🔎</Text>
          <Body>Lecture détective</Body>
        </Card>
      </Row>

      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 38 },
  lock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.fondDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: { fontSize: 20 },
  spread: { justifyContent: 'space-between' },
  levelLabel: { ...typography.sousTitre, color: palette.texte },
  points: { ...typography.sousTitre, color: palette.orange },
  buttons: { gap: spacing.md },
  mini: { flex: 1, alignItems: 'center', gap: spacing.sm },
  miniEmoji: { fontSize: 34 },
});
