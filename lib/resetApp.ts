// lib/resetApp.ts
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export const handleAppReset = async (navigation: any) => {
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
    'accountComplete',
    'jwt',
  ];

  await Promise.all(keysToPurge.map((key) => SecureStore.deleteItemAsync(key)));

  navigation.reset({
    index: 0,
    routes: [{ name: 'Splash' }],
  });
};
