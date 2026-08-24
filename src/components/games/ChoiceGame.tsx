import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Choix multiples — utilisé pour les items `qcm` et pour chaque question de lecture.
 * La réponse est corrigée dès le tap : à cet âge, un bouton « Valider » en plus
 * casse le rythme sans rien apporter.
 */
export function ChoiceGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  if (prompt.kind !== 'qcm' && prompt.kind !== 'lecture') return null;

  // La réponse donnée est stockée sous forme de texte : on retrouve l'index choisi.
  const chosenIndex = result ? prompt.choices.findIndex((choice) => choice === result.given) : -1;

  return (
    <GameShell instruction={prompt.question}>
      {prompt.kind === 'lecture' ? (
        <View style={styles.passage}>
          <Text style={styles.passageTitle}>{prompt.passage.title}</Text>
          <ScrollView style={styles.passageScroll} nestedScrollEnabled>
            <Text style={styles.passageText}>{prompt.passage.text}</Text>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.choices}>
        {prompt.choices.map((choice, index) => {
          const isAnswer = index === prompt.answer;
          const isChosen = index === chosenIndex;
          const state = !locked
            ? 'idle'
            : isAnswer
              ? 'correct'
              : isChosen
                ? 'wrong'
                : 'idle';
          return (
            <Pressable
              key={`${choice}-${index}`}
              disabled={locked}
              onPress={() => onRespond({ kind: 'choice', index }, true)}
              accessibilityRole="button"
              accessibilityLabel={`Réponse ${LETTERS[index]} : ${choice}`}
              style={({ pressed }) => [
                styles.choice,
                state === 'correct' && styles.choiceCorrect,
                state === 'wrong' && styles.choiceWrong,
                pressed && !locked && styles.pressed,
              ]}
            >
              <View style={[styles.letter, state === 'correct' && styles.letterCorrect, state === 'wrong' && styles.letterWrong]}>
                <Text style={styles.letterText}>{LETTERS[index] ?? index + 1}</Text>
              </View>
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}
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
  passage: {
    backgroundColor: palette.fondCarte,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: palette.bordure,
    gap: spacing.sm,
  },
  passageTitle: { ...typography.corpsFort, color: palette.texte },
  passageScroll: { maxHeight: 220 },
  passageText: { ...typography.lecture, color: palette.texte },

  choices: { gap: spacing.md },
  choice: {
    minHeight: TOUCH_MIN_HEIGHT + 8,
    borderRadius: radius.lg,
    backgroundColor: palette.fondCarte,
    borderWidth: 2,
    borderColor: palette.bordure,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.carte,
  },
  choiceCorrect: { borderColor: palette.succes, backgroundColor: palette.succesDoux },
  choiceWrong: { borderColor: palette.erreur, backgroundColor: palette.erreurDoux },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },

  letter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.fondDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCorrect: { backgroundColor: palette.succes },
  letterWrong: { backgroundColor: palette.erreur },
  letterText: { ...typography.corpsFort, color: palette.texte },
  choiceText: { ...typography.corps, color: palette.texte, flex: 1 },
});
