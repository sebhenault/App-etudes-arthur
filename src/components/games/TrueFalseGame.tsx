import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '../../theme';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

/** Vrai ou faux — deux grandes cibles, corrigé au tap. */
export function TrueFalseGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  if (prompt.kind !== 'vraiFaux') return null;

  const chosen = result ? result.given === 'Vrai' : null;

  const renderButton = (value: boolean, label: string, emoji: string, color: string) => {
    const isAnswer = value === prompt.answer;
    const isChosen = chosen === value;
    return (
      <Pressable
        disabled={locked}
        onPress={() => onRespond({ kind: 'boolean', value }, true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.button,
          { borderColor: color },
          locked && isAnswer && styles.correct,
          locked && isChosen && !isAnswer && styles.wrong,
          pressed && !locked && styles.pressed,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <GameShell instruction={prompt.statement}>
      <View style={styles.row}>
        {renderButton(true, 'Vrai', '👍', palette.succes)}
        {renderButton(false, 'Faux', '👎', palette.erreur)}
      </View>
      {result ? (
        <Feedback
          correct={result.correct}
          expected={result.expected}
          explanation={exercise.explanation}
        />
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg },
  button: {
    flex: 1,
    minHeight: 130,
    borderRadius: radius.xl,
    borderWidth: 3,
    backgroundColor: palette.fondCarte,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.carte,
  },
  correct: { backgroundColor: palette.succesDoux },
  wrong: { backgroundColor: palette.erreurDoux },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  emoji: { fontSize: 44 },
  label: { ...typography.titre },
});
