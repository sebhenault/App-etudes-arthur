import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, typography } from '../../theme';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '⌫'];

/**
 * Calcul rapide avec un pavé numérique intégré : plus rapide et plus sûr que le
 * clavier du système, qui masque la moitié de l'écran sur un téléphone.
 */
export function NumberGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [exercise.key]);

  if (prompt.kind !== 'calcul') return null;

  const push = (key: string) => {
    if (locked) return;
    let next: string;
    if (key === '⌫') next = value.slice(0, -1);
    else if (key === '-') next = value.startsWith('-') ? value.slice(1) : `-${value}`;
    else next = value.length >= 9 ? value : value + key;

    setValue(next);
    const parsed = Number(next);
    onRespond(next.length > 0 && next !== '-' && !Number.isNaN(parsed) ? { kind: 'number', value: parsed } : null);
  };

  return (
    <GameShell instruction={prompt.question}>
      <View
        style={[
          styles.display,
          locked && (result?.correct ? styles.displayCorrect : styles.displayWrong),
        ]}
      >
        <Text style={styles.displayText}>{value || '?'}</Text>
        {prompt.unit ? <Text style={styles.unit}>{prompt.unit}</Text> : null}
      </View>

      <View style={styles.pad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            disabled={locked}
            onPress={() => push(key)}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Effacer' : key}
            style={({ pressed }) => [styles.key, pressed && !locked && styles.pressed]}
          >
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
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
  display: {
    minHeight: 84,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: palette.bleu,
    backgroundColor: palette.fondCarte,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  displayCorrect: { borderColor: palette.succes, backgroundColor: palette.succesDoux },
  displayWrong: { borderColor: palette.erreur, backgroundColor: palette.erreurDoux },
  displayText: { fontSize: 40, fontWeight: '800', color: palette.texte },
  unit: { ...typography.corpsFort, color: palette.texteDoux },

  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  key: {
    width: '31%',
    flexGrow: 1,
    minHeight: 62,
    borderRadius: radius.md,
    backgroundColor: palette.fondCarte,
    borderWidth: 2,
    borderColor: palette.bordure,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.carte,
  },
  keyText: { fontSize: 26, fontWeight: '700', color: palette.texte },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
