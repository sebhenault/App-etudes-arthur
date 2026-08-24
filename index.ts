import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent appelle AppRegistry.registerComponent('main', () => App);
// Cela garantit que l'environnement est correctement configuré, que l'app soit
// lancée via Expo Go ou dans un build natif.
registerRootComponent(App);
