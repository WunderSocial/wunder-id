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
import { OnboardingStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ConfirmPin'>;

const ConfirmPinScreen = ({ navigation, route }: Props) => {
  const pinInputRef = useRef<PinInputRef>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const { pin: originalPin } = route.params;

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

      if (hasHardware && isEnrolled) {
        Alert.alert(
          'Enable Face ID / Touch ID?',
          'Would you like to enable biometric login for faster access?',
          [
            {
              text: 'No',
              onPress: () => navigation.replace('Home'),
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Authenticate to enable biometrics',
                });

                if (result.success) {
                  const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
                  if (!decryptionKey) throw new Error('Missing decryption key');

                  await SecureStore.setItemAsync('biometricsEnabled', 'true');
                  await SecureStore.setItemAsync('biometricEncryptionKey', decryptionKey);
                } else {
                  await SecureStore.deleteItemAsync('biometricsEnabled');
                  await SecureStore.deleteItemAsync('biometricEncryptionKey');
                }

                navigation.replace('Home');
              },
            },
          ]
        );
      } else {
        navigation.replace('Home');
      }
    } catch (err) {
      console.error('PIN save error:', err);
      Alert.alert('Error', 'Failed to save PIN securely');
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
