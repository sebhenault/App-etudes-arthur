import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { SessionMode } from '../domain/types';

export type RootStackParamList = {
  /** Espace enfant (onglets Jouer / Médailles / Moi). */
  Enfant: undefined;
  /** Choix d'une matière puis d'un sujet pour un entraînement ciblé. */
  ChoisirSujet: undefined;
  /** Écran de jeu. Le bilan de fin de partie est affiché dans le même écran. */
  Jeu: {
    mode: SessionMode;
    subject?: string;
    topic?: string;
    length?: number;
    timeLimitSeconds?: number;
    title?: string;
  };
  /** Saisie du NIP avant d'entrer dans l'espace parent. */
  VerrouParent: undefined;
  /** Espace parent (onglets). */
  Parent: undefined;
  Reglages: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type ParentTabParamList = {
  TableauBord: undefined;
  Semaine: undefined;
  Analyse: undefined;
  Contenus: undefined;
};

export type EnfantTabParamList = {
  Jouer: undefined;
  Medailles: undefined;
  Moi: undefined;
};
