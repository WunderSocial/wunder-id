import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/types';
import { RootStackParamList } from '@navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const checkAuth = async () => {
      const encryptedSeed = await SecureStore.getItemAsync('encryptedSeed');
      const biometricsEnabled = await SecureStore.getItemAsync('biometricsEnabled');
      const storedPin = await SecureStore.getItemAsync('userPin');

      if (!encryptedSeed) {
        // No seed? Start onboarding
        navigation.replace('Onboarding');
        return;
      }

      if (biometricsEnabled === 'true') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Log in with Face ID / Touch ID',
        });

        if (result.success) {
          navigation.replace('Home');
          return;
        }
      }

      // Otherwise fallback to PIN entry
      navigation.replace('EnterPin');
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff403" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;
