import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Muted,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  Spacer,
  StatTile,
  Title,
} from '../../components/ui';
import { AVATARS, levelProgress, THEMES } from '../../domain/gamification';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, themeColor, typography } from '../../theme';

/** Personnalisation : avatar et thème, débloqués par le niveau. */
export function MoiScreen() {
  const { profile, progress, setProfilePatch } = useApp();
  const level = levelProgress(progress.points);
  const color = themeColor(progress.themeId);
  const minutes = Math.round(progress.totalMs / 60000);
  const successRate =
    progress.totalAttempts === 0
      ? 0
      : Math.round((progress.totalCorrect / progress.totalAttempts) * 100);

  return (
    <Screen>
      <Title>Moi, {profile?.name ?? 'Arthur'}</Title>
      <Muted>Niveau {level.level}</Muted>
      <Spacer size={spacing.sm} />
      <ProgressBar ratio={level.ratio} color={color} />

      <SectionTitle>Mes chiffres</SectionTitle>
      <Row gap={spacing.sm} style={styles.wrap}>
        <StatTile label="points" value={String(progress.points)} emoji="⭐" color={palette.orange} />
        <StatTile
          label="jours d'affilée"
          value={String(progress.streakDays)}
          emoji="🔥"
          color={palette.rouge}
        />
        <StatTile label="parties" value={String(progress.totalSessions)} emoji="🎮" />
        <StatTile
          label="de réussite"
          value={`${successRate} %`}
          emoji="🎯"
          color={palette.succes}
        />
        <StatTile
          label="minutes de travail"
          value={String(minutes)}
          emoji="⏱️"
          color={palette.violet}
        />
        <StatTile
          label="meilleure série"
          value={String(progress.bestStreak)}
          emoji="🏅"
          color={palette.turquoise}
        />
      </Row>

      <SectionTitle>Mon avatar</SectionTitle>
      <View style={styles.grid}>
        {AVATARS.map((avatar) => {
          const unlocked = avatar.unlockLevel <= level.level;
          const selected = progress.avatarId === avatar.id;
          return (
            <Pressable
              key={avatar.id}
              disabled={!unlocked}
              onPress={() => setProfilePatch({ avatarId: avatar.id })}
              accessibilityRole="button"
              accessibilityLabel={
                unlocked ? avatar.label : `${avatar.label}, débloqué au niveau ${avatar.unlockLevel}`
              }
              style={[
                styles.avatar,
                selected && { borderColor: color, borderWidth: 3 },
                !unlocked && styles.locked,
              ]}
            >
              <Text style={styles.avatarEmoji}>{unlocked ? avatar.emoji : '🔒'}</Text>
              <Text style={styles.avatarLabel} numberOfLines={1}>
                {unlocked ? avatar.label : `Niv. ${avatar.unlockLevel}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Mon thème</SectionTitle>
      <View style={styles.grid}>
        {THEMES.map((theme) => {
          const unlocked = theme.unlockLevel <= level.level;
          const selected = progress.themeId === theme.id;
          return (
            <Pressable
              key={theme.id}
              disabled={!unlocked}
              onPress={() => setProfilePatch({ themeId: theme.id })}
              accessibilityRole="button"
              accessibilityLabel={theme.label}
              style={[
                styles.theme,
                { backgroundColor: unlocked ? theme.primary : palette.bordure },
                selected && styles.themeSelected,
              ]}
            >
              <Text style={styles.themeLabel}>{unlocked ? theme.label : `🔒 Niv. ${theme.unlockLevel}`}</Text>
            </Pressable>
          );
        })}
      </View>

      <Spacer size={spacing.xl} />
      <Card>
        <Muted>
          Toutes tes données restent sur cet appareil. Rien n’est envoyé sur Internet.
        </Muted>
      </Card>
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  avatar: {
    width: '22%',
    flexGrow: 1,
    aspectRatio: 0.9,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    backgroundColor: palette.fondCarte,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  avatarEmoji: { fontSize: 30 },
  avatarLabel: { ...typography.minuscule, color: palette.texteDoux },
  locked: { opacity: 0.5 },
  theme: {
    flexGrow: 1,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  themeSelected: { borderWidth: 3, borderColor: palette.texte },
  themeLabel: { ...typography.petit, color: palette.texteInverse },
});
