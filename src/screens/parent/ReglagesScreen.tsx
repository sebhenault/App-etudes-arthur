import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import {
  BigButton,
  Body,
  Card,
  Muted,
  Screen,
  SecondaryButton,
  SectionTitle,
  Spacer,
  Title,
} from '../../components/ui';
import * as repo from '../../db/repositories';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';
import { PIN_SETTING_KEY } from './VerrouScreen';

/** Réglages du profil, NIP parent et remise à zéro. */
export function ReglagesScreen() {
  const navigation = useNavigation();
  const { profile, setProfilePatch, refresh } = useApp();
  const [name, setName] = useState(profile?.name ?? 'Arthur');
  const [newPin, setNewPin] = useState('');

  if (!profile) return <Screen />;

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    await setProfilePatch({ name: trimmed });
    Alert.alert('Enregistré', `Le prénom est maintenant « ${trimmed} ».`);
  };

  const savePin = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      Alert.alert('NIP invalide', 'Le NIP doit contenir exactement 4 chiffres.');
      return;
    }
    await repo.setSetting(PIN_SETTING_KEY, newPin);
    setNewPin('');
    Alert.alert('NIP modifié', 'Le nouveau NIP est actif.');
  };

  const confirmReset = () => {
    Alert.alert(
      'Effacer toute la progression ?',
      'Les points, médailles, statistiques et historiques seront supprimés. Les contenus et les réglages de sujets sont conservés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: async () => {
            await repo.resetProgress(profile.id);
            await refresh();
            Alert.alert('Progression effacée', 'Arthur repart de zéro.');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Title>Réglages</Title>

      <SectionTitle>Profil</SectionTitle>
      <Card>
        <Body>Prénom de l'enfant</Body>
        <Spacer size={spacing.sm} />
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          accessibilityLabel="Prénom de l'enfant"
        />
        <Spacer size={spacing.md} />
        <SecondaryButton label="Enregistrer" onPress={saveName} />
        <Spacer size={spacing.md} />
        <Muted>Année scolaire : {profile.grade}e année (primaire, Québec)</Muted>
      </Card>

      <SectionTitle>NIP parent</SectionTitle>
      <Card>
        <Body>Changer le NIP à 4 chiffres</Body>
        <Spacer size={spacing.sm} />
        <TextInput
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={palette.texteDoux}
          style={styles.input}
          accessibilityLabel="Nouveau NIP"
        />
        <Spacer size={spacing.md} />
        <SecondaryButton label="Mettre à jour le NIP" onPress={savePin} />
      </Card>

      <SectionTitle>Confidentialité</SectionTitle>
      <Card>
        <Body>Tout reste sur cet appareil.</Body>
        <Spacer size={spacing.sm} />
        <Muted>
          L'application ne fait aucune requête réseau et n'a besoin d'aucun compte. Les résultats
          d'Arthur sont stockés dans une base SQLite locale. Désinstaller l'application efface
          définitivement ces données : pense à faire une sauvegarde de l'appareil si tu veux les
          conserver.
        </Muted>
      </Card>

      <SectionTitle>Zone sensible</SectionTitle>
      <BigButton
        label="Effacer la progression"
        emoji="🗑️"
        color={palette.erreur}
        onPress={confirmReset}
      />

      <Spacer size={spacing.xl} />
      <SecondaryButton label="Retour" onPress={() => navigation.goBack()} />
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    paddingHorizontal: spacing.md,
    ...typography.corps,
    color: palette.texte,
  },
});
