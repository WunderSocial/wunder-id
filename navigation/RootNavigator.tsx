import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import OnboardingStack from './OnboardingStack';

const RootNavigator = () => {
  const isUserSignedIn = false; // later, make this dynamic

  return (
    <NavigationContainer>
      {isUserSignedIn ? (
        // Add MainAppStack later
        <></>
      ) : (
        <OnboardingStack />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;

