/**
 * Types du format de contenu pédagogique.
 *
 * Tout le contenu de l'application vit dans des fichiers JSON (dossier `content/`).
 * Aucun code n'a besoin d'être modifié pour ajouter une notion : il suffit de
 * déposer un nouveau pack JSON et de lancer `npm run content:build`.
 * Voir `docs/FORMAT-CONTENU.md` pour la documentation complète du format.
 */

// ---------------------------------------------------------------------------
// Manifeste (matières et sujets)
// ---------------------------------------------------------------------------

export interface TopicMeta {
  key: string;
  label: string;
  emoji?: string;
}

export interface SubjectMeta {
  key: string;
  label: string;
  emoji?: string;
  color?: string;
  order?: number;
  topics: TopicMeta[];
}

export interface ContentManifest {
  schemaVersion: number;
  grade: number;
  locale: string;
  updatedAt?: string;
  subjects: SubjectMeta[];
}

// ---------------------------------------------------------------------------
// Items d'un pack
// ---------------------------------------------------------------------------

export type ItemType =
  | 'qcm'
  | 'vraiFaux'
  | 'texteATrous'
  | 'association'
  | 'ordre'
  | 'classement'
  | 'calcul'
  | 'lecture';

export interface BaseItem {
  /** Identifiant unique à l'intérieur du pack. */
  id: string;
  type: ItemType;
  /** Étiquette fine utilisée par la détection des difficultés (ex. « accord-sujet-verbe »). */
  skill?: string;
  /** 1 = facile, 2 = moyen, 3 = difficile. Par défaut : difficulté du pack. */
  difficulty?: number;
  hint?: string;
  explanation?: string;
  /** Points de base accordés (défaut : voir `domain/gamification`). */
  points?: number;
  /** Temps visé pour un bonus de rapidité, en millisecondes. */
  timeTargetMs?: number;
}

export interface QcmItem extends BaseItem {
  type: 'qcm';
  question: string;
  choices: string[];
  /** Index (base 0) de la bonne réponse dans `choices`. */
  answer: number;
}

export interface VraiFauxItem extends BaseItem {
  type: 'vraiFaux';
  statement: string;
  answer: boolean;
}

export interface TexteATrousItem extends BaseItem {
  type: 'texteATrous';
  /** Texte contenant `___` à l'endroit du trou. */
  prompt: string;
  /** Toutes les réponses acceptées (comparaison insensible à la casse et aux accents). */
  answers: string[];
}

export interface AssociationPair {
  left: string;
  right: string;
}

export interface AssociationItem extends BaseItem {
  type: 'association';
  instruction: string;
  pairs: AssociationPair[];
}

export interface OrdreItem extends BaseItem {
  type: 'ordre';
  instruction: string;
  /** Les éléments **dans le bon ordre** ; l'application les mélange à l'affichage. */
  sequence: string[];
}

export interface ClassementToken {
  text: string;
  bucket: string;
}

export interface ClassementItem extends BaseItem {
  type: 'classement';
  instruction: string;
  buckets: string[];
  tokens: ClassementToken[];
}

export interface CalculItem extends BaseItem {
  type: 'calcul';
  question: string;
  answer: number;
  unit?: string;
  /** Marge d'erreur acceptée (défaut 0). */
  tolerance?: number;
}

export interface LecturePassage {
  title: string;
  text: string;
}

export interface LectureQuestion {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  skill?: string;
  explanation?: string;
}

export interface LectureItem extends BaseItem {
  type: 'lecture';
  passage: LecturePassage;
  questions: LectureQuestion[];
}

export type ContentItem =
  | QcmItem
  | VraiFauxItem
  | TexteATrousItem
  | AssociationItem
  | OrdreItem
  | ClassementItem
  | CalculItem
  | LectureItem;

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export interface ContentPack {
  schemaVersion: number;
  /** Identifiant unique parmi TOUS les packs (ex. « fr-accords-01 »). */
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: number;
  difficulty?: number;
  estimatedMinutes?: number;
  source?: string;
  description?: string;
  tags?: string[];
  /** Le sujet est-il actif dès la première ouverture ? (le parent peut changer) */
  defaultEnabled?: boolean;
  items: ContentItem[];
}

/** Provenance d'un pack : livré avec l'app ou importé par le parent. */
export type PackOrigin = 'bundled' | 'imported';

export interface LoadedPack extends ContentPack {
  origin: PackOrigin;
  /** Date d'import (packs importés seulement). */
  importedAt?: number;
}

// ---------------------------------------------------------------------------
// Résultat de validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  pack?: ContentPack;
}
