import React, { useRef, useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import { OnboardingStackParamList } from '@navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SetPin'>;

const SetPinScreen = ({ navigation }: Props) => {
  const [pin, setPin] = useState('');
  const pinInputRef = useRef<PinInputRef>(null);

  const handleNext = () => {
    if (pin.length < 6) {
      Alert.alert('PIN must be 6 digits');
      pinInputRef.current?.triggerShake();
      pinInputRef.current?.focusFirst();
      return;
    }

    navigation.navigate('ConfirmPin', { pin });
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Create a 6-digit PIN</Text>
      <PinInput
        ref={pinInputRef}
        value={pin}
        onChange={setPin}
      />
      <WunderButton
        title="Continue"
        onPress={handleNext}
        disabled={pin.length !== 6}
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
  },
});

export default SetPinScreen;
