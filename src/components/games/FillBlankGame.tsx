import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { palette, radius, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

/**
 * Mot à compléter. Le trou `___` de l'énoncé est remplacé visuellement par le
 * champ de saisie pour que l'enfant voie la phrase se compléter en écrivant.
 */
export function FillBlankGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [exercise.key]);

  if (prompt.kind !== 'texteATrous') return null;

  const [before, ...rest] = prompt.prompt.split('___');
  const after = rest.join('___');

  return (
    <GameShell instruction="Complète la phrase.">
      <View style={styles.sentence}>
        <Text style={styles.text}>{before}</Text>
        <TextInput
          value={value}
          editable={!locked}
          onChangeText={(next) => {
            setValue(next);
            onRespond(next.trim().length > 0 ? { kind: 'text', value: next } : null);
          }}
          placeholder="…"
          placeholderTextColor={palette.texteDoux}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Mot à écrire"
          style={[
            styles.input,
            locked && (result?.correct ? styles.inputCorrect : styles.inputWrong),
          ]}
        />
        <Text style={styles.text}>{after}</Text>
      </View>

      {exercise.hint && !locked ? <Text style={styles.hint}>💡 {exercise.hint}</Text> : null}

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
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: palette.fondCarte,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: palette.bordure,
    gap: 4,
  },
  text: { ...typography.enonce, color: palette.texte },
  input: {
    minWidth: 140,
    minHeight: TOUCH_MIN_HEIGHT,
    borderBottomWidth: 3,
    borderColor: palette.bleu,
    ...typography.enonce,
    color: palette.bleuFonce,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  inputCorrect: { borderColor: palette.succes, color: palette.succes },
  inputWrong: { borderColor: palette.erreur, color: palette.erreur },
  hint: { ...typography.corps, color: palette.texteDoux },
});
