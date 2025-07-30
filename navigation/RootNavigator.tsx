import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import OnboardingStack from './OnboardingStack';
import SplashScreen from '@screens/SplashScreen';
import EnterPinScreen from '@screens/Onboarding/EnterPinScreen';
import MainDrawerNavigator from './MenuDrawerNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        {/* The drawer navigator wraps all logged-in screens */}
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
        <Stack.Screen name="EnterPin" component={EnterPinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
