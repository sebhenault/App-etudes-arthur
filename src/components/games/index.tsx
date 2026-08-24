/** Aiguillage : à chaque type d'exercice son composant de jeu. */

import { ChoiceGame } from './ChoiceGame';
import { FillBlankGame } from './FillBlankGame';
import { MatchGame } from './MatchGame';
import { NumberGame } from './NumberGame';
import { OrderGame } from './OrderGame';
import { SortGame } from './SortGame';
import { TrueFalseGame } from './TrueFalseGame';
import type { GameComponentProps } from './types';

export function GameRenderer(props: GameComponentProps) {
  switch (props.exercise.prompt.kind) {
    case 'qcm':
    case 'lecture':
      return <ChoiceGame {...props} />;
    case 'vraiFaux':
      return <TrueFalseGame {...props} />;
    case 'texteATrous':
      return <FillBlankGame {...props} />;
    case 'calcul':
      return <NumberGame {...props} />;
    case 'association':
      return <MatchGame {...props} />;
    case 'ordre':
      return <OrderGame {...props} />;
    case 'classement':
      return <SortGame {...props} />;
  }
}

/** Les jeux corrigés au tap n'ont pas besoin du bouton « Vérifier ». */
export const isInstantKind = (kind: string): boolean =>
  kind === 'qcm' || kind === 'lecture' || kind === 'vraiFaux';

export { ChoiceGame, FillBlankGame, MatchGame, NumberGame, OrderGame, SortGame, TrueFalseGame };
export type { GameComponentProps };
