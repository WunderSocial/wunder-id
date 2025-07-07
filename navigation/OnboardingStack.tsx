import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsernameScreen from '@screens/Onboarding/UsernameScreen';

export type OnboardingStackParamList = {
  Username: undefined;
  // Add other onboarding screens here
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Username" component={UsernameScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

