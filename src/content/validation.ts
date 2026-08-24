/**
 * Validation des packs de contenu.
 *
 * Ce module est la SEULE source de vérité sur la forme d'un pack. Il est utilisé :
 *  - au moment du build par `scripts/validate-content.mjs` (fichiers du dossier `content/`) ;
 *  - à l'exécution, quand un parent importe un pack JSON depuis l'application.
 */

import type {
  ContentItem,
  ContentManifest,
  ContentPack,
  ValidationResult,
} from './types';

/** Version du format de contenu supportée par cette version de l'application. */
export const SCHEMA_VERSION = 1;

const ITEM_TYPES = [
  'qcm',
  'vraiFaux',
  'texteATrous',
  'association',
  'ordre',
  'classement',
  'calcul',
  'lecture',
] as const;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString);

/** Valide un item et pousse les problèmes détectés dans `errors` / `warnings`. */
function validateItem(
  raw: unknown,
  where: string,
  errors: string[],
  warnings: string[],
): void {
  if (!isObject(raw)) {
    errors.push(`${where} : l'item doit être un objet.`);
    return;
  }
  if (!isNonEmptyString(raw.id)) {
    errors.push(`${where} : champ « id » manquant ou vide.`);
  }
  const type = raw.type;
  if (typeof type !== 'string' || !(ITEM_TYPES as readonly string[]).includes(type)) {
    errors.push(
      `${where} : type « ${String(type)} » inconnu. Types acceptés : ${ITEM_TYPES.join(', ')}.`,
    );
    return;
  }
  if (raw.skill !== undefined && !isNonEmptyString(raw.skill)) {
    errors.push(`${where} : « skill » doit être une chaîne non vide.`);
  }
  if (raw.skill === undefined) {
    warnings.push(
      `${where} : aucune « skill ». L'analyse des difficultés sera moins précise.`,
    );
  }
  if (raw.difficulty !== undefined) {
    const d = raw.difficulty;
    if (typeof d !== 'number' || d < 1 || d > 3) {
      errors.push(`${where} : « difficulty » doit valoir 1, 2 ou 3.`);
    }
  }

  switch (type) {
    case 'qcm': {
      if (!isNonEmptyString(raw.question)) errors.push(`${where} : « question » requise.`);
      if (!isStringArray(raw.choices) || raw.choices.length < 2) {
        errors.push(`${where} : « choices » doit contenir au moins 2 réponses.`);
      } else if (
        typeof raw.answer !== 'number' ||
        !Number.isInteger(raw.answer) ||
        raw.answer < 0 ||
        raw.answer >= raw.choices.length
      ) {
        errors.push(
          `${where} : « answer » doit être un index valide entre 0 et ${raw.choices.length - 1}.`,
        );
      }
      if (isStringArray(raw.choices) && new Set(raw.choices).size !== raw.choices.length) {
        warnings.push(`${where} : deux choix identiques.`);
      }
      break;
    }
    case 'vraiFaux': {
      if (!isNonEmptyString(raw.statement)) errors.push(`${where} : « statement » requis.`);
      if (typeof raw.answer !== 'boolean') {
        errors.push(`${where} : « answer » doit être true ou false.`);
      }
      break;
    }
    case 'texteATrous': {
      if (!isNonEmptyString(raw.prompt)) {
        errors.push(`${where} : « prompt » requis.`);
      } else if (!raw.prompt.includes('___')) {
        warnings.push(`${where} : le « prompt » ne contient pas de trou « ___ ».`);
      }
      if (!isStringArray(raw.answers)) {
        errors.push(`${where} : « answers » doit contenir au moins une réponse acceptée.`);
      }
      break;
    }
    case 'association': {
      if (!isNonEmptyString(raw.instruction)) errors.push(`${where} : « instruction » requise.`);
      const pairs = raw.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2) {
        errors.push(`${where} : « pairs » doit contenir au moins 2 paires.`);
        break;
      }
      if (pairs.length > 6) {
        warnings.push(`${where} : plus de 6 paires, l'écran risque d'être chargé pour un enfant.`);
      }
      const lefts = new Set<string>();
      const rights = new Set<string>();
      pairs.forEach((p, i) => {
        if (!isObject(p) || !isNonEmptyString(p.left) || !isNonEmptyString(p.right)) {
          errors.push(`${where} : paire #${i + 1} invalide (« left » et « right » requis).`);
          return;
        }
        if (lefts.has(p.left)) errors.push(`${where} : « ${p.left} » apparaît deux fois à gauche.`);
        if (rights.has(p.right)) {
          errors.push(
            `${where} : « ${p.right} » apparaît deux fois à droite (l'association deviendrait ambiguë).`,
          );
        }
        lefts.add(p.left);
        rights.add(p.right);
      });
      break;
    }
    case 'ordre': {
      if (!isNonEmptyString(raw.instruction)) errors.push(`${where} : « instruction » requise.`);
      if (!isStringArray(raw.sequence) || raw.sequence.length < 2) {
        errors.push(`${where} : « sequence » doit contenir au moins 2 éléments.`);
      } else if (new Set(raw.sequence).size !== raw.sequence.length) {
        errors.push(`${where} : « sequence » contient deux éléments identiques.`);
      }
      break;
    }
    case 'classement': {
      if (!isNonEmptyString(raw.instruction)) errors.push(`${where} : « instruction » requise.`);
      const buckets = raw.buckets;
      if (!isStringArray(buckets) || buckets.length < 2) {
        errors.push(`${where} : « buckets » doit contenir au moins 2 colonnes.`);
        break;
      }
      const tokens = raw.tokens;
      if (!Array.isArray(tokens) || tokens.length < 2) {
        errors.push(`${where} : « tokens » doit contenir au moins 2 éléments.`);
        break;
      }
      const used = new Set<string>();
      tokens.forEach((t, i) => {
        if (!isObject(t) || !isNonEmptyString(t.text) || !isNonEmptyString(t.bucket)) {
          errors.push(`${where} : token #${i + 1} invalide (« text » et « bucket » requis).`);
          return;
        }
        if (!buckets.includes(t.bucket)) {
          errors.push(`${where} : le token « ${t.text} » vise la colonne inconnue « ${t.bucket} ».`);
        }
        used.add(t.bucket);
      });
      buckets.forEach((b) => {
        if (!used.has(b)) warnings.push(`${where} : la colonne « ${b} » n'a aucun élément.`);
      });
      break;
    }
    case 'calcul': {
      if (!isNonEmptyString(raw.question)) errors.push(`${where} : « question » requise.`);
      if (typeof raw.answer !== 'number' || Number.isNaN(raw.answer)) {
        errors.push(`${where} : « answer » doit être un nombre.`);
      }
      if (raw.tolerance !== undefined && (typeof raw.tolerance !== 'number' || raw.tolerance < 0)) {
        errors.push(`${where} : « tolerance » doit être un nombre positif.`);
      }
      break;
    }
    case 'lecture': {
      const passage = raw.passage;
      if (!isObject(passage) || !isNonEmptyString(passage.title) || !isNonEmptyString(passage.text)) {
        errors.push(`${where} : « passage » doit contenir « title » et « text ».`);
      }
      const questions = raw.questions;
      if (!Array.isArray(questions) || questions.length < 1) {
        errors.push(`${where} : « questions » doit contenir au moins une question.`);
        break;
      }
      const ids = new Set<string>();
      questions.forEach((q, i) => {
        const w = `${where} → question #${i + 1}`;
        if (!isObject(q)) {
          errors.push(`${w} : doit être un objet.`);
          return;
        }
        if (!isNonEmptyString(q.id)) errors.push(`${w} : « id » requis.`);
        else if (ids.has(q.id)) errors.push(`${w} : identifiant « ${q.id} » en double.`);
        else ids.add(q.id);
        if (!isNonEmptyString(q.question)) errors.push(`${w} : « question » requise.`);
        if (!isStringArray(q.choices) || q.choices.length < 2) {
          errors.push(`${w} : « choices » doit contenir au moins 2 réponses.`);
        } else if (
          typeof q.answer !== 'number' ||
          q.answer < 0 ||
          q.answer >= q.choices.length
        ) {
          errors.push(`${w} : « answer » hors des choix proposés.`);
        }
      });
      break;
    }
  }
}

