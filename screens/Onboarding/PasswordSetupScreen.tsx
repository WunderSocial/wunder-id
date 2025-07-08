import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import * as bip39 from 'bip39';
import { encryptSeed } from '@lib/crypto';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '@navigation/types';

const hashPassword = (password: string): string => {
  const encoded = new TextEncoder().encode(password);
  const hashed = sha256(encoded);
  return bytesToHex(hashed); 
};

const PasswordSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList, 'PasswordSetup'>>();
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
      const decryptionKey = randomBytes(32); // 256-bit key
      const decryptionKeyHex = bytesToHex(decryptionKey); // convert to string

      const encryptedSeed = await encryptSeed(mnemonic, decryptionKeyHex);
      const passwordHash = hashPassword(password);

      // Save required data
      await SecureStore.setItemAsync('encryptedSeed', encryptedSeed);
      await SecureStore.setItemAsync('passwordHash', passwordHash);
      await SecureStore.setItemAsync('decryptionKey', decryptionKeyHex); // ✅ Save the key
      await SecureStore.setItemAsync('mnemonic', mnemonic); // Dev only

      console.log('🔐 Password (raw):', password);
      console.log('🔑 Password Hash:', passwordHash);
      console.log('🧠 Mnemonic:', mnemonic);
      console.log('🔒 Encrypted Seed:', encryptedSeed);
      console.log('🗝️ Decryption Key (hex):', decryptionKeyHex);

      navigation.navigate('SetPin');
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
