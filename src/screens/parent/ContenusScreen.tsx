import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BigButton,
  Body,
  Card,
  Muted,
  Row,
  Screen,
  SecondaryButton,
  SectionTitle,
  Spacer,
  Title,
} from '../../components/ui';
import { parseAndValidatePack } from '../../content/validation';
import * as repo from '../../db/repositories';
import { useApp } from '../../state/AppContext';
import { palette, radius, spacing, typography } from '../../theme';

/**
 * Gestion des contenus : c'est ici que le projet reste vivant dans le temps.
 *
 * Quand l'enseignante envoie son plan de la semaine, on ajoute un pack JSON —
 * par fichier ou par copier-coller — et les nouveaux exercices deviennent
 * immédiatement jouables. Aucune mise à jour de l'application n'est nécessaire.
 */
export function ContenusScreen() {
  const { library, importedPacks, reloadLibrary } = useApp();
  const [pasted, setPasted] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const importJson = async (json: string, label: string) => {
    const result = parseAndValidatePack(json, label);
    if (!result.ok || !result.pack) {
      setMessages(result.errors);
      Alert.alert('Pack refusé', result.errors.slice(0, 4).join('\n'));
      return;
    }
    await repo.saveImportedPack({ ...result.pack, origin: 'imported' }, json);
    await reloadLibrary();
    setMessages(result.warnings);
    setPasted('');
    setShowPaste(false);
    Alert.alert(
      'Pack importé',
      `« ${result.pack.title} » a été ajouté (${result.pack.items.length} items).` +
        (result.warnings.length > 0 ? `\n\nAvertissements :\n${result.warnings.join('\n')}` : ''),
    );
  };

  const pickFile = async () => {
    setBusy(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || picked.assets.length === 0) return;
      const asset = picked.assets[0];
      const text = await new File(asset.uri).text();
      await importJson(text, asset.name ?? 'pack importé');
    } catch (error) {
      Alert.alert('Import impossible', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removePack = (packId: string, title: string) => {
    Alert.alert('Supprimer ce pack ?', `« ${title} » ne sera plus proposé à Arthur.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await repo.deleteImportedPack(packId);
          await reloadLibrary();
        },
      },
    ]);
  };

  const bundledCount = library.packs.filter((pack) => pack.origin === 'bundled').length;
  const totalExercises = library.exercises.length;

  return (
    <Screen>
      <Title>Contenus</Title>
      <Muted>
        {library.packs.length} pack(s) · {totalExercises} exercices jouables
      </Muted>

      <SectionTitle>Ajouter un contenu</SectionTitle>
      <Card>
        <Body>
          Dépose un fichier JSON envoyé par l'enseignante, ou colle son contenu. Le format est
          décrit dans docs/FORMAT-CONTENU.md.
        </Body>
        <Spacer size={spacing.md} />
        <BigButton
          label={busy ? 'Import en cours…' : 'Importer un fichier JSON'}
          emoji="📥"
          onPress={pickFile}
          disabled={busy}
        />
        <Spacer size={spacing.md} />
        <SecondaryButton
          label={showPaste ? 'Masquer le collage' : 'Coller du JSON'}
          onPress={() => setShowPaste((value) => !value)}
        />
        {showPaste ? (
          <>
            <Spacer size={spacing.md} />
            <TextInput
              value={pasted}
              onChangeText={setPasted}
              multiline
              placeholder={'{\n  "schemaVersion": 1,\n  "id": "fr-nouveau-01",\n  ...\n}'}
              placeholderTextColor={palette.texteDoux}
              style={styles.textarea}
              accessibilityLabel="Contenu JSON du pack"
            />
            <Spacer size={spacing.sm} />
            <SecondaryButton
              label="Valider et importer"
              color={palette.succes}
              disabled={pasted.trim().length === 0}
              onPress={() => importJson(pasted, 'pack collé')}
            />
          </>
        ) : null}

        {messages.length > 0 ? (
          <>
            <Spacer size={spacing.md} />
            {messages.map((message) => (
              <Text key={message} style={styles.warning}>
                • {message}
              </Text>
            ))}
          </>
        ) : null}
      </Card>

      <SectionTitle>Packs importés ({importedPacks.length})</SectionTitle>
      {importedPacks.length === 0 ? (
        <Card>
          <Muted>Aucun pack importé pour l'instant.</Muted>
        </Card>
      ) : (
        importedPacks.map((pack) => (
          <Card key={pack.id} style={styles.packCard}>
            <Row style={styles.spread}>
              <View style={styles.flex}>
                <Body>{pack.title}</Body>
                <Muted>
                  {pack.subject} · {pack.topic} · {pack.items.length} items
                </Muted>
                {pack.importedAt ? (
                  <Muted>Importé le {new Date(pack.importedAt).toLocaleDateString('fr-CA')}</Muted>
                ) : null}
              </View>
              <SecondaryButton
                label="Supprimer"
                color={palette.erreur}
                style={styles.smallButton}
                onPress={() => removePack(pack.id, pack.title)}
              />
            </Row>
          </Card>
        ))
      )}

      <SectionTitle>Packs livrés avec l'application ({bundledCount})</SectionTitle>
      {library.subjects.map((subject) => (
        <Card key={subject.key} style={styles.packCard}>
          <Body style={{ color: subject.color }}>
            {subject.emoji} {subject.label}
          </Body>
          <Spacer size={spacing.sm} />
          {subject.topics.map((topic) =>
            topic.packs.map((pack) => (
              <Row key={pack.id} style={styles.spread}>
                <Muted style={styles.flex}>
                  {topic.label} — {pack.title}
                </Muted>
                <Muted>{pack.items.length}</Muted>
              </Row>
            )),
          )}
        </Card>
      ))}
      <Spacer size={spacing.xl} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spread: { justifyContent: 'space-between', gap: spacing.md },
  textarea: {
    minHeight: 160,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.bordure,
    padding: spacing.md,
    ...typography.petit,
    color: palette.texte,
    textAlignVertical: 'top',
  },
  warning: { ...typography.minuscule, color: palette.alerte },
  packCard: { marginBottom: spacing.sm },
  smallButton: { minHeight: 40, paddingHorizontal: spacing.md },
});
