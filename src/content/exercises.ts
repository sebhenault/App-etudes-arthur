/**
 * Transformation des items JSON en « exercices » jouables, et correction.
 *
 * Un item du pack n'est pas toujours un seul exercice : un item de type
 * `lecture` produit un exercice par question (le texte reste affiché au-dessus).
 * Chaque exercice possède une clé unique dans toute l'application, ce qui permet
 * de suivre sa maîtrise dans la répétition espacée.
 */

import type { ContentItem, ContentPack, LecturePassage } from './types';

export type ExercisePrompt =
  | { kind: 'qcm'; question: string; choices: string[]; answer: number }
  | { kind: 'vraiFaux'; statement: string; answer: boolean }
  | { kind: 'texteATrous'; prompt: string; answers: string[] }
  | { kind: 'association'; instruction: string; pairs: { left: string; right: string }[] }
  | { kind: 'ordre'; instruction: string; sequence: string[] }
  | {
      kind: 'classement';
      instruction: string;
      buckets: string[];
      tokens: { text: string; bucket: string }[];
    }
  | { kind: 'calcul'; question: string; answer: number; unit?: string; tolerance: number }
  | {
      kind: 'lecture';
      passage: LecturePassage;
      question: string;
      choices: string[];
      answer: number;
    };

export type ExerciseKind = ExercisePrompt['kind'];

export interface Exercise {
  /** Clé unique dans toute l'application : `packId::itemId[::questionId]`. */
  key: string;
  packId: string;
  packTitle: string;
  subject: string;
  topic: string;
  /** Étiquette fine pour l'analyse des difficultés. */
  skill: string;
  difficulty: number;
  hint?: string;
  explanation?: string;
  timeTargetMs: number;
  prompt: ExercisePrompt;
}

export type ExerciseResponse =
  | { kind: 'choice'; index: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number | null }
  | { kind: 'pairs'; value: Record<string, string> }
  | { kind: 'order'; value: string[] }
  | { kind: 'buckets'; value: Record<string, string> }
  | { kind: 'skipped' };

export interface GradeResult {
  correct: boolean;
  /** Score partiel entre 0 et 1 (utile pour les jeux à plusieurs éléments). */
  score: number;
  /** Réponse attendue, en texte lisible par un enfant. */
  expected: string;
  /** Réponse donnée, en texte (stockée pour l'analyse des erreurs fréquentes). */
  given: string;
}

const DEFAULT_TIME_TARGET_MS = 20000;

/** Temps visé par défaut selon le type d'exercice (bonus de rapidité). */
const TIME_TARGETS: Record<ExerciseKind, number> = {
  qcm: 15000,
  vraiFaux: 10000,
  texteATrous: 20000,
  association: 45000,
  ordre: 40000,
  classement: 60000,
  calcul: 12000,
  lecture: 30000,
};

function toPrompts(item: ContentItem): { suffix?: string; prompt: ExercisePrompt; skill?: string }[] {
  switch (item.type) {
    case 'qcm':
      return [
        { prompt: { kind: 'qcm', question: item.question, choices: item.choices, answer: item.answer } },
      ];
    case 'vraiFaux':
      return [{ prompt: { kind: 'vraiFaux', statement: item.statement, answer: item.answer } }];
    case 'texteATrous':
      return [{ prompt: { kind: 'texteATrous', prompt: item.prompt, answers: item.answers } }];
    case 'association':
      return [{ prompt: { kind: 'association', instruction: item.instruction, pairs: item.pairs } }];
    case 'ordre':
      return [{ prompt: { kind: 'ordre', instruction: item.instruction, sequence: item.sequence } }];
    case 'classement':
      return [
        {
          prompt: {
            kind: 'classement',
            instruction: item.instruction,
            buckets: item.buckets,
            tokens: item.tokens,
          },
        },
      ];
    case 'calcul':
      return [
        {
          prompt: {
            kind: 'calcul',
            question: item.question,
            answer: item.answer,
            unit: item.unit,
            tolerance: item.tolerance ?? 0,
          },
        },
      ];
    case 'lecture':
      return item.questions.map((question) => ({
        suffix: question.id,
        skill: question.skill,
        prompt: {
          kind: 'lecture',
          passage: item.passage,
          question: question.question,
          choices: question.choices,
          answer: question.answer,
        },
      }));
  }
}

/** Convertit un pack en liste d'exercices jouables. */
export function packToExercises(pack: ContentPack): Exercise[] {
  const packDifficulty = pack.difficulty ?? 2;
  const exercises: Exercise[] = [];

  for (const item of pack.items) {
    const explanationsByQuestion =
      item.type === 'lecture'
        ? new Map(item.questions.map((q) => [q.id, q.explanation]))
        : undefined;

    for (const entry of toPrompts(item)) {
      const key = entry.suffix
        ? `${pack.id}::${item.id}::${entry.suffix}`
        : `${pack.id}::${item.id}`;
      exercises.push({
        key,
        packId: pack.id,
        packTitle: pack.title,
        subject: pack.subject,
        topic: pack.topic,
        skill: entry.skill ?? item.skill ?? `${pack.topic}-general`,
        difficulty: item.difficulty ?? packDifficulty,
        hint: item.hint,
        explanation:
          (entry.suffix ? explanationsByQuestion?.get(entry.suffix) : undefined) ?? item.explanation,
        timeTargetMs:
          item.timeTargetMs ?? TIME_TARGETS[entry.prompt.kind] ?? DEFAULT_TIME_TARGET_MS,
        prompt: entry.prompt,
      });
    }
  }

  return exercises;
}

// ---------------------------------------------------------------------------
// Correction
// ---------------------------------------------------------------------------

