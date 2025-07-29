import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import OnboardingStack from './OnboardingStack';
import SplashScreen from '@screens/SplashScreen';
import HomeScreen from '@screens/Main/HomeScreen';
import EnterPinScreen from '@screens/Onboarding/EnterPinScreen';
import WalletScreen from '@screens/Main/WalletScreen';
import ProfileScreen from '@screens/Main/ProfileScreen';
import TermsScreen from '@screens/Settings/TermsScreen';
import SettingsScreen from '@screens/Settings/SettingsScreen';
import SecurityScreen from '@screens/Settings/SecurityScreen';
import RemoveAccountScreen from '@screens/Settings/RemoveAccountScreen';
import MenuScreen from '@screens/Main/MenuScreen';
import CredentialEditorScreen from '@screens/Main/CredentialEditorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="EnterPin" component={EnterPinScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="RemoveAccount" component={RemoveAccountScreen} />
        <Stack.Screen name="CredentialEditor" component={CredentialEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
