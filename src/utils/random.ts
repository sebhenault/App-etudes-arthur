/**
 * Générateur pseudo-aléatoire déterministe.
 *
 * Les jeux d'association, de classement et de mise en ordre mélangent leurs
 * éléments. Un `Math.random()` direct rebattrait les cartes à chaque rendu, ce
 * qui déplacerait les boutons sous le doigt de l'enfant. On dérive donc la
 * graine de la clé de l'exercice : le mélange est stable pendant la partie et
 * différent d'un exercice à l'autre.
 */

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** PRNG « mulberry32 » : court, rapide et de qualité suffisante pour mélanger une liste. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange de Fisher-Yates, sans modifier le tableau d'origine. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Mélange reproductible à partir d'une clé texte (typiquement la clé de l'exercice). */
export const shuffleWithSeed = <T,>(items: T[], seed: string): T[] =>
  shuffle(items, seededRandom(hashString(seed)));
