import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 10)}...${address.slice(-5)}`;
};

const WunderWalletOverview: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'logins'>('transactions');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchWalletAddress = async () => {
      const address = await SecureStore.getItemAsync('walletAddress');
      if (address) setWalletAddress(address);
    };
    fetchWalletAddress();
  }, []);

  const handleCopyAddress = () => {
    Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  };

  const wunderAmount = 0.0;
  const ethBalance = 0.0;
  const usdValue = wunderAmount * 0.00026;

  return (
    <View style={styles.container}>
      {/* WUNDER BALANCE */}
      <View style={styles.balanceBox}>
        <Text style={styles.wunderLabel}>$WUNDER</Text>
        <Text style={styles.wunderAmount}>{wunderAmount.toFixed(2)}</Text>
        <Text style={styles.usdValue}>${usdValue.toFixed(4)} USD</Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <ActionButton icon="send" label="Send" />
        <ActionButton icon="download" label="Receive" onPress={() => setModalVisible(true)} />
        <ActionButton icon="shopping-cart" label="Buy" />
      </View>

      {/* WALLET INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.label}>Base ETH: {ethBalance.toFixed(4)}</Text>
        <Text style={styles.label}>Wallet Address:</Text>
        <Pressable onPress={handleCopyAddress}>
          <Text style={styles.walletAddress}>
            {shortenAddress(walletAddress) || 'Loading...'}
          </Text>
        </Pressable>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabHeader}>
          <TouchableOpacity onPress={() => setActiveTab('transactions')}>
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
              Transactions
            </Text>
            {activeTab === 'transactions' && <View style={styles.underline} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('logins')}>
            <Text style={[styles.tabText, activeTab === 'logins' && styles.activeTabText]}>
              Logins
            </Text>
            {activeTab === 'logins' && <View style={styles.underline} />}
          </TouchableOpacity>
        </View>
        <View style={styles.tabContent}>
          {activeTab === 'transactions' ? (
            <Text style={styles.placeholderText}>No transactions yet.</Text>
          ) : (
            <Text style={styles.placeholderText}>No login activity yet.</Text>
          )}
        </View>
      </View>

      {/* MODAL FOR RECEIVE */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive $WUNDER</Text>
            <Pressable onPress={handleCopyAddress}>
              <Text style={styles.modalAddress}>{shortenAddress(walletAddress)} (Tap to copy)</Text>
            </Pressable>
            <Image
              source={require('../../assets/wunder-social-qr-code.png')}
              style={styles.qrImage}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ActionButton = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionCircle}>
      <Feather name={icon as any} size={20} color="black" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flex: 1,
  },
  balanceBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wunderLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  wunderAmount: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  usdValue: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCircle: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    padding: 12,
  },
  actionLabel: {
    color: 'white',
    fontSize: 14,
    marginTop: 6,
  },
  infoBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  walletAddress: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  tabsContainer: {
    paddingTop: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFD700',
  },
  underline: {
    height: 2,
    backgroundColor: '#FFD700',
    marginTop: 4,
  },
  tabContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#111',
    borderRadius: 12,
    marginTop: 12,
  },
  placeholderText: {
    color: '#777',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalAddress: {
    color: 'white',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  closeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeText: {
    color: '#000',
    fontWeight: '600',
  },
});

export default WunderWalletOverview;
