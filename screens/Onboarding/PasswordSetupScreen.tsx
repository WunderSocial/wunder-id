import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import * as bip39 from 'bip39';
import { useNavigation } from '@react-navigation/native';
import { encryptSeed } from '@lib/crypto';

const PasswordSetupScreen = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
const handleNext = async () => {
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }

  try {
    setLoading(true);

    const mnemonic = bip39.generateMnemonic();
    const encryptedSeed = await encryptSeed(mnemonic, password);

    await SecureStore.setItemAsync('encryptedSeed', encryptedSeed);

    navigation.navigate('SetPin' as never);
  } catch (error) {
    console.error('Error in handleNext:', error);
    Alert.alert('Something went wrong', String(error));
  } finally {
    setLoading(false);
  }
};

  return (
    <BodyContainer
      header={
        <HeaderContainer>
          <Logo />
        </HeaderContainer>
      }
      footer={
        <WunderButton
          title="Continue"
          onPress={handleNext}
          disabled={!password || !confirmPassword}
          loading={loading}
        />
      }
    >
      <Text style={styles.heading}>Create a Password</Text>
      <WunderInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <WunderInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default PasswordSetupScreen;
