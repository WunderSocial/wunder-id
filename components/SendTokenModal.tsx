import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import WunderButton from '@components/WunderButton';

interface SendTokenModalProps {
  visible: boolean;
  selectedToken: 'ETH' | 'WUNDER';
  recipient: string;
  amount: string;
  ethBalance: string | null;
  wunderBalance: string | null;
  gasEstimate: string | null;
  txHash: string | null;
  isConfirming: boolean;
  sending: boolean;
  onSelectToken: (token: 'ETH' | 'WUNDER') => void;
  onChangeRecipient: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onEstimateGas: () => void;
  onSend: () => void;
  onClose: () => void;
}

const SendTokenModal: React.FC<SendTokenModalProps> = ({
  visible,
  selectedToken,
  recipient,
  amount,
  ethBalance,
  wunderBalance,
  gasEstimate,
  txHash,
  isConfirming,
  sending,
  onSelectToken,
  onChangeRecipient,
  onChangeAmount,
  onEstimateGas,
  onSend,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <Text style={styles.heading}>Send Tokens</Text>

        <Text style={styles.label}>Select Token</Text>
        <View style={styles.tokenRow}>
          <Pressable
            onPress={() => onSelectToken('ETH')}
            style={[
              styles.tokenButton,
              selectedToken === 'ETH' && styles.tokenButtonActive,
            ]}
          >
            <Text style={styles.tokenText}>ETH</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelectToken('WUNDER')}
            style={[
              styles.tokenButton,
              selectedToken === 'WUNDER' && styles.tokenButtonActive,
            ]}
          >
            <Text style={styles.tokenText}>$WUNDER</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          value={recipient}
          onChangeText={onChangeRecipient}
          style={styles.input}
          placeholder="0x..."
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount to Send</Text>
        <TextInput
          value={amount}
          onChangeText={onChangeAmount}
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.0"
        />

        <Text style={styles.label}>
          Available: {selectedToken === 'ETH' ? ethBalance : wunderBalance}
        </Text>

        {!isConfirming ? (
          <WunderButton title="Continue" onPress={onEstimateGas} />
        ) : (
          <View>
            <Text style={styles.label}>Confirm Transaction</Text>
            <Text style={styles.seed}>To: {recipient}</Text>
            <Text style={styles.seed}>
              Amount: {amount} {selectedToken}
            </Text>
            <Text style={styles.seed}>
              Estimated Fee: {gasEstimate} ETH
            </Text>
            {sending ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <WunderButton title="Send Now" onPress={onSend} />
            )}
          </View>
        )}

        {txHash && (
          <Text style={styles.label}>
            ✅ Sent! View on{' '}
            <Text
              style={{ textDecorationLine: 'underline', color: '#fff403' }}
              onPress={() =>
                Linking.openURL(`https://sepolia.basescan.org/tx/${txHash}`)
              }
            >
              BaseScan
            </Text>
          </Text>
        )}

        <View style={{ marginTop: 20 }}>
          <WunderButton title="Close" variant="secondary" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
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
    textAlign: 'center',
  },
  seed: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tokenButton: {
    padding: 10,
    borderColor: '#fff403',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  tokenButtonActive: {
    backgroundColor: '#fff403',
  },
  tokenText: {
    color: 'black',
    fontWeight: '600',
  },
  modalContainer: {
    paddingTop: 100,
    paddingBottom: 60,
  },
});

export default SendTokenModal;
