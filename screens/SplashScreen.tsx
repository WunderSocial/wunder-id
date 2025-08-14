import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import CustomLoader from '@components/CustomLoader';
import { useConvex } from 'convex/react';
import { api } from 'convex/_generated/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  const convex = useConvex();

  useEffect(() => {
    const checkAuth = async () => {
      const accountComplete = await SecureStore.getItemAsync('accountComplete');

      if (!accountComplete) {
        await resetAndNavigate();
        return;
      }

      let walletAddress = await SecureStore.getItemAsync('walletAddress');

      if (!walletAddress) {
        await resetAndNavigate();
        return;
      }

      // Normalize to lowercase
      walletAddress = walletAddress.toLowerCase();

      try {
        const user = await convex.query(
          api.functions.mobile.getUserByWallet.getUserByWallet,
          { walletAddress }
        );

        if (!user || !user._id) {
          showResetAlert();
          return;
        }
      } catch (err) {
        showResetAlert();
        return;
      }

      const biometricsEnabled = await SecureStore.getItemAsync('biometricsEnabled');

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

    const resetAndNavigate = async () => {
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
      ];

      await Promise.all(keysToPurge.map((key) => SecureStore.deleteItemAsync(key)));
      navigation.replace('Onboarding', { screen: 'AccountChoice' });
    };

    const showResetAlert = () => {
      Alert.alert(
        'Account Error',
        'We couldn’t find your Wunder ID. Please reset the app and start again.',
        [
          {
            text: 'Reset App',
            onPress: resetAndNavigate,
            style: 'destructive',
          },
        ]
      );
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <CustomLoader />
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
