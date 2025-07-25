import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import PinInput, { PinInputRef } from '@components/PinInput';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';

interface RevealWalletDetailsProps {
  revealCountdown: number | null;
  seedPhrase: string;
  privateKey: string;
  showPinInput: boolean;
  showPasswordInput: boolean;
  enteredPin: string;
  enteredPassword: string;
  pinInputRef: React.RefObject<PinInputRef | null>;
  lockoutCountdown: number | null;
  setEnteredPin: (value: string) => void;
  setEnteredPassword: (value: string) => void;
  revealSecrets: (method: 'password') => void;
  formatTime: (s: number) => string;
}

const RevealWalletDetails: React.FC<RevealWalletDetailsProps> = ({
  revealCountdown,
  seedPhrase,
  privateKey,
  showPinInput,
  showPasswordInput,
  enteredPin,
  enteredPassword,
  pinInputRef,
  lockoutCountdown,
  setEnteredPin,
  setEnteredPassword,
  revealSecrets,
  formatTime,
}) => {
  const seedWords = seedPhrase.trim().split(' ');

  return (
    <>
      {revealCountdown !== null && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Auto-hiding in {revealCountdown}s</Text>
          <Text style={styles.label}>Seed Phrase:</Text>

          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(seedPhrase);
              Alert.alert('Copied', 'Seed phrase copied to clipboard');
            }}
            style={styles.seedContainer}
          >
            {Array.from({ length: 6 }).map((_, row) => (
              <View key={row} style={styles.seedRow}>
                {Array.from({ length: 2 }).map((_, col) => {
                  const i = row * 2 + col;
                  const word = seedWords[i] || '';
                  return (
                    <View key={i} style={styles.seedWordBox}>
                      <Text style={styles.seedIndex}>{i + 1}.</Text>
                      <Text style={styles.seedWord}>{word}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
            <Text style={styles.copyHint}>(Tap to copy)</Text>
          </Pressable>

          <Text style={styles.label}>Private Key:</Text>
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(privateKey);
              Alert.alert('Copied', 'Private key copied to clipboard');
            }}
            style={styles.privateKeyBox}
          >
            <Text style={styles.privateKeyText}>{privateKey}</Text>
            <Text style={styles.copyHint}>(Tap to copy)</Text>
          </Pressable>
        </View>
      )}

      {showPinInput && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Enter PIN:</Text>
          <PinInput
            ref={pinInputRef as React.RefObject<PinInputRef>}
            value={enteredPin}
            onChange={setEnteredPin}
          />
        </View>
      )}

      {showPasswordInput && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Enter Password:</Text>
          <WunderInput
            value={enteredPassword}
            onChangeText={setEnteredPassword}
            placeholder="Password"
            secureTextEntry
          />
          <WunderButton
            title="Submit"
            onPress={() => revealSecrets('password')}
          />
        </View>
      )}

      {lockoutCountdown !== null && (
        <Text style={styles.label}>
          Locked out. Try again in {formatTime(lockoutCountdown)}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    color: 'lightgray',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  seedContainer: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  seedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seedWordBox: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  seedIndex: {
    color: '#888',
    fontSize: 14,
    marginRight: 4,
  },
  seedWord: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privateKeyBox: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    marginBottom: 12,
  },
  privateKeyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  copyHint: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default RevealWalletDetails;
 