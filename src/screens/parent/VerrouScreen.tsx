import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton, Muted, Screen, SecondaryButton, Spacer, Title } from '../../components/ui';
import * as repo from '../../db/repositories';
import type { RootStackParamList } from '../../navigation/types';
import { palette, radius, spacing, typography } from '../../theme';

export const PIN_SETTING_KEY = 'parent.pin';
const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/**
 * Porte d'entrée de l'espace parent.
 *
 * Ce NIP est un « portillon parental », pas une mesure de sécurité : il empêche
 * simplement l'enfant d'aller changer ses propres réglages. Il est donc stocké
 * en clair dans la base locale, comme le reste des préférences.
 */
export function VerrouScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [entry, setEntry] = useState('');
  const [confirmEntry, setConfirmEntry] = useState('');
  const [step, setStep] = useState<'saisie' | 'creation' | 'confirmation'>('saisie');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const pin = await repo.getSetting(PIN_SETTING_KEY);
      setStoredPin(pin);
      setStep(pin ? 'saisie' : 'creation');
      setLoaded(true);
    })();
  }, []);

  const currentValue = step === 'confirmation' ? confirmEntry : entry;
  const setCurrentValue = step === 'confirmation' ? setConfirmEntry : setEntry;

  const validate = async (value: string) => {
    if (step === 'saisie') {
      if (value === storedPin) {
        setEntry('');
        navigation.replace('Parent');
      } else {
        setError('NIP incorrect.');
        setEntry('');
      }
      return;
    }
    if (step === 'creation') {
      setStep('confirmation');
      setError(null);
      return;
    }
    if (value === entry) {
      await repo.setSetting(PIN_SETTING_KEY, value);
      navigation.replace('Parent');
    } else {
      setError('Les deux NIP ne correspondent pas.');
      setEntry('');
      setConfirmEntry('');
      setStep('creation');
    }
  };

  const push = (key: string) => {
    if (key === '') return;
    setError(null);
    if (key === '⌫') {
      setCurrentValue(currentValue.slice(0, -1));
      return;
    }
    if (currentValue.length >= PIN_LENGTH) return;
    const next = currentValue + key;
    setCurrentValue(next);
    if (next.length === PIN_LENGTH) void validate(next);
  };

  if (!loaded) return <Screen />;

  const titles: Record<typeof step, string> = {
    saisie: 'Espace parent',
    creation: 'Choisis un NIP',
    confirmation: 'Confirme le NIP',
  };
  const helps: Record<typeof step, string> = {
    saisie: 'Entre ton NIP à 4 chiffres.',
    creation: 'Ce NIP empêchera Arthur de modifier ses réglages.',
    confirmation: 'Saisis-le une seconde fois.',
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.lock}>🔒</Text>
        <Title>{titles[step]}</Title>
        <Muted>{helps[step]}</Muted>
      </View>

      <Spacer size={spacing.xl} />

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index < currentValue.length && styles.dotFilled]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Spacer size={spacing.xl} />

      <View style={styles.pad}>
        {KEYS.map((key, index) => (
          <Pressable
            key={`${key}-${index}`}
            onPress={() => push(key)}
            disabled={key === ''}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Effacer' : key}
            style={({ pressed }) => [
              styles.key,
              key === '' && styles.keyEmpty,
              pressed && key !== '' && styles.pressed,
            ]}
          >
            <Text style={styles.keyText}>{key}</Text>
          </Pressable>
        ))}
      </View>

      <Spacer size={spacing.xl} />
      <SecondaryButton label="Retour" onPress={() => navigation.goBack()} />
      {step === 'saisie' ? (
        <>
          <Spacer size={spacing.md} />
          <BigButton
            label="NIP oublié"
            emoji="❓"
            color={palette.texteDoux}
            onPress={() => {
              setStep('creation');
              setEntry('');
              setConfirmEntry('');
              setError('Définis un nouveau NIP.');
            }}
          />
        </>
      ) : null}
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.sm },
  lock: { fontSize: 52 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.bleu,
  },
  dotFilled: { backgroundColor: palette.bleu },
  error: { ...typography.petit, color: palette.erreur, textAlign: 'center', marginTop: spacing.md },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  key: {
    width: '30%',
    minHeight: 66,
    borderRadius: radius.md,
    backgroundColor: palette.fondCarte,
    borderWidth: 2,
    borderColor: palette.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 26, fontWeight: '700', color: palette.texte },
  pressed: { opacity: 0.7 },
});
