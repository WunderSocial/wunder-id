import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import UsernameScreen from '@screens/Onboarding/UsernameScreen';
import PasswordSetupScreen from '@screens/Onboarding/PasswordSetupScreen';
import SetPinScreen from '@screens/Onboarding/SetPinScreen';
import ConfirmPinScreen from '@screens/Onboarding/ConfirmPinScreen';
import HomeScreen from '@screens/Onboarding/HomeScreen';
import SplashScreen from '@screens/SplashScreen';
import EnterPinScreen from '@screens/Onboarding/EnterPinScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Username" component={UsernameScreen} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="EnterPin" component={EnterPinScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

