import React, { useState, useRef } from 'react';
import { Text, Alert, StyleSheet } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import {
  OnboardingStackParamList,
  RootStackParamList,
} from '@navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { encryptSeed } from '@lib/crypto';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import type { Id } from '../../convex/_generated/dataModel';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ConfirmPin'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const ConfirmPinScreen = ({ route, navigation }: Props) => {
  const rootNavigation = useNavigation<RootNav>();
  const pinInputRef = useRef<PinInputRef>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  const { pin: originalPin } = route.params;
  const issueCredential = useMutation(api.credentials.issueCredential);

  const handleCreateWunderIdAndWalletCreds = async (
    userId: Id<'users'>,
    decryptionKey: string
  ) => {
    try {
      const wunderIdRaw = await SecureStore.getItemAsync('wunderId');
      const walletAddress = await SecureStore.getItemAsync('walletAddress');

      if (!wunderIdRaw || !walletAddress) {
        throw new Error('Missing wunderId or walletAddress in storage');
      }

      const username = wunderIdRaw.includes('@')
        ? wunderIdRaw.split('@')[0]
        : wunderIdRaw;

      const wunderIdContent = JSON.stringify({
        wunderId: `${username}@wunder`,
      });

      const encryptedWunderId = await encryptSeed(wunderIdContent, decryptionKey);

      const walletContent = JSON.stringify({ walletAddress });
      const encryptedWalletAddress = await encryptSeed(walletContent, decryptionKey);

      await issueCredential({
        userId,
        type: CREDENTIAL_TYPES.WUNDER_ID,
        content: encryptedWunderId,
      });

      await issueCredential({
        userId,
        type: CREDENTIAL_TYPES.WALLET_ADDRESS,
        content: encryptedWalletAddress,
      });
    } catch (error) {
      console.error('Failed to create WunderID and Wallet Address credentials:', error);
      Alert.alert('Error', 'Failed to create WunderID and Wallet Address credentials.');
      throw error;
    }
  };

  const handleConfirm = async () => {
    if (confirmPin !== originalPin) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setConfirmPin('');
      pinInputRef.current?.focusFirst();
      pinInputRef.current?.triggerShake();

      if (newAttemptCount >= 3) {
        Alert.alert('Too many attempts', 'Let’s try again from the beginning.');
        navigation.replace('SetPin');
        return;
      }

      Alert.alert('Error', 'PINs do not match. Please try again.');
      return;
    }

    try {
      const hashedPin = bytesToHex(sha256(confirmPin));
      await SecureStore.setItemAsync('userPinHash', hashedPin);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get userId and decryptionKey and cast userId correctly
      const userIdStr = await SecureStore.getItemAsync('convexUserId');
      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');

      if (!userIdStr || !decryptionKey) throw new Error('Missing userId or decryptionKey');

      const userId = userIdStr as unknown as Id<'users'>;

      // Create WunderID and Wallet Address credentials
      await handleCreateWunderIdAndWalletCreds(userId, decryptionKey);

      if (hasHardware && isEnrolled) {
        Alert.alert(
          'Enable Face ID / Touch ID?',
          'Would you like to enable biometric login for faster access?',
          [
            {
              text: 'No',
              onPress: async () => {
                await SecureStore.setItemAsync('accountComplete', 'true');
                rootNavigation.replace('Home');
              },
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Authenticate to enable biometrics',
                });

                if (result.success) {
                  await SecureStore.setItemAsync('biometricsEnabled', 'true');
                  await SecureStore.setItemAsync('biometricEncryptionKey', decryptionKey);
                } else {
                  await SecureStore.deleteItemAsync('biometricsEnabled');
                  await SecureStore.deleteItemAsync('biometricEncryptionKey');
                }

                await SecureStore.setItemAsync('accountComplete', 'true');
                rootNavigation.replace('Home');
              },
            },
          ]
        );
      } else {
        await SecureStore.setItemAsync('accountComplete', 'true');
        rootNavigation.replace('Home');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save PIN securely or create credentials');
      console.error(err);
    }
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Confirm your PIN</Text>
      <PinInput
        ref={pinInputRef}
        value={confirmPin}
        onChange={setConfirmPin}
      />
      <WunderButton
        title="Confirm"
        onPress={handleConfirm}
        disabled={confirmPin.length !== 6}
      />
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default ConfirmPinScreen;
