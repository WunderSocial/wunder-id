import React, { useState } from 'react';
import { Text, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import * as Bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getDeviceFingerprint } from '@lib/device/getDeviceFingerprint';
import * as Notifications from 'expo-notifications';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'RestoreWithSeed'>;

const RestoreWithSeedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const convex = useConvex();

  const registerDevice = useMutation(api.functions.mobile.registerDevice.registerDevice);

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      setError('');

      const cleaned = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
      const words = cleaned.split(' ');

      if (words.length !== 12 && words.length !== 24) {
        Alert.alert('Invalid Seed Phrase', 'Your seed phrase must be 12 or 24 words.');
        return;
      }

      if (!Bip39.validateMnemonic(cleaned, wordlist)) {
        Alert.alert('Invalid Seed Phrase', 'Please check for spelling errors or missing words.');
        return;
      }

      const hdNode = ethers.Wallet.fromPhrase(cleaned);
      const walletAddress = hdNode.address.toLowerCase();

      const user = await convex.query(api.functions.mobile.getUserByWallet.getUserByWallet, { walletAddress });
      if (!user) {
        Alert.alert('No Account Found', 'We couldn’t find an account with that seed phrase.');
        return;
      }
      await SecureStore.setItemAsync('convexUserId', user._id);
      await SecureStore.setItemAsync('wunderId', `${user.username}.wunder.id`);

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Push notification permissions not granted');

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'be8ba44e-58cc-4d2c-8236-276f1a48d7cb',
      });
      const pushToken = tokenData.data;
      await SecureStore.setItemAsync('pushToken', pushToken);

      const fingerprint = await getDeviceFingerprint();
      const hashedFingerprint = bytesToHex(sha256(fingerprint));
      await SecureStore.setItemAsync('hashedDeviceFingerprint', hashedFingerprint);

      await registerDevice({
        userId: user._id,
        deviceId: hashedFingerprint,
        deviceType: Platform.OS,
        pushToken,
      });

      await SecureStore.setItemAsync('walletAddress', walletAddress);
      await SecureStore.setItemAsync('userId', user._id);
      await SecureStore.setItemAsync('restoredSeedPhrase', cleaned);
      await SecureStore.setItemAsync('isRestoring', 'true');

      navigation.replace('PasswordSetup');
    } catch (err) {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BodyContainer
      header={<HeaderContainer><Logo /></HeaderContainer>}
      footer={
        <WunderButton
          title={isLoading ? 'Restoring...' : 'Restore Account'}
          onPress={handleRestore}
          disabled={isLoading}
        />
      }
    >
      <Text style={styles.heading}>Enter Your Seed Phrase</Text>
      <Text style={styles.subheading}>
        Type or paste your 12- or 24-word recovery phrase below.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="your seed phrase..."
        placeholderTextColor="#888"
        multiline
        numberOfLines={5}
        value={seedPhrase}
        onChangeText={setSeedPhrase}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    color: 'lightgray',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default RestoreWithSeedScreen;
