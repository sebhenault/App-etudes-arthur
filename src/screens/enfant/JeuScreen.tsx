import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameRenderer, isInstantKind } from '../../components/games';
import {
  BigButton,
  EmptyState,
  Loading,
  ProgressBar,
  SecondaryButton,
  Spacer,
} from '../../components/ui';
import { KIND_LABELS } from '../../content/exercises';
import type { RootScreenProps, RootStackParamList } from '../../navigation/types';
import { useGameSession } from '../../state/useGameSession';
import { palette, radius, spacing, typography } from '../../theme';
import { ResultatView } from './ResultatView';

/** Écran de jeu : en-tête de progression, exercice courant, barre d'action. */
export function JeuScreen({ route }: RootScreenProps<'Jeu'>) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mode, subject, topic, length, timeLimitSeconds, title } = route.params;

  const session = useGameSession({ mode, subject, topic, length, timeLimitSeconds });

  const goHome = () => navigation.navigate('Enfant');

  const confirmQuit = () => {
    if (session.phase === 'finished' || session.phase === 'empty') {
      goHome();
      return;
    }
    Alert.alert('Quitter la partie ?', 'Tes réponses déjà données seront enregistrées.', [
      { text: 'Continuer à jouer', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          await session.quit();
          goHome();
        },
      },
    ]);
  };

  if (session.phase === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <Loading label="Je prépare tes exercices…" />
      </SafeAreaView>
    );
  }

  if (session.phase === 'empty') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyWrapper}>
          <EmptyState
            emoji="🧐"
            title="Aucun exercice disponible"
            description="Ce mode n'a rien à proposer pour l'instant. Un parent peut activer d'autres sujets dans l'espace parent."
          />
          <SecondaryButton label="Retour" onPress={goHome} />
        </View>
      </SafeAreaView>
    );
  }

  if (session.phase === 'finished' && session.summary) {
    return (
      <ResultatView
        summary={session.summary}
        onReplay={() => navigation.replace('Jeu', route.params)}
        onHome={goHome}
      />
    );
  }

  const exercise = session.current;
  if (!exercise) return null;

  const total = session.queue.length;
  const instant = isInstantKind(exercise.prompt.kind);
  const showVerify = session.phase === 'playing' && !instant;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={confirmQuit}
          accessibilityRole="button"
          accessibilityLabel="Quitter la partie"
          style={styles.close}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title ?? 'Partie en cours'}
          </Text>
          <Text style={styles.headerMeta}>
            {session.index + 1} / {total} · {KIND_LABELS[exercise.prompt.kind]}
          </Text>
        </View>
        <View style={styles.score}>
          {session.secondsLeft !== null ? (
            <Text
              style={[styles.timer, session.secondsLeft <= 10 && styles.timerUrgent]}
              accessibilityLabel={`${session.secondsLeft} secondes restantes`}
            >
              ⏱ {session.secondsLeft}s
            </Text>
          ) : null}
          <Text style={styles.points}>{session.points} pts</Text>
          {session.combo >= 3 ? <Text style={styles.combo}>🔥 x{session.combo}</Text> : null}
        </View>
      </View>

      <ProgressBar ratio={total === 0 ? 0 : session.index / total} height={8} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GameRenderer
          exercise={exercise}
          locked={session.phase === 'feedback'}
          result={session.result}
          onRespond={session.respond}
        />

        {session.hintVisible && exercise.hint ? (
          <View style={styles.hint}>
            <Text style={styles.hintText}>💡 {exercise.hint}</Text>
          </View>
        ) : null}

        <Spacer size={spacing.xxl} />
      </ScrollView>

      <View style={styles.footer}>
        {session.phase === 'feedback' ? (
          <BigButton
            label={session.index + 1 >= total ? 'Voir mon résultat' : 'Continuer'}
            emoji="➡️"
            onPress={session.next}
          />
        ) : (
          <View style={styles.footerRow}>
            {exercise.hint && !session.hintVisible ? (
              <SecondaryButton label="💡 Indice" onPress={session.showHint} style={styles.hintButton} />
            ) : null}
            {showVerify ? (
              <BigButton
                label="Vérifier"
                emoji="✅"
                onPress={session.submit}
                disabled={!session.canSubmit}
                color={palette.succes}
                style={styles.verifyButton}
              />
            ) : (
              <Text style={styles.tapHint}>Touche ta réponse 👆</Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.fond },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.fondDoux,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 20, color: palette.texteDoux },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.corpsFort, color: palette.texte },
  headerMeta: { ...typography.minuscule, color: palette.texteDoux },
  score: { alignItems: 'flex-end' },
  points: { ...typography.corpsFort, color: palette.orange },
  combo: { ...typography.minuscule, color: palette.violet },
  timer: { ...typography.corpsFort, color: palette.texte },
  timerUrgent: { color: palette.erreur },

  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },

  hint: {
    marginTop: spacing.lg,
    backgroundColor: '#FFF7E3',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: palette.jaune,
  },
  hintText: { ...typography.corps, color: palette.texte },

  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: palette.fondCarte,
    borderTopWidth: 1,
    borderTopColor: palette.bordure,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hintButton: { flexShrink: 0, paddingHorizontal: spacing.lg },
  verifyButton: { flex: 1 },
  tapHint: { ...typography.corps, color: palette.texteDoux, textAlign: 'center', flex: 1 },
});
