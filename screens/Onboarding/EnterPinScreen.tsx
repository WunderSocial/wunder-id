import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, OnboardingStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'EnterPin'>;

const MAX_ATTEMPTS = 3;

const EnterPinScreen = ({ navigation }: Props) => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [enteredPin, setEnteredPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pinInputRef = useRef<PinInputRef>(null);

  const handleSubmit = async () => {
    const storedPinHash = await SecureStore.getItemAsync('userPinHash');
    const enteredPinHash = bytesToHex(sha256(enteredPin));

    if (enteredPinHash === storedPinHash) {
      rootNavigation.replace('Main');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setEnteredPin('');
      pinInputRef.current?.triggerShake();
      pinInputRef.current?.focusFirst();

      if (newAttempts >= MAX_ATTEMPTS) {
        Alert.alert(
          'Too many attempts',
          'You’ve entered the wrong PIN too many times. Please use your password to reset your wallet.'
        );
      } else {
        Alert.alert('Incorrect PIN', 'Please try again.');
      }
    }
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Enter your PIN</Text>
      <PinInput
        ref={pinInputRef}
        value={enteredPin}
        onChange={setEnteredPin}
      />
      <WunderButton
        title="Unlock"
        onPress={handleSubmit}
        disabled={enteredPin.length !== 6}
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

export default EnterPinScreen;
