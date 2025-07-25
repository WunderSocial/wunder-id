import * as SecureStore from 'expo-secure-store';

export const resetAppState = async () => {
  try {
    await SecureStore.deleteItemAsync('encryptedSeed');
    await SecureStore.deleteItemAsync('userPin');
    await SecureStore.deleteItemAsync('biometricsEnabled');
  } catch (error) {
  }
}; 