/**
 * Valide un pack complet (objet déjà désérialisé depuis JSON).
 */
export function validatePack(raw: unknown, label = 'pack'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: [`${label} : le contenu doit être un objet JSON.`], warnings };
  }

  if (typeof raw.schemaVersion !== 'number') {
    errors.push(`${label} : « schemaVersion » manquant.`);
  } else if (raw.schemaVersion > SCHEMA_VERSION) {
    errors.push(
      `${label} : « schemaVersion » ${raw.schemaVersion} est plus récent que la version supportée (${SCHEMA_VERSION}). Mets l'application à jour.`,
    );
  }

  (['id', 'title', 'subject', 'topic'] as const).forEach((field) => {
    if (!isNonEmptyString(raw[field])) errors.push(`${label} : champ « ${field} » manquant.`);
  });

  if (typeof raw.grade !== 'number') {
    errors.push(`${label} : « grade » (année scolaire) manquant.`);
  }
  if (raw.difficulty !== undefined && (typeof raw.difficulty !== 'number' || raw.difficulty < 1 || raw.difficulty > 3)) {
    errors.push(`${label} : « difficulty » doit valoir 1, 2 ou 3.`);
  }

  const items = raw.items;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${label} : « items » doit contenir au moins un exercice.`);
  } else {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const id = isObject(item) && isNonEmptyString(item.id) ? item.id : `#${index + 1}`;
      const where = `${label} → item ${id}`;
      if (seen.has(id)) errors.push(`${where} : identifiant en double dans le pack.`);
      seen.add(id);
      validateItem(item, where, errors, warnings);
    });
    // Un item « lecture » compte pour autant d'exercices qu'il a de questions.
    const playable = items.reduce((sum: number, item) => {
      if (isObject(item) && item.type === 'lecture' && Array.isArray(item.questions)) {
        return sum + item.questions.length;
      }
      return sum + 1;
    }, 0);
    if (playable < 6) {
      warnings.push(
        `${label} : seulement ${playable} exercice(s) jouable(s). Vise au moins 8 exercices pour une révision de 5 minutes.`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    pack: errors.length === 0 ? (raw as unknown as ContentPack) : undefined,
  };
}

