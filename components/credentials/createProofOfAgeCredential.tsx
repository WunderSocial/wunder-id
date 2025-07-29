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
import DateOfBirthPicker from '@components/WunderDateOfBirthPicker';

type RootStackNavigationProp = NavigationProp<RootStackParamList>;

const CreateProofOfAgeCredential = () => {
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [userIdStr, setUserIdStr] = useState<string | null>(null);

  const navigation = useNavigation<RootStackNavigationProp>();
  const issueCredential = useMutation(api.credentials.issueCredential);

  // Get userId from secure store
  useEffect(() => {
    SecureStore.getItemAsync('convexUserId').then(setUserIdStr);
  }, []);

  const userId = userIdStr as unknown as Id<'users'>;

  // Load user's basic profile to get DOB pre-fill
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
    const loadDobFromProfile = async () => {
      if (!profileCredential || !profileCredential.content || initialised) return;

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      if (!decryptionKey) return;

      try {
        const decryptedJson = await decryptSeed(profileCredential.content, decryptionKey);
        const data = JSON.parse(decryptedJson);
        if (data.dob) {
          setDob(data.dob);
        }
        setInitialised(true);
      } catch (e) {
        console.warn('Failed to decrypt profile credential:', e);
      }
    };

    loadDobFromProfile();
  }, [profileCredential]);

  // Helper to check if over 18 based on dob string (expected "YYYY-MM-DD" or "DD-MM-YYYY")
  // Assuming dob is in "DD-MM-YYYY" format from DateOfBirthPicker, so we parse accordingly:
  const isOver18 = (dobStr: string) => {
    // Convert "DD-MM-YYYY" to a Date object
    const parts = dobStr.split('-');
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months 0-indexed
    const year = parseInt(parts[2], 10);

    const birthDate = new Date(year, month, day);
    if (isNaN(birthDate.getTime())) return false;

    const now = new Date();
    const eighteenYearsAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());

    return birthDate <= eighteenYearsAgo;
  };

  const handleConfirm = async () => {
    if (!dob) {
      Alert.alert('Missing Date of Birth', 'Please select your date of birth.');
      return;
    }

    try {
      setLoading(true);

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      const userIdStored = await SecureStore.getItemAsync('convexUserId');

      if (!decryptionKey || !userIdStored) {
        throw new Error('Missing secure credentials or user ID');
      }

      // Calculate expiry date 12 months from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const expiryISO = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Determine if user is over 18
      const over18 = isOver18(dob);

      // Add the over18 flag into the content
      const proofOfAgeData = {
        dob,
        expiry: expiryISO,
        over18,          // <-- NEW flag added here
      };

      const jsonContent = JSON.stringify(proofOfAgeData);
      const encryptedContent = await encryptSeed(jsonContent, decryptionKey);

      await issueCredential({
        userId: userIdStored as unknown as Id<'users'>,
        type: CREDENTIAL_TYPES.PROOF_OF_AGE,
        content: encryptedContent,
      });

      Alert.alert(
        'Success',
        'Proof of Age credential saved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving Proof of Age credential:', error);
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Proof of Age</Text>

      <DateOfBirthPicker
        value={dob}
        onChange={setDob}
        placeholder="DD-MM-YYYY"
      />

      <WunderButton
        style={styles.btn}
        title="Confirm"
        onPress={handleConfirm}
        loading={loading}
        disabled={!dob || loading}
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
  btn: {
    marginTop: 20,
  },
});

export default CreateProofOfAgeCredential;
