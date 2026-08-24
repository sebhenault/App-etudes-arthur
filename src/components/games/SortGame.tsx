import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { palette, radius, shadow, spacing, TOUCH_MIN_HEIGHT, typography } from '../../theme';
import { shuffleWithSeed } from '../../utils/random';
import { Feedback, GameShell } from './GameShell';
import type { GameComponentProps } from './types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const contains = (rect: Rect, x: number, y: number) =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;

/**
 * Étiquette déplaçable au doigt.
 * Deux gestes possibles, volontairement : glisser (le geste attendu) ou taper
 * puis toucher une colonne (secours quand le doigt dérape ou en accessibilité).
 */
function DraggableToken({
  label,
  disabled,
  selected,
  onTap,
  onDrop,
}: {
  label: string;
  disabled: boolean;
  selected: boolean;
  onTap: () => void;
  onDrop: (x: number, y: number) => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  // Les callbacks sont lus via une ref : le PanResponder n'est créé qu'une fois.
  const handlers = useRef({ onTap, onDrop, disabled });
  handlers.current = { onTap, onDrop, disabled };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !handlers.current.disabled,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          !handlers.current.disabled && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
        onPanResponderGrant: () => setDragging(true),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_event, gesture) => {
          setDragging(false);
          const moved = Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6;
          if (moved) handlers.current.onDrop(gesture.moveX, gesture.moveY);
          else handlers.current.onTap();
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [pan],
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.token,
        selected && styles.tokenSelected,
        dragging && styles.tokenDragging,
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <Text style={styles.tokenText}>{label}</Text>
    </Animated.View>
  );
}

/** Glisser-déposer : classer des étiquettes dans les bonnes colonnes. */
export function SortGame({ exercise, locked, result, onRespond }: GameComponentProps) {
  const prompt = exercise.prompt;
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const bucketRects = useRef<Record<string, Rect>>({});
  const bucketRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    setAssignment({});
    setSelected(null);
  }, [exercise.key]);

  const tokens = useMemo(() => {
    if (prompt.kind !== 'classement') return [];
    return shuffleWithSeed(
      prompt.tokens.map((token) => token.text),
      exercise.key,
    );
  }, [exercise.key, prompt]);

  if (prompt.kind !== 'classement') return null;

  const expectedBucket = (text: string) =>
    prompt.tokens.find((token) => token.text === text)?.bucket;

  const assign = (text: string, bucket: string) => {
    if (locked) return;
    const next = { ...assignment, [text]: bucket };
    setAssignment(next);
    setSelected(null);
    onRespond({ kind: 'buckets', value: next });
  };

  const unassign = (text: string) => {
    if (locked) return;
    const next = { ...assignment };
    delete next[text];
    setAssignment(next);
    onRespond(Object.keys(next).length > 0 ? { kind: 'buckets', value: next } : null);
  };

  const measureBucket = (bucket: string) => (_event: LayoutChangeEvent) => {
    // measureInWindow donne des coordonnées comparables à celles du geste.
    bucketRefs.current[bucket]?.measureInWindow((x, y, width, height) => {
      bucketRects.current[bucket] = { x, y, width, height };
    });
  };

  const dropAt = (text: string) => (x: number, y: number) => {
    const target = prompt.buckets.find((bucket) => {
      const rect = bucketRects.current[bucket];
      return rect ? contains(rect, x, y) : false;
    });
    if (target) assign(text, target);
  };

  const remaining = tokens.filter((text) => assignment[text] === undefined);

  return (
    <GameShell instruction={prompt.instruction}>
      <View style={styles.buckets}>
        {prompt.buckets.map((bucket) => {
          const inside = tokens.filter((text) => assignment[text] === bucket);
          return (
            <Pressable
              key={bucket}
              ref={(node) => {
                bucketRefs.current[bucket] = node;
              }}
              onLayout={measureBucket(bucket)}
              onPress={() => selected && assign(selected, bucket)}
              accessibilityRole="button"
              accessibilityLabel={`Colonne ${bucket}`}
              style={[styles.bucket, selected != null && styles.bucketReady]}
            >
              <Text style={styles.bucketTitle}>{bucket}</Text>
              {inside.map((text) => {
                const ok = expectedBucket(text) === bucket;
                return (
                  <Pressable
                    key={text}
                    disabled={locked}
                    onPress={() => unassign(text)}
                    accessibilityLabel={`${text}, dans ${bucket}. Toucher pour retirer.`}
                    style={[
                      styles.placedToken,
                      locked && (ok ? styles.placedCorrect : styles.placedWrong),
                    ]}
                  >
                    <Text style={styles.placedText}>{text}</Text>
                  </Pressable>
                );
              })}
              {inside.length === 0 ? <Text style={styles.bucketHint}>Dépose ici</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pool}>
        {remaining.map((text) => (
          <DraggableToken
            key={text}
            label={text}
            disabled={locked}
            selected={selected === text}
            onTap={() => setSelected((current) => (current === text ? null : text))}
            onDrop={dropAt(text)}
          />
        ))}
        {remaining.length === 0 ? (
          <Text style={styles.done}>✅ Toutes les étiquettes sont classées.</Text>
        ) : null}
      </View>

      {!locked ? (
        <Text style={styles.help}>
          {selected
            ? `Touche la colonne où placer « ${selected} ».`
            : 'Fais glisser une étiquette vers une colonne (ou touche-la puis touche la colonne).'}
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
  buckets: { flexDirection: 'row', gap: spacing.sm },
  bucket: {
    flex: 1,
    minHeight: 150,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.bordure,
    backgroundColor: palette.fondCarte,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  bucketReady: { borderColor: palette.bleu, backgroundColor: '#EDF1FF' },
  bucketTitle: { ...typography.petit, color: palette.texte, textAlign: 'center' },
  bucketHint: { ...typography.minuscule, color: palette.texteDoux, textAlign: 'center' },

  placedToken: {
    borderRadius: radius.sm,
    backgroundColor: palette.fondDoux,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  placedCorrect: { backgroundColor: palette.succesDoux, borderColor: palette.succes },
  placedWrong: { backgroundColor: palette.erreurDoux, borderColor: palette.erreur },
  placedText: { ...typography.minuscule, color: palette.texte },

  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, minHeight: TOUCH_MIN_HEIGHT },
  token: {
    minHeight: TOUCH_MIN_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bleu,
    backgroundColor: palette.fondCarte,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    ...shadow.bouton,
  },
  tokenSelected: { backgroundColor: '#E8EDFF', borderWidth: 3 },
  tokenDragging: { opacity: 0.9, transform: [{ scale: 1.05 }], zIndex: 10 },
  tokenText: { ...typography.corpsFort, color: palette.texte },
  done: { ...typography.petit, color: palette.succes },
  help: { ...typography.petit, color: palette.texteDoux },
});
