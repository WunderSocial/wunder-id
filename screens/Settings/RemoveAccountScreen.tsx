import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ToastAndroid,
  Modal,
  Alert,
} from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import WunderButton from '@components/WunderButton';
import PinInput, { PinInputRef } from '@components/PinInput';
import { resetAppState } from '@lib/reset';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import type { Id } from 'convex/_generated/dataModel';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RemoveAccount'>;

const RemoveAccountScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const pinInputRef = useRef<PinInputRef>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  const deregisterDevice = useMutation(api.deregisterDevice.deregisterDevice);

  const handleReset = async () => {
    setShowPinModal(true);
  };

  const confirmReset = async (pin: string) => {
  try {
    const enteredPinHash = bytesToHex(sha256(pin));
    const storedPinHash = await SecureStore.getItemAsync('userPinHash');

    if (enteredPinHash !== storedPinHash) {
      pinInputRef.current?.triggerShake();
      setEnteredPin('');
      pinInputRef.current?.focusFirst();
      return;
    }

    setShowPinModal(false);
    ToastAndroid.show('Removing your account...', ToastAndroid.LONG);

    const hashedFingerprint = await SecureStore.getItemAsync('hashedDeviceFingerprint');
    const convexUserId = await SecureStore.getItemAsync('convexUserId');

    if (!hashedFingerprint || !convexUserId) {
      throw new Error('Missing required secure values');
    }

    await deregisterDevice({
      userId: convexUserId as Id<'users'>,
      hashedFingerprint,
    });

    const keysToDelete = [
      'walletAddress',
      'encryptedSeed',
      'encryptedPrivateKey',
      'passwordHash',
      'convexUserId',
      'userId',
      'decryptionKey',
      'wunderId',
      'hashedDeviceFingerprint',
      'restoredSeedPhrase',
      'isRestoring',
      'pushToken',
      'userPinHash',
      'biometricsEnabled',
      'biometricEncryptionKey',
    ];

    await Promise.all(
      keysToDelete.map(async (key) => {
        await SecureStore.deleteItemAsync(key);
      })
    );

    setTimeout(() => {
      resetAppState();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Splash' }],
      });
    }, 3000);
  } catch (err) {
    Alert.alert('Error', String(err));
  }
};

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <View style={styles.content}>
          <Text style={styles.heading}>Remove Account</Text>
          <Text style={styles.paragraph}>
            Before removing your account from this device, make sure you’ve securely saved your Seed Phrase and Secret Key.
          </Text>
          <Text style={styles.paragraph}>
            These are essential for restoring your identity on another device. If you lose them, you won’t be able to recover your account.
          </Text>

          <Pressable onPress={() => navigation.navigate('Security')}>
            <Text style={styles.link}>Go to Security Page to view your Seed Phrase</Text>
          </Pressable>

          <View style={styles.resetButtonContainer}>
            <WunderButton title="Remove Account" onPress={handleReset} />
          </View>
        </View>
      </ScrollableContainer>
      <FooterMenu />

      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter PIN to Confirm</Text>
            <PinInput
              ref={pinInputRef}
              value={enteredPin}
              onChange={(val) => {
                setEnteredPin(val);
                if (val.length === 6) {
                  confirmReset(val);
                }
              }}
            />
            <WunderButton
              title="Cancel"
              variant="secondary"
              onPress={() => {
                setShowPinModal(false);
                setEnteredPin('');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  paragraph: {
    color: 'lightgray',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  link: {
    color: '#fff403',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    textDecorationLine: 'underline',
  },
  resetButtonContainer: {
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
});

export default RemoveAccountScreen;
