/**
 * Thème visuel. Deux exigences guident ces choix :
 *  - un enfant de 9-10 ans doit pouvoir viser une cible du doigt sans se tromper
 *    (d'où des zones tactiles d'au moins 56 px et des marges généreuses) ;
 *  - le parent doit lire des chiffres denses sans fatigue (d'où des variantes
 *    plus sobres pour le tableau de bord).
 */

import { THEMES } from '../domain/gamification';

export const palette = {
  bleu: '#5B7CFA',
  bleuFonce: '#3A56C4',
  orange: '#F2994A',
  vert: '#27AE60',
  violet: '#9B51E0',
  rouge: '#EB5757',
  jaune: '#F2C94C',
  turquoise: '#2D9CDB',

  fond: '#F5F7FF',
  fondCarte: '#FFFFFF',
  fondDoux: '#EEF1FB',
  bordure: '#DDE3F5',

  texte: '#1E2438',
  texteDoux: '#5A6180',
  texteInverse: '#FFFFFF',

  succes: '#27AE60',
  succesDoux: '#E4F6EA',
  erreur: '#EB5757',
  erreurDoux: '#FDEAEA',
  alerte: '#F2994A',
  alerteDoux: '#FDF0E3',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  titreXL: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  titre: { fontSize: 24, fontWeight: '800' as const },
  sousTitre: { fontSize: 19, fontWeight: '700' as const },
  corps: { fontSize: 17, fontWeight: '500' as const },
  corpsFort: { fontSize: 17, fontWeight: '700' as const },
  // Les énoncés lus par l'enfant sont volontairement plus gros que le reste.
  enonce: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  lecture: { fontSize: 18, fontWeight: '400' as const, lineHeight: 28 },
  petit: { fontSize: 14, fontWeight: '600' as const },
  minuscule: { fontSize: 12, fontWeight: '600' as const },
} as const;

export const shadow = {
  carte: {
    shadowColor: '#1E2438',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bouton: {
    shadowColor: '#1E2438',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
} as const;

/** Surface tactile minimale confortable pour un enfant. */
export const TOUCH_MIN_HEIGHT = 56;

/** Couleur principale associée au thème débloqué et choisi par l'enfant. */
export function themeColor(themeId: string): string {
  return THEMES.find((theme) => theme.id === themeId)?.primary ?? palette.bleu;
}

/** Couleur d'une matière, avec repli neutre pour une matière inconnue. */
export const subjectColor = (color?: string): string => color ?? palette.bleu;
