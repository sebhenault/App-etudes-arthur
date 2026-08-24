import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { AccueilEnfantScreen } from '../screens/enfant/AccueilEnfantScreen';
import { ChoisirSujetScreen } from '../screens/enfant/ChoisirSujetScreen';
import { JeuScreen } from '../screens/enfant/JeuScreen';
import { MedaillesScreen } from '../screens/enfant/MedaillesScreen';
import { MoiScreen } from '../screens/enfant/MoiScreen';
import { AnalyseScreen } from '../screens/parent/AnalyseScreen';
import { ContenusScreen } from '../screens/parent/ContenusScreen';
import { ReglagesScreen } from '../screens/parent/ReglagesScreen';
import { SemaineScreen } from '../screens/parent/SemaineScreen';
import { TableauBordScreen } from '../screens/parent/TableauBordScreen';
import { VerrouScreen } from '../screens/parent/VerrouScreen';
import { palette, typography } from '../theme';
import type { EnfantTabParamList, ParentTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const EnfantTabs = createBottomTabNavigator<EnfantTabParamList>();
const ParentTabs = createBottomTabNavigator<ParentTabParamList>();

/** Icône d'onglet : un emoji suffit et évite de charger une police d'icônes. */
const tabIcon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );

const tabBarStyle = {
  height: 68,
  paddingBottom: 10,
  paddingTop: 6,
  borderTopColor: palette.bordure,
};

function EspaceEnfant() {
  return (
    <EnfantTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.bleu,
        tabBarInactiveTintColor: palette.texteDoux,
        tabBarLabelStyle: typography.minuscule,
        tabBarStyle,
      }}
    >
      <EnfantTabs.Screen
        name="Jouer"
        component={AccueilEnfantScreen}
        options={{ tabBarIcon: tabIcon('🎮') }}
      />
      <EnfantTabs.Screen
        name="Medailles"
        component={MedaillesScreen}
        options={{ title: 'Médailles', tabBarIcon: tabIcon('🏅') }}
      />
      <EnfantTabs.Screen name="Moi" component={MoiScreen} options={{ tabBarIcon: tabIcon('🙂') }} />
    </EnfantTabs.Navigator>
  );
}

function EspaceParent() {
  return (
    <ParentTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.bleuFonce,
        tabBarInactiveTintColor: palette.texteDoux,
        tabBarLabelStyle: typography.minuscule,
        tabBarStyle,
      }}
    >
      <ParentTabs.Screen
        name="TableauBord"
        component={TableauBordScreen}
        options={{ title: 'Tableau', tabBarIcon: tabIcon('📊') }}
      />
      <ParentTabs.Screen
        name="Semaine"
        component={SemaineScreen}
        options={{ tabBarIcon: tabIcon('🗓️') }}
      />
      <ParentTabs.Screen
        name="Analyse"
        component={AnalyseScreen}
        options={{ tabBarIcon: tabIcon('🔍') }}
      />
      <ParentTabs.Screen
        name="Contenus"
        component={ContenusScreen}
        options={{ tabBarIcon: tabIcon('📦') }}
      />
    </ParentTabs.Navigator>
  );
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.fond,
    card: palette.fondCarte,
    text: palette.texte,
    primary: palette.bleu,
    border: palette.bordure,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Enfant" component={EspaceEnfant} />
        <Stack.Screen
          name="ChoisirSujet"
          component={ChoisirSujetScreen}
          options={{ headerShown: true, title: 'Choisir un sujet' }}
        />
        <Stack.Screen
          name="Jeu"
          component={JeuScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen name="VerrouParent" component={VerrouScreen} />
        <Stack.Screen name="Parent" component={EspaceParent} />
        <Stack.Screen
          name="Reglages"
          component={ReglagesScreen}
          options={{ headerShown: true, title: 'Réglages' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
