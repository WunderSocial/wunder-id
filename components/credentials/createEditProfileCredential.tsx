import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import WunderInput from '@components/WunderInput';
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
import CountrySelect from '@components/WunderCountrySelect';

type RootStackNavigationProp = NavigationProp<RootStackParamList>;

const CreateEditProfileCredential = () => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [userIdStr, setUserIdStr] = useState<string | null>(null);

  const navigation = useNavigation<RootStackNavigationProp>();
  const issueCredential = useMutation(api.credentials.issueCredential);

  useEffect(() => {
    SecureStore.getItemAsync('convexUserId').then(setUserIdStr);
  }, []);

  const userId = userIdStr as unknown as Id<'users'>;

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
    const loadProfileData = async () => {
      if (!profileCredential || !profileCredential.content || initialised) return;

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      if (!decryptionKey) return;

      try {
        const decryptedJson = await decryptSeed(profileCredential.content, decryptionKey);
        const data = JSON.parse(decryptedJson);
        setName(data.name || '');
        setDob(data.dob || '');
        setCountry(data.country || '');
        setCity(data.city || '');
        setInitialised(true);
      } catch (e) {
        console.warn('Failed to decrypt profile credential:', e);
      }
    };

    loadProfileData();
  }, [profileCredential]);

  const handleSubmit = async () => {
    if (!name || !dob || !country || !city) {
      Alert.alert('Missing fields', 'Please fill out all profile fields.');
      return;
    }

    try {
      setLoading(true);

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      const userIdStr = await SecureStore.getItemAsync('convexUserId');

      if (!decryptionKey || !userIdStr) {
        throw new Error('Missing secure credentials or user ID');
      }

      const profileData = { name, dob, country, city };
      const profileJson = JSON.stringify(profileData);
      const encryptedContent = await encryptSeed(profileJson, decryptionKey);

      await issueCredential({
        userId: userIdStr as unknown as Id<'users'>,
        type: CREDENTIAL_TYPES.BASIC_PROFILE,
        content: encryptedContent,
      });

      Alert.alert(
        'Success',
        'Profile credential saved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving profile credential:', error);
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Basic Profile</Text>

      <WunderInput label="Name" placeholder="Jane Doe" value={name} onChangeText={setName} />

      <DateOfBirthPicker
        value={dob}
        onChange={setDob}
        placeholder="DD-MM-YYYY"
      />

      {/* ✅ Country Select Field */}
      <CountrySelect
        label="Country"
        placeholder="Select your country"
        value={country}
        onChange={setCountry}
      />

      <WunderInput label="City" placeholder="e.g. Lisbon" value={city} onChangeText={setCity} />

      <WunderButton  style={styles.btn}
        title="Save Profile"
        onPress={handleSubmit}
        loading={loading}
        disabled={!name || !dob || !country || !city}
      />

      <WunderButton style={styles.btn}
        title="Cancel"
        onPress={() => navigation.goBack()}
        variant="secondary"
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

export default CreateEditProfileCredential;
