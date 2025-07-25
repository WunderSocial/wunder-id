import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const placeholderQR = require('../../assets/wunder-social-qr-code.png');

type Credential = {
  id: string;
  title: string;
  created: Date;
  permanent: boolean;
  value?: string;
};

const ALL_CREDENTIALS: Omit<Credential, 'created' | 'id'>[] = [
  { title: 'Basic Profile', permanent: false },
  { title: 'Verified Email', permanent: false },
  { title: 'Verified Phone Number', permanent: false },
  { title: 'Liveness Check', permanent: false },
  { title: 'Proof of Age', permanent: false },
  { title: 'Proof of Identity (KYC)', permanent: false },
  { title: 'Proof of Address (Enhanced KYC)', permanent: false },
  { title: 'Proof of Funds (AML)', permanent: false },
  { title: 'Link a Bank Card', permanent: false },
  { title: 'DAO Membership', permanent: false },
];

const CredentialCards = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    const fetchStoredData = async () => {
      const wunderId = await SecureStore.getItemAsync('wunderId');
      const walletAddress = await SecureStore.getItemAsync('walletAddress');

      const username = wunderId?.split('.')[0] || 'unknown';
      const formattedWunderId = `${username}@wunder`;

      const initialCredentials: Credential[] = [
        {
          id: 'wunder-id',
          title: 'Wunder ID',
          created: new Date(),
          permanent: true,
          value: formattedWunderId,
        },
        {
          id: 'wallet',
          title: 'Wallet Address',
          created: new Date(),
          permanent: true,
          value: walletAddress || 'unknown',
        },
      ];

      setCredentials(initialCredentials);
    };

    fetchStoredData();
  }, []);

  const handleCardPress = (credential: Credential) => {
    setSelectedCredential(credential);
    setModalVisible(true);
  };

  const handleAddCredential = (title: string) => {
    const exists = credentials.find((c) => c.title === title);
    if (!exists) {
      const newCredential: Credential = {
        id: `${title}-${Date.now()}`,
        title,
        created: new Date(),
        permanent: false,
      };
      setCredentials((prev) => [...prev, newCredential]);
    }
    setAddModalVisible(false);
  };

  const incompleteCredentials = ALL_CREDENTIALS.filter(
    (c) => !credentials.find((cred) => cred.title === c.title)
  );

  return (
    <View style={styles.container}>
      {/* Header row with title and button */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Mr Credentials</Text>
        {incompleteCredentials.length > 0 && (
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stacked Cards */}
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
            {credential.value && (
              <Text style={styles.cardValue}>{credential.value}</Text>
            )}
            <Text style={styles.cardDate}>
              Created: {format(credential.created, 'dd MMM yyyy')}
            </Text>
            <Text style={styles.cardDate}>
              {credential.permanent ? 'No expiry' : 'Expires: TBD'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Card Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedCredential?.title}</Text>
            {selectedCredential?.value && (
              <Text style={styles.modalValue}>{selectedCredential.value}</Text>
            )}
            <Text style={styles.modalDate}>
              Created: {selectedCredential?.created && format(selectedCredential.created, 'dd MMM yyyy')}
            </Text>
            <Text style={styles.modalDate}>
              {selectedCredential?.permanent ? 'No expiry' : 'Expires: TBD'}
            </Text>
            <Image source={placeholderQR} style={styles.qrCode} />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
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
                  onPress={() => handleAddCredential(item.title)}
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
  cardValue: {
    fontSize: 16,
    color: 'white',
    marginTop: 8,
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalValue: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  modalDate: {
    fontSize: 15,
    color: '#ccc',
    marginTop: 8,
  },
  qrCode: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    marginVertical: 20,
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
