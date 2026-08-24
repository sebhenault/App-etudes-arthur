import type { Exercise, ExerciseResponse, GradeResult } from '../../content/exercises';

export interface GameComponentProps {
  exercise: Exercise;
  /** Vrai une fois la réponse validée : les contrôles deviennent inertes. */
  locked: boolean;
  /** Résultat de la correction, null tant que l'enfant n'a pas validé. */
  result: GradeResult | null;
  /**
   * Transmet la réponse au lecteur.
   * `immediate` = corriger tout de suite (choix multiples, vrai ou faux),
   * sinon la réponse est mise de côté et l'enfant appuie sur « Vérifier ».
   */
  onRespond: (response: ExerciseResponse | null, immediate?: boolean) => void;
}

export type { Exercise, ExerciseResponse, GradeResult };
