import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { decryptSeed } from '@lib/crypto';
import type { Id } from '../../convex/_generated/dataModel';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';

// Import your credential type constants here
import { CREDENTIAL_TYPES } from 'constants/credentials';

const { width } = Dimensions.get('window');

type Credential = {
  id: string;
  title: string;
  created: Date;
  permanent: boolean;
  value?: string | null;
  expires?: string | null;
};

// Use constants for addable credentials
const ADDABLE_CREDENTIALS: { type: string; title: string }[] = [
  { type: CREDENTIAL_TYPES.BASIC_PROFILE, title: 'Basic Profile' },
  { type: CREDENTIAL_TYPES.WALLET_ADDRESS || 'wallet_address', title: 'Wallet Address' }, // in case it's missing in constants
  { type: CREDENTIAL_TYPES.WUNDER_ID || 'wunder_id', title: 'Wunder ID' }, // fallback safety
  { type: CREDENTIAL_TYPES.PROOF_OF_AGE, title: 'Proof of Age' },
  { type: CREDENTIAL_TYPES.LIVENESS_CHECK, title: 'Liveness Check' },
];

const CredentialCards = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [selectedContent, setSelectedContent] = useState<Record<string, any> | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const id = await SecureStore.getItemAsync('convexUserId');
      const key = await SecureStore.getItemAsync('decryptionKey');

      if (id) setUserId(id as Id<'users'>);
      if (key) setDecryptionKey(key);
    };
    loadUser();
  }, []);

  // Query by credential types using constants
  const wunderIdCred = useQuery(
    api.credentials.hasCredential,
    userId ? { userId, type: CREDENTIAL_TYPES.WUNDER_ID || 'wunder_id' } : 'skip'
  );
  const walletAddressCred = useQuery(
    api.credentials.hasCredential,
    userId ? { userId, type: CREDENTIAL_TYPES.WALLET_ADDRESS || 'wallet_address' } : 'skip'
  );
  const basicProfile = useQuery(
    api.credentials.hasCredential,
    userId ? { userId, type: CREDENTIAL_TYPES.BASIC_PROFILE } : 'skip'
  );
  // const verifiedEmail = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.VERIFIED_EMAIL || 'verified_email' } : 'skip'
  // );
  // const verifiedPhone = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.VERIFIED_PHONE || 'verified_phone' } : 'skip'
  // );
  const livenessCheck = useQuery(
    api.credentials.hasCredential,
    userId ? { userId, type: CREDENTIAL_TYPES.LIVENESS_CHECK } : 'skip'
  );
  const proofOfAge = useQuery(
    api.credentials.hasCredential,
    userId ? { userId, type: CREDENTIAL_TYPES.PROOF_OF_AGE } : 'skip'
  );
  // const proofOfIdentity = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.PROOF_OF_IDENTITY || 'proof_of_identity' } : 'skip'
  // );
  // const proofOfAddress = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.PROOF_OF_ADDRESS || 'proof_of_address' } : 'skip'
  // );
  // const proofOfFunds = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.PROOF_OF_FUNDS || 'proof_of_funds' } : 'skip'
  // );
  // const linkBankCard = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.LINK_BANK_CARD || 'link_bank_card' } : 'skip'
  // );
  // const daoMembership = useQuery(
  //   api.credentials.hasCredential,
  //   userId ? { userId, type: CREDENTIAL_TYPES.DAO_MEMBERSHIP || 'dao_membership' } : 'skip'
  // );

  // Map queries using constants as keys
  const queriesMap: Record<string, ReturnType<typeof useQuery>> = {
    [CREDENTIAL_TYPES.WUNDER_ID || 'wunder_id']: wunderIdCred,
    [CREDENTIAL_TYPES.WALLET_ADDRESS || 'wallet_address']: walletAddressCred,
    [CREDENTIAL_TYPES.BASIC_PROFILE]: basicProfile,
    // [CREDENTIAL_TYPES.VERIFIED_EMAIL || 'verified_email']: verifiedEmail,
    // [CREDENTIAL_TYPES.VERIFIED_PHONE || 'verified_phone']: verifiedPhone,
    [CREDENTIAL_TYPES.LIVENESS_CHECK]: livenessCheck,
    [CREDENTIAL_TYPES.PROOF_OF_AGE]: proofOfAge,
    // [CREDENTIAL_TYPES.PROOF_OF_IDENTITY || 'proof_of_identity']: proofOfIdentity,
    // [CREDENTIAL_TYPES.PROOF_OF_ADDRESS || 'proof_of_address']: proofOfAddress,
    // [CREDENTIAL_TYPES.PROOF_OF_FUNDS || 'proof_of_funds']: proofOfFunds,
    // [CREDENTIAL_TYPES.LINK_BANK_CARD || 'link_bank_card']: linkBankCard,
    // [CREDENTIAL_TYPES.DAO_MEMBERSHIP || 'dao_membership']: daoMembership,
  };

  useEffect(() => {
    const loadCredentials = async () => {
      if (!userId || !decryptionKey) return;

      const dynamicCreds: Credential[] = [];

      // Use the keys from queriesMap for iteration to align with constants keys
      for (const type of Object.keys(queriesMap)) {
        const cred = queriesMap[type];
        if (!cred?.content) continue;

        try {
          const decrypted = await decryptSeed(cred.content, decryptionKey);
          const parsed = JSON.parse(decrypted);
          // Create title from constant string like 'proof_of_age' => 'Proof Of Age'
          const title = type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          let created = new Date();
          if (cred._id && typeof cred._id === 'string') {
            const parts = cred._id.split('|');
            if (parts.length > 1) {
              const timestamp = Number(parts[1]);
              if (!isNaN(timestamp)) {
                created = new Date(timestamp);
              }
            }
          }

          dynamicCreds.push({
            id: type,
            title,
            created,
            expires: parsed.expiry || null,
            value: decrypted,
            permanent: false,
          });
        } catch (e) {
          console.warn(`Failed to decrypt ${type}:`, e);
        }
      }

      setCredentials(dynamicCreds);
    };

    loadCredentials();
  }, [
    userId,
    decryptionKey,
    wunderIdCred,
    walletAddressCred,
    basicProfile,
    // verifiedEmail,
    // verifiedPhone,
    livenessCheck,
    proofOfAge,
    // proofOfIdentity,
    // proofOfAddress,
    // proofOfFunds,
    // linkBankCard,
    // daoMembership,
  ]);

  const handleCardPress = async (credential: Credential) => {
    setSelectedCredential(credential);

    if (credential.value) {
      try {
        const parsed = JSON.parse(credential.value);
        const { expiry, expires, ...rest } = parsed;
        setSelectedContent(rest);
      } catch {
        setSelectedContent(null);
      }
    } else {
      setSelectedContent(null);
    }

    setModalVisible(true);
  };

  const handleAddCredential = (credentialType: string) => {
    navigation.navigate('CredentialEditor', { credentialType });
    setTimeout(() => {
      setAddModalVisible(false);
    }, 100);
  };

  // Use type instead of title to check for existing credentials
  const incompleteCredentials = ADDABLE_CREDENTIALS.filter(
    (c) => !credentials.find((cred) => cred.id === c.type)
  );

  // Helper to format expiry string or return null if invalid
  const formatExpiry = (expiry?: string | null): string | null => {
    if (!expiry) return null;
    const date = new Date(expiry);
    if (isNaN(date.getTime())) return null;
    return format(date, 'dd MMM yyyy');
  };

  const RenderCredentialContent = ({ content }: { content: Record<string, any> }) => {
    return (
      <View style={{ marginTop: 12 }}>
        {Object.entries(content).map(([key, value]) => (
          <View key={key} style={styles.contentRow}>
            <Text style={styles.contentLabel}>{key.replace(/_/g, ' ')}:</Text>
            <Text style={styles.contentValue}>
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>My Credentials</Text>
        {incompleteCredentials.length > 0 && (
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardStack}>
        {credentials.map((credential, index) => (
          <TouchableOpacity
            key={credential.id}
            style={[
              styles.card,
              { marginTop: index === 0 ? 0 : -65, zIndex: index + 1 },
            ]}
            onPress={() => handleCardPress(credential)}
            activeOpacity={0.9}
          >
            <Text style={styles.cardTitle}>{credential.title}</Text>
            <Text style={styles.cardDate}>
              Created: {format(credential.created, 'dd MMM yyyy')}
            </Text>
            <Text style={styles.cardDate}>
              {credential.permanent
                ? 'No expiry'
                : credential.expires
                ? `Expires: ${formatExpiry(credential.expires)}`
                : 'No expiry'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedCredential?.title}</Text>
            <Text style={styles.modalDate}>
              Created:{' '}
              {selectedCredential?.created
                ? format(selectedCredential.created, 'dd MMM yyyy')
                : 'Unknown'}
            </Text>
            <Text style={styles.modalDate}>
              {selectedCredential?.permanent
                ? 'No expiry'
                : selectedCredential?.expires
                ? `Expires: ${formatExpiry(selectedCredential.expires)}`
                : 'No expiry'}
            </Text>

            {selectedContent ? (
              <ScrollView style={{ maxHeight: 250, marginTop: 12 }}>
                <RenderCredentialContent content={selectedContent} />
              </ScrollView>
            ) : (
              <Text style={[styles.modalContent, { marginTop: 12 }]}>No content available.</Text>
            )}

            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedContent(null);
                setSelectedCredential(null);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Credential Modal */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Credential</Text>
            <FlatList
              data={incompleteCredentials}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleAddCredential(item.type)}
                  style={styles.addListItem}
                >
                  <Text style={styles.addListItemText}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CredentialCards;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardStack: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    borderColor: '#FFD700',
    borderWidth: 2,
    marginVertical: 6,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  cardDate: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 16,
    borderColor: '#FFD700',
    borderWidth: 2,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalDate: {
    fontSize: 15,
    color: '#ccc',
    marginTop: 8,
  },
  modalContent: {
    color: 'white',
    fontFamily: 'Courier',
    fontSize: 14,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  contentLabel: {
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 8,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  contentValue: {
    color: 'white',
    fontSize: 14,
    flexShrink: 1,
  },
  closeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 25,
    alignSelf: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addListItem: {
    paddingVertical: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  addListItemText: {
    color: 'white',
    fontSize: 17,
  },
});
