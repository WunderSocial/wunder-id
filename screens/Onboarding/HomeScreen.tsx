import React, { useState, useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderButton from '@components/WunderButton';
import WunderInput from '@components/WunderInput';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { resetAppState } from '@lib/reset';

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 5 * 60 * 1000;
const DISPLAY_DURATION_MS = 60 * 1000;

const HomeScreen = () => {
  const pinInputRef = useRef<PinInputRef>(null);

  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [lockedOutUntil, setLockedOutUntil] = useState<number | undefined>(undefined);
  const [isRevealing, setIsRevealing] = useState(false);
  const [biometricTried, setBiometricTried] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

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
    if (seedPhrase) {
      setRevealCountdown(DISPLAY_DURATION_MS / 1000);
      const interval = setInterval(() => {
        setRevealCountdown(prev => {
          if (prev && prev > 1) return prev - 1;
          clearInterval(interval);
          setSeedPhrase('');
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [seedPhrase]);

  useEffect(() => {
    if (isRevealing && !showPinInput && !showPasswordInput && !biometricTried) {
      setBiometricTried(true);
      handleBiometric();
    }
  }, [isRevealing, showPinInput, showPasswordInput, biometricTried]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const revealSeedPhrase = async (method: 'biometric' | 'pin' | 'password') => {
    try {
      const encryptedSeed = await SecureStore.getItemAsync('encryptedSeed');
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

      const { decryptSeed } = await import('@lib/crypto');
      const decryptedSeed = await decryptSeed(encryptedSeed || '', key);
      setSeedPhrase(decryptedSeed);
      setIsRevealing(false);
      setShowPinInput(false);
      setShowPasswordInput(false);
      setEnteredPin('');
      setEnteredPassword('');
      setAttempts(0);
      setPasswordAttempts(0);
    } catch (err) {
      console.error('Seed reveal error:', err);
      Alert.alert('Error', 'Failed to decrypt seed.');
    } finally {
      setBiometricTried(false);
    }
  };

  const handleBiometric = async () => {
    try {
      const enabled = await SecureStore.getItemAsync('biometricsEnabled');
      if (enabled === 'true') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to reveal seed phrase',
        });
        if (result.success) {
          await revealSeedPhrase('biometric');
        } else {
          Alert.alert('Biometric failed', 'You can try using your PIN instead.');
          setShowPinInput(true);
        }
      } else {
        setShowPinInput(true);
      }
    } catch (err) {
      Alert.alert('Biometric error', 'An error occurred during biometric auth.');
      setShowPinInput(true);
    } finally {
      setIsRevealing(false);
      setBiometricTried(false);
    }
  };

  const handlePinSubmit = async () => {
    await revealSeedPhrase('pin');
  };

  const handlePasswordSubmit = async () => {
    await revealSeedPhrase('password');
  };

  const handleReset = async () => {
    await resetAppState();
    Alert.alert('Reset complete', 'App data has been cleared. Restart the app.');
  };

  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <Text style={styles.heading}>Wunder ID</Text>

      {lockedOutUntil && Date.now() < lockedOutUntil && (
        <Text style={styles.lockedText}>
          You’re temporarily locked out. Please wait {lockoutCountdown !== null ? formatTime(lockoutCountdown) : '...'} and try again.
        </Text>
      )}

      {seedPhrase ? (
        <View>
          <Text style={styles.label}>Your Seed Phrase (hidden in {revealCountdown}s):</Text>
          <Text style={styles.seed}>{seedPhrase}</Text>
        </View>
      ) : (
        !showPinInput && !showPasswordInput && !isRevealing && (
          <View>
            <WunderButton
              title="Reveal Seed Phrase"
              onPress={() => setIsRevealing(true)}
              disabled={lockedOutUntil !== undefined && Date.now() < lockedOutUntil}
            />
          </View>
        )
      )}

      {isRevealing && !showPinInput && !showPasswordInput && (
        <Text style={styles.label}>Checking biometrics...</Text>
      )}

      {showPinInput && (
        <View>
          <Text style={styles.label}>Enter PIN:</Text>
          <PinInput ref={pinInputRef} value={enteredPin} onChange={setEnteredPin} />
          <WunderButton title="Submit PIN" onPress={handlePinSubmit} disabled={enteredPin.length !== 6} />
          {attempts > 0 && (
            <Text style={styles.attemptsText}>
              Incorrect attempts: {attempts} / {MAX_ATTEMPTS}
            </Text>
          )}
        </View>
      )}

      {showPasswordInput && (
        <View>
          <WunderInput
            label="Enter Password"
            placeholder="Enter your password"
            value={enteredPassword}
            onChangeText={setEnteredPassword}
            secureTextEntry
          />
          <WunderButton title="Submit Password" onPress={handlePasswordSubmit} disabled={!enteredPassword} />
          {passwordAttempts > 0 && (
            <Text style={styles.attemptsText}>
              Incorrect attempts: {passwordAttempts} / {MAX_ATTEMPTS}
            </Text>
          )}
        </View>
      )}

      <View style={{ marginTop: 40 }}>
        <WunderButton title="Reset Identity" onPress={handleReset} />
      </View>
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
  label: {
    color: 'lightgray',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  seed: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 16,
    textAlign: 'center',
  },
  lockedText: {
    color: 'orange',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  attemptsText: {
    color: 'red',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
