import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import WunderButton from '@components/WunderButton';
import WunderInput from '@components/WunderInput';
import PinInput, { PinInputRef } from '@components/PinInput';
import { resetAppState } from '@lib/reset';

interface IdentityControlsProps {
  seedPhrase: string;
  privateKey: string;
  revealCountdown: number | null;
  showPinInput: boolean;
  pinInputRef: React.RefObject<PinInputRef>;
  enteredPin: string;
  onChangePin: (pin: string) => void;
  showPasswordInput: boolean;
  enteredPassword: string;
  onChangePassword: (val: string) => void;
  onSubmitPassword: () => void;
  lockoutCountdown: number | null;
  onPressReveal: () => void;
}

const IdentityControls: React.FC<IdentityControlsProps> = ({
  seedPhrase,
  privateKey,
  revealCountdown,
  showPinInput,
  pinInputRef,
  enteredPin,
  onChangePin,
  showPasswordInput,
  enteredPassword,
  onChangePassword,
  onSubmitPassword,
  lockoutCountdown,
  onPressReveal,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      <View style={{ marginTop: 20 }}>
        <WunderButton title="Reveal Wallet Details" onPress={onPressReveal} />
      </View>

      {revealCountdown !== null && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Seed Phrase:</Text>
          <Text style={styles.seed}>{seedPhrase}</Text>
          <Text style={styles.label}>Private Key:</Text>
          <Text style={styles.seed}>{privateKey}</Text>
          <Text style={styles.label}>
            Auto-hiding in {revealCountdown}s
          </Text>
        </View>
      )}

      {showPinInput && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Enter PIN:</Text>
          <PinInput
            ref={pinInputRef}
            value={enteredPin}
            onChange={onChangePin}
          />
        </View>
      )}

      {showPasswordInput && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Enter Password:</Text>
          <WunderInput
            value={enteredPassword}
            onChangeText={onChangePassword}
            placeholder="Password"
            secureTextEntry
          />
          <WunderButton title="Submit" onPress={onSubmitPassword} />
        </View>
      )}

      {lockoutCountdown !== null && (
        <Text style={styles.label}>
          Locked out. Try again in {formatTime(lockoutCountdown)}
        </Text>
      )}

      <View style={{ marginTop: 20 }}>
        <WunderButton
          title="Reset Identity"
          onPress={() => {
            resetAppState();
            Alert.alert(
              'Reset complete',
              'App data has been cleared. Restart the app.'
            );
          }}
        />
      </View>
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
  seed: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 8,
    textAlign: 'center',
  },
});

export default IdentityControls;
