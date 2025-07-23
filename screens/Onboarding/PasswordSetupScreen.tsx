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
import type { Id } from 'convex/_generated/dataModel';


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
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const isRestoring = await SecureStore.getItemAsync('isRestoring');
      const passwordHash = hashString(password);
      const decryptionKey = randomBytes(32);
      const decryptionKeyHex = bytesToHex(decryptionKey);

      let walletAddress: string | null = null;
      let encryptedSeed: string | null = null;
      let encryptedPrivateKey: string | null = null;
      let userId: string | null = null;

      if (isRestoring === 'true') {
        // 🧠 Restore from stored seed
        const restoredSeed = await SecureStore.getItemAsync('restoredSeedPhrase');
        walletAddress = await SecureStore.getItemAsync('walletAddress');
        userId = await SecureStore.getItemAsync('userId');

        if (!restoredSeed || !walletAddress || !userId) {
          throw new Error('Missing restored data');
        }

        const wallet = HDNodeWallet.fromPhrase(restoredSeed);
        const privateKey = wallet.privateKey;

        encryptedSeed = await encryptSeed(restoredSeed, decryptionKeyHex);
        encryptedPrivateKey = await encryptSeed(privateKey, decryptionKeyHex);
      } else {
        // 🧠 Create new wallet
        const mnemonic = bip39.generateMnemonic();
        const wallet = HDNodeWallet.fromPhrase(mnemonic);
        const privateKey = wallet.privateKey;

        walletAddress = wallet.address;
        encryptedSeed = await encryptSeed(mnemonic, decryptionKeyHex);
        encryptedPrivateKey = await encryptSeed(privateKey, decryptionKeyHex);

        // 🔍 Get username
        const storedWunderId = await SecureStore.getItemAsync('wunderId');
        if (!storedWunderId) throw new Error('Missing username (wunderId)');
        const username = storedWunderId.replace('.wunderid.eth', '');

        // 📝 Register user
        userId = await registerUser({ username, walletAddress });
        await SecureStore.setItemAsync('convexUserId', userId);
      }

      // 💾 Store secrets (shared)
      await SecureStore.setItemAsync('encryptedSeed', encryptedSeed!);
      await SecureStore.setItemAsync('encryptedPrivateKey', encryptedPrivateKey!);
      await SecureStore.setItemAsync('passwordHash', passwordHash);
      await SecureStore.setItemAsync('decryptionKey', decryptionKeyHex);
      await SecureStore.setItemAsync('walletAddress', walletAddress!);

      // 📱 Register push token
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Push notification permissions not granted');

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'be8ba44e-58cc-4d2c-8236-276f1a48d7cb',
      });
      const pushToken = tokenData.data;
      await SecureStore.setItemAsync('pushToken', pushToken);

      // Only register device if this is not a restore
      if (isRestoring !== 'true') {
        const fingerprint = await getHashedDeviceFingerprint();
        await SecureStore.setItemAsync('hashedDeviceFingerprint', fingerprint);

        await registerDevice({
          userId: userId as Id<"users">,
          deviceId: fingerprint,
          deviceType: Platform.OS,
          pushToken,
        });
      }

      // ✅ Done
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
