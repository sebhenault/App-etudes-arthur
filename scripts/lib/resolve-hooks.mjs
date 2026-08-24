/**
 * Hooks de résolution ESM pour exécuter le code de l'application sous Node
 * (scripts de contenu et tests unitaires).
 *
 * Deux écarts entre Metro — le bundler de React Native — et Node :
 *   1. Metro importe les fichiers JSON sans attribut, Node exige `with { type: 'json' }` ;
 *   2. Metro résout `./mastery` vers `mastery.ts`, Node veut l'extension complète.
 *
 * Plutôt que d'écrire le code source différemment pour les tests, on comble
 * l'écart ici. Le code de `src/` reste donc celui que l'application embarque.
 */

const TS_EXTENSIONS = ['.ts', '.tsx'];

export async function resolve(specifier, context, next) {
  try {
    const result = await next(specifier, context);
    if (result.url.endsWith('.json')) {
      return { ...result, importAttributes: { type: 'json' } };
    }
    return result;
  } catch (error) {
    const relative = specifier.startsWith('.') || specifier.startsWith('/');
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !relative) throw error;

    for (const extension of TS_EXTENSIONS) {
      try {
        return await next(`${specifier}${extension}`, context);
      } catch {
        // On essaie l'extension suivante.
      }
    }
    throw error;
  }
}
