import React, { useState } from 'react';
import { Text, Alert, StyleSheet } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ConfirmPin'>;

const ConfirmPinScreen = ({ navigation, route }: Props) => {
  const [confirmPin, setConfirmPin] = useState('');
  const { pin: originalPin } = route.params;

  const handleConfirm = async () => {
    if (confirmPin !== originalPin) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    try {
      await SecureStore.setItemAsync('userPin', confirmPin);

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
                  await SecureStore.setItemAsync('biometricsEnabled', 'true');
                } else {
                  await SecureStore.deleteItemAsync('biometricsEnabled');
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
      Alert.alert('Error', 'Failed to save PIN securely');
    }
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Confirm your PIN</Text>
      <PinInput value={confirmPin} onChange={setConfirmPin} />
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
