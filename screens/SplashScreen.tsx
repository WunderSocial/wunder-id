import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const checkAuth = async () => {
      const accountComplete = await SecureStore.getItemAsync('accountComplete');

      if (!accountComplete) {
        // Account not completed – wipe all known secure items
        const keysToPurge = [
          'walletAddress',
          'encryptedSeed',
          'encryptedPrivateKey',
          'passwordHash',
          'convexUserId',
          'userId',
          'decryptionKey',
          'wunderId',
          'hashedDeviceFingerprint',
          'restoredSeedPhrase',
          'isRestoring',
          'pushToken',
          'userPinHash',
          'biometricsEnabled',
          'biometricEncryptionKey',
          'accountComplete', // clean this too just in case
        ];

        await Promise.all(keysToPurge.map((key) => SecureStore.deleteItemAsync(key)));

        navigation.replace('Onboarding', { screen: 'AccountChoice' });
        return;
      }

      const encryptedSeed = await SecureStore.getItemAsync('encryptedSeed');
      const biometricsEnabled = await SecureStore.getItemAsync('biometricsEnabled');

      if (!encryptedSeed) {
        navigation.replace('Onboarding', { screen: 'AccountChoice' });
        return;
      }

      if (biometricsEnabled === 'true') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Log in with Face ID / Touch ID',
        });

        if (result.success) {
          navigation.replace('Main');
          return;
        }
      }

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
