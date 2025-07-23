import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
import { decryptSeed } from '@lib/crypto';
import { ethers } from 'ethers';
import { ERC20_ABI } from '@lib/erc20';

const ALCHEMY_RPC = 'https://base-sepolia.g.alchemy.com/v2/y29PswVTE-aq5eCDYSjpytKXyVdRK46t';
const WUNDER_TOKEN_ADDRESS = '0x706ebd77a7b833fbd4d0c1f79d19516c029979ac';
const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 5 * 60 * 1000;
const DISPLAY_DURATION_MS = 60 * 1000;

const HomeScreen = () => {
  const pinInputRef = useRef<PinInputRef>(null);

  const [walletAddress, setWalletAddress] = useState('');
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [wunderBalance, setWunderBalance] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reveal details state
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

  // Send modal state
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'WUNDER'>('ETH');
  const [isConfirming, setIsConfirming] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      Clipboard.setStringAsync(walletAddress);
      Alert.alert('Copied', 'Wallet address copied to clipboard.');
    }
  };

  const loadWalletAddress = async () => {
    const address = await SecureStore.getItemAsync('walletAddress');
    if (address) {
      setWalletAddress(address);
      try {
        const eth = await provider.getBalance(address);
        setEthBalance(ethers.formatEther(eth));

        const token = new ethers.Contract(WUNDER_TOKEN_ADDRESS, ERC20_ABI, provider);
        const decimals = await token.decimals();
        const rawBalance = await token.balanceOf(address);
        setWunderBalance(ethers.formatUnits(rawBalance, decimals));
      } catch (err) {
        console.warn('Balance fetch error:', err);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletAddress();
    setRefreshing(false);
  };

  useEffect(() => {
    loadWalletAddress();
  }, []);

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
      setRevealCountdown(DISPLAY_DURATION_MS / 1000);
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
    } catch (err) {
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

  const handleEstimateGas = async () => {
    try {
      const pk = await SecureStore.getItemAsync('decryptedPrivateKey');
      if (!pk) return Alert.alert('Missing key', 'Private key not found');
      const wallet = new ethers.Wallet(pk, provider);

      let tx;
      if (selectedToken === 'ETH') {
        tx = {
          to: recipient,
          value: ethers.parseEther(amount),
        };
      } else {
        const contract = new ethers.Contract(WUNDER_TOKEN_ADDRESS, ERC20_ABI, wallet);
        const decimals = await contract.decimals();
        const txData = await (contract.populateTransaction as any).transfer(
          recipient,
          ethers.parseUnits(amount, decimals)
        );
        tx = {
          to: WUNDER_TOKEN_ADDRESS,
          data: txData.data,
        };
      }

      const feeData = await provider.getFeeData();
      const gasLimit = await wallet.estimateGas(tx);
      const fee = ethers.formatEther(gasLimit * (feeData.maxFeePerGas ?? BigInt(0)));
      setGasEstimate(parseFloat(fee).toFixed(6));
      setIsConfirming(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gas estimation failed.');
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const pk = await SecureStore.getItemAsync('decryptedPrivateKey');
      if (!pk) return Alert.alert('Missing key', 'Private key not found');
      const wallet = new ethers.Wallet(pk, provider);

      let tx;
      if (selectedToken === 'ETH') {
        tx = await wallet.sendTransaction({
          to: recipient,
          value: ethers.parseEther(amount),
        });
      } else {
        const contract = new ethers.Contract(WUNDER_TOKEN_ADDRESS, ERC20_ABI, wallet);
        const decimals = await contract.decimals();
        const txResponse = await contract.transfer(
          recipient,
          ethers.parseUnits(amount, decimals)
        );
        tx = txResponse;
      }

      await tx.wait();
      setTxHash(tx.hash);
      await loadWalletAddress();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Transaction failed.');
    } finally {
      setSending(false);
      setIsConfirming(false);
    }
  };
  return (
    <BodyContainer header={<HeaderContainer><Logo /></HeaderContainer>}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.heading}>Wunder ID</Text>

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

        {walletAddress && (
          <View>
            <Text style={styles.label}>Wallet Address:</Text>
            <Pressable onPress={handleCopyAddress}>
              <Text style={[styles.seed, { textDecorationLine: 'underline' }]}>
                {walletAddress}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: 30 }}>
          <WunderButton title="Send Tokens" onPress={() => setSendModalVisible(true)} />
        </View>

        <View style={{ marginTop: 20 }}>
          <WunderButton
            title="Reveal Wallet Details"
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

        <View style={{ marginTop: 20 }}>
          <WunderButton
            title="Reset Identity"
            onPress={() => {
              resetAppState();
              Alert.alert('Reset complete', 'App data has been cleared. Restart the app.');
            }}
          />
        </View>
      </ScrollView>

      {/* SEND MODAL */}
      <Modal visible={sendModalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.heading}>Send Tokens</Text>

          <Text style={styles.label}>Select Token</Text>
          <View style={styles.tokenRow}>
            <Pressable
              onPress={() => setSelectedToken('ETH')}
              style={[
                styles.tokenButton,
                selectedToken === 'ETH' && styles.tokenButtonActive,
              ]}
            >
              <Text style={styles.tokenText}>ETH</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedToken('WUNDER')}
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
            onChangeText={setRecipient}
            style={styles.input}
            placeholder="0x..."
            autoCapitalize="none"
          />

          <Text style={styles.label}>Amount to Send</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.0"
          />

          <Text style={styles.label}>
            Available: {selectedToken === 'ETH' ? ethBalance : wunderBalance}
          </Text>

          {!isConfirming ? (
            <WunderButton title="Continue" onPress={handleEstimateGas} />
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
                <WunderButton title="Send Now" onPress={handleSend} />
              )}
            </View>
          )}

          {txHash && (
            <Text style={styles.label}>
              ✅ Sent! View on{' '}
              <Text
                style={{ textDecorationLine: 'underline', color: '#fff403' }}
                onPress={() => {
                  const url = `https://sepolia.basescan.org/tx/${txHash}`;
                  Linking.openURL(url);
                }}
              >
                BaseScan
              </Text>
            </Text>
          )}

          <View style={{ marginTop: 20 }}>
            <WunderButton
              title="Close"
              variant="secondary"
              onPress={() => {
                setSendModalVisible(false);
                setRecipient('');
                setAmount('');
                setIsConfirming(false);
                setTxHash(null);
                setGasEstimate(null);
              }}
            />
          </View>
        </ScrollView>
      </Modal>
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

export default HomeScreen;

