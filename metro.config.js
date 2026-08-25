// Configuration Metro.
//
// Un seul écart par rapport aux réglages par défaut d'Expo : `expo-sqlite` utilise
// sur le web une version WebAssembly de SQLite (wa-sqlite). Metro ne considère pas
// « .wasm » comme un actif résolvable par défaut, ce qui casse l'export web.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// SQLite sur le web s'exécute dans un worker et exige un contexte « cross-origin
// isolated ». Ces en-têtes sont posés ici pour le serveur de développement ; en
// production, ils doivent être configurés côté hébergeur (voir docs/DEPLOIEMENT.md).
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(request, response, next);
};

module.exports = config;
