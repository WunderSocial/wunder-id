import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import RevealWalletDetails from '@components/Main/RevealWalletDetails';
import { decryptSeed } from '@lib/crypto';
import ScrollableContainer from '@components/ScrollableContainer';
import LoggedInHeader from '@components/LoggedInHeader';
import FooterMenu from '@components/FooterMenu';

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 5 * 60 * 1000;
const DISPLAY_DURATION_MS = 60;

const SecurityScreen = () => {
  const pinInputRef = useRef<PinInputRef>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [lockedOutUntil, setLockedOutUntil] = useState<number | undefined>(undefined);
  const [isRevealing, setIsRevealing] = useState(false);
  const [biometricTried, setBiometricTried] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (lockedOutUntil && Date.now() > lockedOutUntil) {
      setLockedOutUntil(undefined);
      setAttempts(0);
      setPasswordAttempts(0);
      setLockoutCountdown(null);
    } else if (lockedOutUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, lockedOutUntil - Date.now());
        setLockoutCountdown(Math.ceil(remaining / 1000));
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedOutUntil]);

  useEffect(() => {
    if (seedPhrase || privateKey) {
      setRevealCountdown(DISPLAY_DURATION_MS);
      const interval = setInterval(() => {
        setRevealCountdown(prev => {
          if (prev && prev > 1) return prev - 1;
          clearInterval(interval);
          setSeedPhrase('');
          setPrivateKey('');
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [seedPhrase, privateKey]);

  useEffect(() => {
    if (isRevealing && !showPinInput && !showPasswordInput && !biometricTried) {
      setBiometricTried(true);
      handleBiometric();
    }
  }, [isRevealing, showPinInput, showPasswordInput, biometricTried]);

  useEffect(() => {
    if (showPinInput && enteredPin.length === 6) {
      revealSecrets('pin');
    }
  }, [enteredPin]);

  const handleBiometric = async () => {
    try {
      const enabled = await SecureStore.getItemAsync('biometricsEnabled');
      if (enabled === 'true') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to reveal wallet details',
        });
        if (result.success) {
          await revealSecrets('biometric');
        } else {
          Alert.alert('Biometric failed', 'Try using your PIN.');
          setShowPinInput(true);
        }
      } else {
        setShowPinInput(true);
      }
    } catch {
      Alert.alert('Biometric error', 'Error during biometric auth.');
      setShowPinInput(true);
    } finally {
      setIsRevealing(false);
      setBiometricTried(false);
    }
  };

  const revealSecrets = async (method: 'biometric' | 'pin' | 'password') => {
    try {
      const encryptedSeed = await SecureStore.getItemAsync('encryptedSeed');
      const encryptedPrivateKey = await SecureStore.getItemAsync('encryptedPrivateKey');
      let key = '';

      if (method === 'biometric') {
        const biometricKey = await SecureStore.getItemAsync('biometricEncryptionKey');
        if (!biometricKey) throw new Error('Biometric key not found');
        key = biometricKey;
      } else if (method === 'pin') {
        const enteredPinHash = bytesToHex(sha256(enteredPin));
        const storedPinHash = await SecureStore.getItemAsync('userPinHash');
        if (enteredPinHash !== storedPinHash) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setEnteredPin('');
          pinInputRef.current?.focusFirst();
          pinInputRef.current?.triggerShake();
          if (newAttempts >= MAX_ATTEMPTS) {
            setShowPinInput(false);
            setShowPasswordInput(true);
          }
          return;
        }
        const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
        if (!decryptionKey) throw new Error('Missing decryption key');
        key = decryptionKey;
      } else if (method === 'password') {
        const enteredPasswordHash = bytesToHex(sha256(enteredPassword));
        const storedPasswordHash = await SecureStore.getItemAsync('passwordHash');
        if (enteredPasswordHash !== storedPasswordHash) {
          const newPassAttempts = passwordAttempts + 1;
          setPasswordAttempts(newPassAttempts);
          setEnteredPassword('');
          if (newPassAttempts >= MAX_ATTEMPTS) {
            setLockedOutUntil(Date.now() + TIMEOUT_MS);
            setShowPasswordInput(false);
          }
          return;
        }
        const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
        if (!decryptionKey) throw new Error('Missing decryption key');
        key = decryptionKey;
      }

      const decryptedSeed = await decryptSeed(encryptedSeed || '', key);
      const decryptedPrivateKey = await decryptSeed(encryptedPrivateKey || '', key);

      setSeedPhrase(decryptedSeed);
      setPrivateKey(decryptedPrivateKey);
      setIsRevealing(false);
      setShowPinInput(false);
      setShowPasswordInput(false);
      setEnteredPin('');
      setEnteredPassword('');
      setAttempts(0);
      setPasswordAttempts(0);
    } catch (err) {
      console.error('Secret reveal error:', err);
      Alert.alert('Error', 'Failed to decrypt identity data.');
    } finally {
      setBiometricTried(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <View style={styles.content}>
          <Text style={styles.heading}>Security & Recovery</Text>
          {revealCountdown === null && (
            <>
              <Text style={styles.paragraph}>
                Your seed phrase and secret key are essential for account recovery. Never share them with anyone. Do not store them on your phone or take screenshots.
              </Text>
              <Text style={styles.paragraph}>
                Store them safely offline (e.g., written on paper or in a secure vault). If someone gains access to these, they can control your entire identity.
              </Text>
            </>
          )}


          {(!showPinInput && !showPasswordInput && !lockoutCountdown && !revealCountdown) && (
            <WunderButton
              style={styles.wunderBtn}
              title="Reveal Seed Phrase & Secret Key"
              onPress={() => {
                setIsRevealing(true);
                setSeedPhrase('');
                setPrivateKey('');
                setShowPinInput(false);
                setShowPasswordInput(false);
                setEnteredPin('');
                setEnteredPassword('');
              }}
            />
          )}

          <RevealWalletDetails
            revealCountdown={revealCountdown}
            seedPhrase={seedPhrase}
            privateKey={privateKey}
            showPinInput={showPinInput}
            showPasswordInput={showPasswordInput}
            enteredPin={enteredPin}
            enteredPassword={enteredPassword}
            pinInputRef={pinInputRef}
            lockoutCountdown={lockoutCountdown}
            setEnteredPin={setEnteredPin}
            setEnteredPassword={setEnteredPassword}
            revealSecrets={revealSecrets}
            formatTime={formatTime}
          />
        </View>
      </ScrollableContainer>
      <FooterMenu />
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
  wunderBtn: {
    marginTop: 40,
  },
});

export default SecurityScreen;
