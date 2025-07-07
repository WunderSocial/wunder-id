import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import { OnboardingStackParamList } from '@navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SetPin'>;

const SetPinScreen = ({ navigation }: Props) => {
  const [pin, setPin] = useState('');

  const handleNext = () => {
    if (pin.length < 6) {
      Alert.alert('PIN must be 6 digits');
      return;
    }
    navigation.navigate('ConfirmPin', { pin });
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Create a 6-digit PIN</Text>
      <PinInput value={pin} onChange={setPin} />
      <WunderButton title="Continue" onPress={handleNext} disabled={pin.length !== 6} />
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SetPinScreen;
