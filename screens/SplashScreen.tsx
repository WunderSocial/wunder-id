import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types'; // use unified types file if possible

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const checkAuth = async () => {
      const encryptedSeed = await SecureStore.getItemAsync('encryptedSeed');
      const biometricsEnabled = await SecureStore.getItemAsync('biometricsEnabled');
      const storedPin = await SecureStore.getItemAsync('userPin');

//       await SecureStore.deleteItemAsync('walletAddress');
// await SecureStore.deleteItemAsync('encryptedSeed');
// await SecureStore.deleteItemAsync('encryptedPrivateKey');
// await SecureStore.deleteItemAsync('passwordHash');
// await SecureStore.deleteItemAsync('convexUserId');
// await SecureStore.deleteItemAsync('decryptionKey');
// await SecureStore.deleteItemAsync('wunderId');
// await SecureStore.deleteItemAsync('hashedDeviceFingerprint');
// await SecureStore.deleteItemAsync('restoredSeedPhrase');
// await SecureStore.deleteItemAsync('isRestoring');


      if (!encryptedSeed) {
        // No seed = new user; go to AccountChoice inside Onboarding stack
        navigation.replace('Onboarding', { screen: 'AccountChoice' });
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

      // Fallback to PIN entry if biometrics is off or fails
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