/** Normalise un texte pour comparer sans tenir compte de la casse ni des accents. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[.,;!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const boolLabel = (v: boolean) => (v ? 'Vrai' : 'Faux');

function gradeMap(
  expectedEntries: [string, string][],
  given: Record<string, string>,
): { score: number; givenText: string } {
  let good = 0;
  for (const [key, value] of expectedEntries) {
    if (given[key] !== undefined && normalizeText(given[key]) === normalizeText(value)) {
      good += 1;
    }
  }
  const givenText = expectedEntries
    .map(([key]) => `${key} → ${given[key] ?? '?'}`)
    .join(' · ');
  return { score: expectedEntries.length === 0 ? 0 : good / expectedEntries.length, givenText };
}

/** Corrige une réponse et retourne un score partiel entre 0 et 1. */
export function gradeExercise(exercise: Exercise, response: ExerciseResponse): GradeResult {
  const prompt = exercise.prompt;

  if (response.kind === 'skipped') {
    return { correct: false, score: 0, expected: expectedAnswerText(exercise), given: '(passé)' };
  }

  switch (prompt.kind) {
    case 'qcm':
    case 'lecture': {
      const index = response.kind === 'choice' ? response.index : -1;
      const correct = index === prompt.answer;
      return {
        correct,
        score: correct ? 1 : 0,
        expected: prompt.choices[prompt.answer],
        given: prompt.choices[index] ?? '(aucune)',
      };
    }
    case 'vraiFaux': {
      const value = response.kind === 'boolean' ? response.value : null;
      const correct = value === prompt.answer;
      return {
        correct,
        score: correct ? 1 : 0,
        expected: boolLabel(prompt.answer),
        given: value === null ? '(aucune)' : boolLabel(value),
      };
    }
    case 'texteATrous': {
      const raw = response.kind === 'text' ? response.value : '';
      const normalized = normalizeText(raw);
      const correct =
        normalized.length > 0 && prompt.answers.some((a) => normalizeText(a) === normalized);
      return {
        correct,
        score: correct ? 1 : 0,
        expected: prompt.answers[0],
        given: raw.trim() || '(vide)',
      };
    }
    case 'calcul': {
      const value = response.kind === 'number' ? response.value : null;
      const correct = value !== null && Math.abs(value - prompt.answer) <= prompt.tolerance;
      return {
        correct,
        score: correct ? 1 : 0,
        expected: `${prompt.answer}${prompt.unit ? ` ${prompt.unit}` : ''}`,
        given: value === null ? '(vide)' : String(value),
      };
    }
    case 'association': {
      const given = response.kind === 'pairs' ? response.value : {};
      const { score, givenText } = gradeMap(
        prompt.pairs.map((p) => [p.left, p.right] as [string, string]),
        given,
      );
      return {
        correct: score === 1,
        score,
        expected: prompt.pairs.map((p) => `${p.left} → ${p.right}`).join(' · '),
        given: givenText,
      };
    }
    case 'classement': {
      const given = response.kind === 'buckets' ? response.value : {};
      const { score, givenText } = gradeMap(
        prompt.tokens.map((t) => [t.text, t.bucket] as [string, string]),
        given,
      );
      return {
        correct: score === 1,
        score,
        expected: prompt.tokens.map((t) => `${t.text} → ${t.bucket}`).join(' · '),
        given: givenText,
      };
    }
    case 'ordre': {
      const given = response.kind === 'order' ? response.value : [];
      const expected = prompt.sequence;
      let good = 0;
      expected.forEach((value, index) => {
        if (given[index] !== undefined && normalizeText(given[index]) === normalizeText(value)) {
          good += 1;
        }
      });
      const score = expected.length === 0 ? 0 : good / expected.length;
      return {
        correct: score === 1,
        score,
        expected: expected.join(' → '),
        given: given.length > 0 ? given.join(' → ') : '(aucune)',
      };
    }
  }
}

/** Réponse attendue en texte, pour l'écran de correction et le journal d'erreurs. */
export function expectedAnswerText(exercise: Exercise): string {
  const prompt = exercise.prompt;
  switch (prompt.kind) {
    case 'qcm':
    case 'lecture':
      return prompt.choices[prompt.answer];
    case 'vraiFaux':
      return boolLabel(prompt.answer);
    case 'texteATrous':
      return prompt.answers[0];
    case 'calcul':
      return `${prompt.answer}${prompt.unit ? ` ${prompt.unit}` : ''}`;
    case 'association':
      return prompt.pairs.map((p) => `${p.left} → ${p.right}`).join(' · ');
    case 'classement':
      return prompt.tokens.map((t) => `${t.text} → ${t.bucket}`).join(' · ');
    case 'ordre':
      return prompt.sequence.join(' → ');
  }
}

/** Énoncé court de l'exercice (listes, historiques, rapports parent). */
export function exerciseTitle(exercise: Exercise): string {
  const prompt = exercise.prompt;
  switch (prompt.kind) {
    case 'qcm':
    case 'calcul':
      return prompt.question;
    case 'lecture':
      return `${prompt.passage.title} — ${prompt.question}`;
    case 'vraiFaux':
      return prompt.statement;
    case 'texteATrous':
      return prompt.prompt;
    case 'association':
    case 'ordre':
    case 'classement':
      return prompt.instruction;
  }
}

/** Libellé du type de jeu, affiché à l'enfant. */
export const KIND_LABELS: Record<ExerciseKind, string> = {
  qcm: 'Choix multiple',
  vraiFaux: 'Vrai ou faux',
  texteATrous: 'Mot à compléter',
  association: 'Association',
  ordre: 'Mets en ordre',
  classement: 'Glisser-déposer',
  calcul: 'Calcul rapide',
  lecture: 'Lecture',
};
