import React, { useState } from 'react';
import { Text, StyleSheet, Alert, Platform } from 'react-native';
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
import { HDNodeWallet } from 'ethers';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';

// 🔐 Helper to hash strings (password, fingerprint)
const hashString = (value: string): string => {
  const encoded = new TextEncoder().encode(value);
  return bytesToHex(sha256(encoded));
};

// 🔍 Get and hash device fingerprint
const getHashedDeviceFingerprint = async (): Promise<string> => {
  const androidId = Platform.OS === 'android' ? await Application.getAndroidId() : null;
  const iosId = Platform.OS === 'ios' ? await Application.getIosIdForVendorAsync() : null;
  const rawId = androidId || iosId || `${Device.osName}-${Device.modelName}`;
  return hashString(rawId);
};

const PasswordSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList, 'PasswordSetup'>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const registerUser = useMutation(api.registerUser.registerUser);
  const registerDevice = useMutation(api.registerDevice.registerDevice);

  const handleNext = async () => {
    console.log('➡️ handleNext triggered');
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // 🔐 Generate wallet
      const mnemonic = bip39.generateMnemonic();
      const decryptionKey = randomBytes(32);
      const decryptionKeyHex = bytesToHex(decryptionKey);
      const encryptedSeed = await encryptSeed(mnemonic, decryptionKeyHex);
      const passwordHash = hashString(password);

      const wallet = HDNodeWallet.fromPhrase(mnemonic);
      const walletAddress = wallet.address;
      const privateKey = wallet.privateKey;
      const encryptedPrivateKey = await encryptSeed(privateKey, decryptionKeyHex);

      // 💾 Store local secrets
      await SecureStore.setItemAsync('encryptedSeed', encryptedSeed);
      await SecureStore.setItemAsync('encryptedPrivateKey', encryptedPrivateKey);
      await SecureStore.setItemAsync('passwordHash', passwordHash);
      await SecureStore.setItemAsync('decryptionKey', decryptionKeyHex);
      await SecureStore.setItemAsync('walletAddress', walletAddress);
      await SecureStore.setItemAsync('mnemonic', mnemonic); // dev only

      // 🔍 Get stored username
      const storedWunderId = await SecureStore.getItemAsync('wunderId');
      if (!storedWunderId) throw new Error('Missing username (wunderId)');
      const username = storedWunderId.replace('.wunderid.eth', '');

      // 🧠 Register user
      const userId = await registerUser({ username, walletAddress });
      await SecureStore.setItemAsync('convexUserId', userId);

      // 📱 Register push token
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Push notification permissions not granted');

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'be8ba44e-58cc-4d2c-8236-276f1a48d7cb',
      });
      const pushToken = tokenData.data;
      await SecureStore.setItemAsync('pushToken', pushToken);

      // 🔐 Get and store hashed device fingerprint
      const fingerprint = await getHashedDeviceFingerprint();
      await SecureStore.setItemAsync('hashedDeviceFingerprint', fingerprint);

      // 📦 Register device with Convex
      await registerDevice({
        userId,
        deviceId: fingerprint,
        deviceType: Platform.OS,
        pushToken,
      });

      console.log('✅ Registered user and device with Convex');
      navigation.navigate('SetPin');
    } catch (error) {
      console.error('❌ Error in handleNext:', error);
      Alert.alert('Something went wrong', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BodyContainer
      header={<HeaderContainer><Logo /></HeaderContainer>}
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
