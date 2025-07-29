import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import { encryptSeed, decryptSeed } from '@lib/crypto';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';

type RootStackNavigationProp = NavigationProp<RootStackParamList>;

const CreateLivenessCheckCredential = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [userIdStr, setUserIdStr] = useState<string | null>(null);

  const navigation = useNavigation<RootStackNavigationProp>();
  const issueCredential = useMutation(api.credentials.issueCredential);

  // Load userId from secure store
  useEffect(() => {
    SecureStore.getItemAsync('convexUserId').then(setUserIdStr);
  }, []);

  const userId = userIdStr as unknown as Id<'users'>;

  // Load basic profile credential to get user's name
  const profileCredential = useQuery(
    api.credentials.hasCredential,
    userIdStr
      ? {
          userId,
          type: CREDENTIAL_TYPES.BASIC_PROFILE,
        }
      : 'skip'
  );

  useEffect(() => {
    const loadNameFromProfile = async () => {
      if (!profileCredential || !profileCredential.content || initialised) return;

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      if (!decryptionKey) return;

      try {
        const decryptedJson = await decryptSeed(profileCredential.content, decryptionKey);
        const data = JSON.parse(decryptedJson);
        if (data.name) {
          setName(data.name);
        }
        setInitialised(true);
      } catch (e) {
        console.warn('Failed to decrypt profile credential:', e);
      }
    };

    loadNameFromProfile();
  }, [profileCredential]);

  const handleConfirm = async () => {
    if (!name) {
      Alert.alert('Missing Name', 'User name is required for liveness check.');
      return;
    }

    try {
      setLoading(true);

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      const userIdStored = await SecureStore.getItemAsync('convexUserId');

      if (!decryptionKey || !userIdStored) {
        throw new Error('Missing secure credentials or user ID');
      }

      const livenessData = {
        name,
        livenessCheck: true,
      };

      const jsonContent = JSON.stringify(livenessData);
      const encryptedContent = await encryptSeed(jsonContent, decryptionKey);

      await issueCredential({
        userId: userIdStored as unknown as Id<'users'>,
        type: CREDENTIAL_TYPES.LIVENESS_CHECK,
        content: encryptedContent,
      });

      Alert.alert(
        'Success',
        'Liveness Check credential saved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving liveness check credential:', error);
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Liveness Check</Text>

      {/* Camera Placeholder */}
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraPlaceholderText}>Camera view goes here</Text>
      </View>

      <View style={styles.readOnlyField}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{name || 'Loading...'}</Text>
      </View>

      <WunderButton
        style={styles.btn}
        title="Confirm"
        onPress={handleConfirm}
        loading={loading}
        disabled={!name || loading}
      />

      <WunderButton
        style={styles.btn}
        title="Cancel"
        onPress={() => navigation.goBack()}
        variant="secondary"
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  cameraPlaceholder: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#555',
  },
  cameraPlaceholderText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },
  readOnlyField: {
    marginBottom: 20,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
  },
  value: {
    color: 'white',
    fontSize: 18,
    marginTop: 4,
  },
  btn: {
    marginTop: 20,
  },
});

export default CreateLivenessCheckCredential;
