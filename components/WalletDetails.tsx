import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface WalletDetailsProps {
  ethBalance: string | null;
  wunderBalance: string | null;
  walletAddress: string;
}

const WalletDetails: React.FC<WalletDetailsProps> = ({
  ethBalance,
  wunderBalance,
  walletAddress,
}) => {
  const handleCopyAddress = () => {
    Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  };

  return (
    <View>
      {ethBalance && (
        <Text style={styles.label}>
          Base ETH: {parseFloat(ethBalance).toFixed(4)}
        </Text>
      )}
      {wunderBalance && (
        <Text style={styles.label}>
          $WUNDER: {parseFloat(wunderBalance).toFixed(2)}
        </Text>
      )}
      <Text style={styles.label}>Wallet Address:</Text>
      <Pressable onPress={handleCopyAddress}>
        <Text style={[styles.seed, { textDecorationLine: 'underline' }]}>
          {walletAddress}
        </Text>
      </Pressable>
    </View>
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

export default WalletDetails;
 