/** Valide le manifeste des matières et sujets. */
export function validateManifest(raw: unknown): ValidationResult & { manifest?: ContentManifest } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ['manifest : doit être un objet JSON.'], warnings };
  }
  if (typeof raw.schemaVersion !== 'number') errors.push('manifest : « schemaVersion » manquant.');
  if (!Array.isArray(raw.subjects) || raw.subjects.length === 0) {
    errors.push('manifest : « subjects » doit contenir au moins une matière.');
    return { ok: false, errors, warnings };
  }

  const subjectKeys = new Set<string>();
  raw.subjects.forEach((subject, i) => {
    const where = `manifest → matière #${i + 1}`;
    if (!isObject(subject)) {
      errors.push(`${where} : doit être un objet.`);
      return;
    }
    if (!isNonEmptyString(subject.key)) errors.push(`${where} : « key » requise.`);
    else if (subjectKeys.has(subject.key)) errors.push(`${where} : clé « ${subject.key} » en double.`);
    else subjectKeys.add(subject.key);
    if (!isNonEmptyString(subject.label)) errors.push(`${where} : « label » requis.`);
    if (!Array.isArray(subject.topics) || subject.topics.length === 0) {
      errors.push(`${where} : « topics » doit contenir au moins un sujet.`);
      return;
    }
    const topicKeys = new Set<string>();
    subject.topics.forEach((topic, j) => {
      const tw = `${where} → sujet #${j + 1}`;
      if (!isObject(topic) || !isNonEmptyString(topic.key) || !isNonEmptyString(topic.label)) {
        errors.push(`${tw} : « key » et « label » requis.`);
        return;
      }
      if (topicKeys.has(topic.key)) errors.push(`${tw} : clé « ${topic.key} » en double.`);
      topicKeys.add(topic.key);
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    manifest: errors.length === 0 ? (raw as unknown as ContentManifest) : undefined,
  };
}

/**
 * Vérifie la cohérence entre les packs et le manifeste (matières/sujets déclarés).
 * Retourne uniquement des avertissements : un pack orphelin reste jouable, il
 * apparaîtra simplement sous une matière générée automatiquement.
 */
export function crossCheck(manifest: ContentManifest, packs: ContentPack[]): string[] {
  const warnings: string[] = [];
  const known = new Map<string, Set<string>>();
  manifest.subjects.forEach((s) => known.set(s.key, new Set(s.topics.map((t) => t.key))));

  const seenIds = new Set<string>();
  packs.forEach((pack) => {
    if (seenIds.has(pack.id)) {
      warnings.push(`Deux packs partagent l'identifiant « ${pack.id} ».`);
    }
    seenIds.add(pack.id);

    const topics = known.get(pack.subject);
    if (!topics) {
      warnings.push(`Pack « ${pack.id} » : matière « ${pack.subject} » absente du manifeste.`);
    } else if (!topics.has(pack.topic)) {
      warnings.push(
        `Pack « ${pack.id} » : sujet « ${pack.topic} » absent de la matière « ${pack.subject} » dans le manifeste.`,
      );
    }
  });

  const covered = new Set(packs.map((p) => `${p.subject}/${p.topic}`));
  manifest.subjects.forEach((s) =>
    s.topics.forEach((t) => {
      if (!covered.has(`${s.key}/${t.key}`)) {
        warnings.push(`Aucun pack pour le sujet « ${s.label} » (${s.key}/${t.key}).`);
      }
    }),
  );

  return warnings;
}

/** Parse une chaîne JSON puis la valide. Utilisé à l'import d'un pack par le parent. */
export function parseAndValidatePack(json: string, label = 'pack importé'): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      ok: false,
      errors: [`${label} : JSON invalide (${(error as Error).message}).`],
      warnings: [],
    };
  }
  return validatePack(parsed, label);
}

export type { ContentItem, ContentPack };
