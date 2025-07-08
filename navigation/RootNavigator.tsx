import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@screens/SplashScreen';
import OnboardingStack from './OnboardingStack';
import HomeScreen from '@screens/Onboarding/HomeScreen'; // if you already have it
import EnterPinScreen from '@screens/Onboarding/EnterPinScreen'; // if needed

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  EnterPin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EnterPin" component={EnterPinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
