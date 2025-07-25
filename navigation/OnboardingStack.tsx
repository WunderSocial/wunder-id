import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import UsernameScreen from '@screens/Onboarding/UsernameScreen';
import PasswordSetupScreen from '@screens/Onboarding/PasswordSetupScreen';
import SetPinScreen from '@screens/Onboarding/SetPinScreen';
import ConfirmPinScreen from '@screens/Onboarding/ConfirmPinScreen';
import SplashScreen from '@screens/SplashScreen';
import EnterPinScreen from '@screens/Onboarding/EnterPinScreen';
import AccountChoiceScreen from '@screens/Onboarding/AccountChoiceScreen';
import RestoreAccountScreen from '@screens/Onboarding/RestoreAccountScreen';
import RestoreWithSeedScreen from '@screens/Onboarding/RestoreWithSeedScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountChoice" component={AccountChoiceScreen} />
      <Stack.Screen name="Username" component={UsernameScreen} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <Stack.Screen name="RestoreAccount" component={RestoreAccountScreen} />
      <Stack.Screen name="RestoreWithSeed" component={RestoreWithSeedScreen} />
      <Stack.Screen name="EnterPin" component={EnterPinScreen} />
      <Stack.Screen name="Splash" component={SplashScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
