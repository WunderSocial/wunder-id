import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsernameScreen from '@screens/Onboarding/UsernameScreen';
import PasswordSetupScreen from '@screens/Onboarding/PasswordSetupScreen';

export type OnboardingStackParamList = {
  Username: undefined;
  PasswordSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Username" component={UsernameScreen} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

