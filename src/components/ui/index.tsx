/**
 * Petite bibliothèque de composants réutilisables.
 * Un seul fichier : ces composants sont courts et toujours utilisés ensemble.
 */

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, shadow, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export function Screen({
  children,
  scroll = true,
  background = palette.fond,
  contentStyle,
}: {
  children?: ReactNode;
  scroll?: boolean;
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: background }]} edges={['top', 'left', 'right']}>
      {inner}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Row({
  children,
  style,
  gap = spacing.sm,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

export function Spacer({ size = spacing.lg }: { size?: number }) {
  return <View style={{ height: size }} />;
}

// ---------------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------------

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

export const Title = ({ children, style }: TextProps) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

export const Subtitle = ({ children, style }: TextProps) => (
  <Text style={[styles.subtitle, style]}>{children}</Text>
);

export const Body = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);

export const Muted = ({ children, style, numberOfLines }: TextProps) => (
  <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// Boutons
// ---------------------------------------------------------------------------

export function BigButton({
  label,
  emoji,
  onPress,
  color = palette.bleu,
  disabled = false,
  subtitle,
  style,
}: {
  label: string;
  emoji?: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: disabled ? palette.bordure : color },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {emoji ? <Text style={styles.bigButtonEmoji}>{emoji}</Text> : null}
      <View style={styles.flex}>
        <Text style={styles.bigButtonLabel}>{label}</Text>
        {subtitle ? <Text style={styles.bigButtonSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  color = palette.bleu,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.secondaryButton,
        { borderColor: disabled ? palette.bordure : color },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.secondaryLabel, { color: disabled ? palette.texteDoux : color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  color = palette.bleu,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const content = (
    <View
      style={[
        styles.chip,
        active ? { backgroundColor: color, borderColor: color } : { borderColor: palette.bordure },
      ]}
    >
      <Text style={[styles.chipLabel, active && { color: palette.texteInverse }]}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Indicateurs
// ---------------------------------------------------------------------------

export function ProgressBar({
  ratio,
  color = palette.bleu,
  height = 14,
}: {
  ratio: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: color,
          height: '100%',
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function Stars({ count, size = 28 }: { count: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${count} étoile${count > 1 ? 's' : ''} sur 3`}>
      {[0, 1, 2].map((index) => (
        <Text key={index} style={{ fontSize: size, opacity: index < count ? 1 : 0.25 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

export function StatTile({
  label,
  value,
  emoji,
  color = palette.bleu,
}: {
  label: string;
  value: string;
  emoji?: string;
  color?: string;
}) {
  return (
    <View style={[styles.statTile, { borderColor: color }]}>
      {emoji ? <Text style={styles.statEmoji}>{emoji}</Text> : null}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function Badge({ label, color = palette.bleu }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  color = palette.bleu,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  color?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.flex}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.muted}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: color, false: palette.bordure }}
        thumbColor={palette.fondCarte}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.subtitle}>{title}</Text>
      {description ? <Text style={[styles.muted, styles.center]}>{description}</Text> : null}
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={palette.bleu} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },

  card: {
    backgroundColor: palette.fondCarte,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.carte,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: { ...typography.sousTitre, color: palette.texte },

  title: { ...typography.titre, color: palette.texte },
  subtitle: { ...typography.sousTitre, color: palette.texte },
  body: { ...typography.corps, color: palette.texte },
  muted: { ...typography.petit, color: palette.texteDoux },

  bigButton: {
    minHeight: 72,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.bouton,
  },
  bigButtonEmoji: { fontSize: 32 },
  bigButtonLabel: { ...typography.sousTitre, color: palette.texteInverse },
  bigButtonSubtitle: { ...typography.petit, color: '#FFFFFFCC', marginTop: 2 },

  secondaryButton: {
    minHeight: TOUCH_MIN_HEIGHT,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.fondCarte,
  },
  secondaryLabel: { ...typography.corpsFort },

  chip: {
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.fondCarte,
  },
  chipLabel: { ...typography.petit, color: palette.texte },

  progressTrack: { backgroundColor: palette.fondDoux, overflow: 'hidden', width: '100%' },

  statTile: {
    flexGrow: 1,
    flexBasis: '30%',
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.fondCarte,
    gap: 2,
  },
  statEmoji: { fontSize: 22 },
  statValue: { ...typography.titre },
  statLabel: { ...typography.minuscule, color: palette.texteDoux, textAlign: 'center' },

  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeLabel: { ...typography.minuscule },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: TOUCH_MIN_HEIGHT,
    paddingVertical: spacing.sm,
  },
  toggleLabel: { ...typography.corpsFort, color: palette.texte },

  emptyState: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
