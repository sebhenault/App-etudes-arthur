import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadow, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';
import { shuffleWithSeed } from '../../utils/random';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

/**
 * Association : on touche un élément à gauche, puis son partenaire à droite.
 * Le « tap-tap » remplace ici le glisser-déposer : il est plus précis pour un
 * enfant et reste accessible aux lecteurs d'écran.
 */
export function MatchGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  const [links, setLinks] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  useEffect(() => {
    setLinks({});
    setSelectedLeft(null);
  }, [exercise.key]);

  const rights = useMemo(() => {
    if (prompt.kind !== 'association') return [];
    return shuffleWithSeed(
      prompt.pairs.map((pair) => pair.right),
      exercise.key,
    );
  }, [exercise.key, prompt]);

  if (prompt.kind !== 'association') return null;

  const usedRights = new Set(Object.values(links));

  const chooseLeft = (left: string) => {
    if (locked) return;
    if (links[left]) {
      // Toucher une paire déjà formée la défait : c'est le geste attendu pour corriger.
      const next = { ...links };
      delete next[left];
      setLinks(next);
      onRespond(Object.keys(next).length > 0 ? { kind: 'pairs', value: next } : null);
      setSelectedLeft(left);
      return;
    }
    setSelectedLeft((current) => (current === left ? null : left));
  };

  const chooseRight = (right: string) => {
    if (locked || !selectedLeft || usedRights.has(right)) return;
    const next = { ...links, [selectedLeft]: right };
    setLinks(next);
    setSelectedLeft(null);
    onRespond({ kind: 'pairs', value: next });
  };

  const rightOfLeft = (left: string) => links[left];
  const isPairCorrect = (left: string) =>
    prompt.pairs.find((pair) => pair.left === left)?.right === links[left];

  return (
    <GameShell instruction={prompt.instruction}>
      <View style={styles.columns}>
        <View style={styles.column}>
          {prompt.pairs.map((pair) => {
            const linked = rightOfLeft(pair.left);
            const selected = selectedLeft === pair.left;
            return (
              <Pressable
                key={pair.left}
                disabled={locked}
                onPress={() => chooseLeft(pair.left)}
                accessibilityRole="button"
                accessibilityLabel={`${pair.left}${linked ? `, associé à ${linked}` : ''}`}
                style={({ pressed }) => [
                  styles.tile,
                  selected && styles.tileSelected,
                  linked && styles.tileLinked,
                  locked && linked && (isPairCorrect(pair.left) ? styles.tileCorrect : styles.tileWrong),
                  pressed && !locked && styles.pressed,
                ]}
              >
                <Text style={styles.tileText}>{pair.left}</Text>
                {linked ? <Text style={styles.linkText}>→ {linked}</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.column}>
          {rights.map((right) => {
            const used = usedRights.has(right);
            return (
              <Pressable
                key={right}
                disabled={locked || used}
                onPress={() => chooseRight(right)}
                accessibilityRole="button"
                accessibilityLabel={right}
                style={({ pressed }) => [
                  styles.tile,
                  styles.tileRight,
                  used && styles.tileUsed,
                  pressed && !locked && !used && styles.pressed,
                ]}
              >
                <Text style={[styles.tileText, used && styles.tileTextUsed]}>{right}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!locked ? (
        <Text style={styles.help}>
          {selectedLeft
            ? `Touche maintenant la bonne réponse pour « ${selectedLeft} ».`
            : 'Touche un élément à gauche, puis son partenaire à droite.'}
        </Text>
      ) : null}

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
  columns: { flexDirection: 'row', gap: spacing.md },
  column: { flex: 1, gap: spacing.sm },
  tile: {
    minHeight: TOUCH_MIN_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    backgroundColor: palette.fondCarte,
    padding: spacing.md,
    justifyContent: 'center',
    ...shadow.carte,
  },
  tileRight: { backgroundColor: palette.fondDoux },
  tileSelected: { borderColor: palette.bleu, borderWidth: 3, backgroundColor: '#E8EDFF' },
  tileLinked: { borderColor: palette.turquoise },
  tileUsed: { opacity: 0.35 },
  tileCorrect: { borderColor: palette.succes, backgroundColor: palette.succesDoux },
  tileWrong: { borderColor: palette.erreur, backgroundColor: palette.erreurDoux },
  tileText: { ...typography.corpsFort, color: palette.texte },
  tileTextUsed: { color: palette.texteDoux },
  linkText: { ...typography.minuscule, color: palette.turquoise, marginTop: 2 },
  pressed: { opacity: 0.8 },
  help: { ...typography.petit, color: palette.texteDoux },
});
