/**
 * Bibliothèque de contenu : assemble les packs livrés avec l'application et les
 * packs importés par le parent, puis en dérive l'arbre matières → sujets → packs.
 *
 * Point important pour la durabilité du projet : si un pack importé déclare une
 * matière ou un sujet absent du manifeste, la bibliothèque crée automatiquement
 * les nœuds manquants. L'enseignante peut donc envoyer un pack sur une notion
 * inédite sans qu'une seule ligne de code soit modifiée.
 */

import { packToExercises, type Exercise } from './exercises';
import { bundledManifest, bundledPacks } from './registry.generated';
import type { ContentManifest, LoadedPack, SubjectMeta } from './types';

export interface TopicNode {
  key: string;
  label: string;
  emoji?: string;
  subjectKey: string;
  packs: LoadedPack[];
  exerciseCount: number;
}

export interface SubjectNode {
  key: string;
  label: string;
  emoji?: string;
  color: string;
  order: number;
  topics: TopicNode[];
  exerciseCount: number;
}

export interface ContentLibrary {
  manifest: ContentManifest;
  packs: LoadedPack[];
  packById: Map<string, LoadedPack>;
  exercises: Exercise[];
  exerciseByKey: Map<string, Exercise>;
  exercisesByPack: Map<string, Exercise[]>;
  subjects: SubjectNode[];
  subjectByKey: Map<string, SubjectNode>;
  topicKey: (subject: string, topic: string) => string;
}

const FALLBACK_COLORS = ['#5B7CFA', '#F2994A', '#27AE60', '#9B51E0', '#EB5757', '#2D9CDB'];

/** « nouvelle-france » → « Nouvelle france » (secours quand le manifeste ne connaît pas la clé). */
function humanize(key: string): string {
  const spaced = key.replace(/[-_]/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const makeTopicKey = (subject: string, topic: string) => `${subject}/${topic}`;

/**
 * Construit la bibliothèque à partir des packs livrés et des packs importés.
 * Un pack importé portant le même identifiant qu'un pack livré le remplace :
 * c'est ainsi qu'on corrige ou enrichit un contenu sans publier une nouvelle version.
 */
export function buildLibrary(importedPacks: LoadedPack[] = []): ContentLibrary {
  const packById = new Map<string, LoadedPack>();
  bundledPacks.forEach((pack) => packById.set(pack.id, { ...pack, origin: 'bundled' }));
  importedPacks.forEach((pack) => packById.set(pack.id, { ...pack, origin: 'imported' }));

  const packs = [...packById.values()];

  const exercises: Exercise[] = [];
  const exercisesByPack = new Map<string, Exercise[]>();
  packs.forEach((pack) => {
    const list = packToExercises(pack);
    exercisesByPack.set(pack.id, list);
    exercises.push(...list);
  });
  const exerciseByKey = new Map(exercises.map((exercise) => [exercise.key, exercise]));

  // Arbre matières → sujets, amorcé par le manifeste puis complété par les packs.
  const subjectByKey = new Map<string, SubjectNode>();
  const ensureSubject = (key: string, meta?: SubjectMeta): SubjectNode => {
    const existing = subjectByKey.get(key);
    if (existing) return existing;
    const node: SubjectNode = {
      key,
      label: meta?.label ?? humanize(key),
      emoji: meta?.emoji ?? '📘',
      color: meta?.color ?? FALLBACK_COLORS[subjectByKey.size % FALLBACK_COLORS.length],
      order: meta?.order ?? 100 + subjectByKey.size,
      topics: [],
      exerciseCount: 0,
    };
    subjectByKey.set(key, node);
    return node;
  };

  bundledManifest.subjects.forEach((subject) => {
    const node = ensureSubject(subject.key, subject);
    subject.topics.forEach((topic) => {
      node.topics.push({
        key: topic.key,
        label: topic.label,
        emoji: topic.emoji ?? node.emoji,
        subjectKey: subject.key,
        packs: [],
        exerciseCount: 0,
      });
    });
  });

  packs.forEach((pack) => {
    const subject = ensureSubject(pack.subject);
    let topic = subject.topics.find((t) => t.key === pack.topic);
    if (!topic) {
      topic = {
        key: pack.topic,
        label: humanize(pack.topic),
        emoji: subject.emoji,
        subjectKey: subject.key,
        packs: [],
        exerciseCount: 0,
      };
      subject.topics.push(topic);
    }
    const count = exercisesByPack.get(pack.id)?.length ?? 0;
    topic.packs.push(pack);
    topic.exerciseCount += count;
    subject.exerciseCount += count;
  });

  const subjects = [...subjectByKey.values()]
    // Les sujets sans aucun pack ne sont pas affichés : ils encombreraient l'écran parent.
    .map((subject) => ({ ...subject, topics: subject.topics.filter((t) => t.packs.length > 0) }))
    .filter((subject) => subject.topics.length > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'fr'));

  const sortedByKey = new Map(subjects.map((subject) => [subject.key, subject]));

  return {
    manifest: bundledManifest,
    packs,
    packById,
    exercises,
    exerciseByKey,
    exercisesByPack,
    subjects,
    subjectByKey: sortedByKey,
    topicKey: makeTopicKey,
  };
}

/** Bibliothèque sans aucun pack importé — utile pour les tests et le premier rendu. */
export const emptyLibrary = (): ContentLibrary => buildLibrary([]);
