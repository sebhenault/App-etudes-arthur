import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';
import { shuffleWithSeed } from '../../utils/random';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

/**
 * Mise en ordre : l'enfant touche les étiquettes dans le bon ordre ; elles
 * montent une à une dans la bande du haut. Toucher une étiquette placée la
 * renvoie dans la réserve.
 */
export function OrderGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  const [placed, setPlaced] = useState<string[]>([]);

  useEffect(() => {
    setPlaced([]);
  }, [exercise.key]);

  const pool = useMemo(() => {
    if (prompt.kind !== 'ordre') return [];
    return shuffleWithSeed(prompt.sequence, exercise.key);
  }, [exercise.key, prompt]);

  if (prompt.kind !== 'ordre') return null;

  const remaining = pool.filter((item) => !placed.includes(item));

  const update = (next: string[]) => {
    setPlaced(next);
    onRespond(next.length > 0 ? { kind: 'order', value: next } : null);
  };

  return (
    <GameShell instruction={prompt.instruction}>
      <View style={styles.track}>
        {placed.length === 0 ? (
          <Text style={styles.placeholder}>Touche les étiquettes dans le bon ordre.</Text>
        ) : (
          placed.map((item, index) => {
            const rightPlace = prompt.sequence[index] === item;
            return (
              <Pressable
                key={item}
                disabled={locked}
                onPress={() => update(placed.filter((value) => value !== item))}
                accessibilityRole="button"
                accessibilityLabel={`${item}, position ${index + 1}. Toucher pour retirer.`}
                style={[
                  styles.token,
                  styles.tokenPlaced,
                  locked && (rightPlace ? styles.tokenCorrect : styles.tokenWrong),
                ]}
              >
                <View style={styles.rank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.tokenText}>{item}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.pool}>
        {remaining.map((item) => (
          <Pressable
            key={item}
            disabled={locked}
            onPress={() => update([...placed, item])}
            accessibilityRole="button"
            accessibilityLabel={item}
            style={({ pressed }) => [styles.token, pressed && !locked && styles.pressed]}
          >
            <Text style={styles.tokenText}>{item}</Text>
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
  track: {
    minHeight: 90,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.bleu,
    backgroundColor: '#EDF1FF',
    padding: spacing.md,
    gap: spacing.sm,
  },
  placeholder: { ...typography.petit, color: palette.texteDoux },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  token: {
    minHeight: TOUCH_MIN_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    backgroundColor: palette.fondCarte,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.carte,
  },
  tokenPlaced: { borderColor: palette.bleu },
  tokenCorrect: { borderColor: palette.succes, backgroundColor: palette.succesDoux },
  tokenWrong: { borderColor: palette.erreur, backgroundColor: palette.erreurDoux },
  tokenText: { ...typography.corpsFort, color: palette.texte, flexShrink: 1 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.bleu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...typography.petit, color: palette.texteInverse },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
