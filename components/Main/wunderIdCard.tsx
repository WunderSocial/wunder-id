import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { decryptSeed } from '@lib/crypto';
import type { Id } from '../../convex/_generated/dataModel';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type WunderIdCardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CredentialEditor'
>;

const WunderIdCard = () => {
  const [wunderId, setWunderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [profile, setProfile] = useState({
    name: 'Unknown',
    dob: 'Unknown',
    country: 'Unknown',
  });

  const navigation = useNavigation<WunderIdCardNavigationProp>();

  useEffect(() => {
    const loadIds = async () => {
      const id = await SecureStore.getItemAsync('wunderId');
      setWunderId(id);

      const convexUserIdStr = await SecureStore.getItemAsync('convexUserId');
      if (convexUserIdStr) {
        setUserId(convexUserIdStr as unknown as Id<'users'>);
      }
    };
    loadIds();
  }, []);

  const profileCredential = useQuery(
    api.credentials.hasCredential,
    userId
      ? {
          userId,
          type: CREDENTIAL_TYPES.BASIC_PROFILE,
        }
      : 'skip'
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileCredential?.content) return;

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      if (!decryptionKey) return;

      try {
        const decrypted = await decryptSeed(profileCredential.content, decryptionKey);
        const data = JSON.parse(decrypted);

        setProfile({
          name: data.name || 'Unknown',
          dob: data.dob || 'Unknown',
          country: data.country || 'Unknown',
        });
      } catch (e) {
        console.warn('Failed to decrypt profile credential:', e);
      }
    };

    loadProfile();
  }, [profileCredential]);

  // Handler for create/edit button press
  const onPressEdit = () => {
    navigation.navigate('CredentialEditor', { credentialType: CREDENTIAL_TYPES.BASIC_PROFILE });
  };

  // Determine button label based on credential presence
  const buttonLabel = profileCredential ? 'Edit Profile' : 'Create Profile';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top Row: Avatar + Wunder ID */}
        <View style={styles.topRow}>
          <Image
            source={require('../../assets/placeholder-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.idSection}>
            <Text style={styles.label}>Wunder ID:</Text>
            <Text style={styles.value}>
              {wunderId ? `${wunderId.split('.')[0]}@wunder` : 'Loading...'}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Info on left, QR on right */}
        <View style={styles.bottomRow}>
          <View style={styles.infoLeft}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.valueInline}>{profile.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>D.O.B:</Text>
              <Text style={styles.valueInline}>{profile.dob}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.valueInline}>{profile.country}</Text>
            </View>
          </View>
          {/* <Image
            source={require('../../assets/wunder-social-qr-code.png')}
            style={styles.qrCode}
          /> */}
        </View>

        {/* Create/Edit Button */}
        <TouchableOpacity style={styles.button} onPress={onPressEdit}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WunderIdCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#000',
    borderColor: '#FFD700', // yellow
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 16,
  },
  idSection: {
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    width: 80,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginTop: 2,
  },
  valueInline: {
    color: '#fff',
    fontSize: 16,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
