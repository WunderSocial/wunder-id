import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsernameScreen from '@screens/Onboarding/UsernameScreen';

export type OnboardingStackParamList = {
  Username: undefined;
  PasswordSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Username" component={UsernameScreen} />
      <Stack.Screen name="PasswordSetup" component={() => null} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

