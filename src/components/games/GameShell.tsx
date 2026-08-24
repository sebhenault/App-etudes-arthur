import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../theme';

/** Cadre commun à tous les jeux : consigne en haut, contenu, puis correction. */
export function GameShell({
  instruction,
  children,
  footer,
}: {
  instruction: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{instruction}</Text>
      {children}
      {footer}
    </View>
  );
}

export function Feedback({
  correct,
  expected,
  explanation,
}: {
  correct: boolean;
  expected: string;
  explanation?: string;
}) {
  return (
    <View
      style={[styles.feedback, correct ? styles.feedbackOk : styles.feedbackKo]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.feedbackTitle}>
        {correct ? '🎉 Bravo, c’est exact !' : '💡 Presque !'}
      </Text>
      {!correct ? <Text style={styles.feedbackAnswer}>Réponse : {expected}</Text> : null}
      {explanation ? <Text style={styles.feedbackText}>{explanation}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  instruction: { ...typography.enonce, color: palette.texte },
  feedback: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    gap: spacing.xs,
  },
  feedbackOk: { backgroundColor: palette.succesDoux, borderColor: palette.succes },
  feedbackKo: { backgroundColor: palette.alerteDoux, borderColor: palette.alerte },
  feedbackTitle: { ...typography.sousTitre, color: palette.texte },
  feedbackAnswer: { ...typography.corpsFort, color: palette.texte },
  feedbackText: { ...typography.corps, color: palette.texteDoux, lineHeight: 24 },
});
