import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loading } from './src/components/ui';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider, useApp } from './src/state/AppContext';
import { palette, spacing, typography } from './src/theme';

function Racine() {
  const { ready, error } = useApp();

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>L'application n'a pas pu démarrer</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Loading label="Préparation des défis…" />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Racine />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: palette.fond },
  error: {
    flex: 1,
    backgroundColor: palette.fond,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorEmoji: { fontSize: 52 },
  errorTitle: { ...typography.sousTitre, color: palette.texte, textAlign: 'center' },
  errorText: { ...typography.petit, color: palette.texteDoux, textAlign: 'center' },
});
