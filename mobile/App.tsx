import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Child } from './src/api';
import { resolveLaunchRoutes } from './src/launch';
import AccountScreen from './src/screens/AccountScreen';
import AddChildScreen from './src/screens/AddChildScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import PayScreen from './src/screens/PayScreen';
import { colors } from './src/theme';

export type RootStack = {
  Login: undefined;
  Main: undefined;
  AddChild: undefined;
  Pay: { child: Child };
};

const Stack = createNativeStackNavigator<RootStack>();
const Tabs = createBottomTabNavigator();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  History: ['time', 'time-outline'],
  Account: ['person', 'person-outline'],
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarIcon: ({ focused, color }) => <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={22} color={color} />,
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Account" component={AccountScreen} />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [routes, setRoutes] = useState<{ name: string; params?: object }[] | null>(null);

  useEffect(() => {
    resolveLaunchRoutes().then(setRoutes);
  }, []);

  if (!routes) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer
        initialState={{ index: routes.length - 1, routes }}
        theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } }}
      >
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, headerTitleAlign: 'center' }}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Add Child' }} />
          <Stack.Screen name="Pay" component={PayScreen} options={({ route }) => ({ title: route.params.child.alias_name })} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
