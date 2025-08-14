import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
    api.functions.mobile.credentials.hasCredential,
    userId
      ? {
          userId,
          type: CREDENTIAL_TYPES.BASIC_PROFILE,
        }
      : 'skip'
  );

  // For Proof of Age credential (DOB verified)
  const proofOfAgeCredential = useQuery(
    api.functions.mobile.credentials.hasCredential,
    userId
      ? {
          userId,
          type: CREDENTIAL_TYPES.PROOF_OF_AGE,
        }
      : 'skip'
  );

  // For Liveness Check credential (Name verified)
  const livenessCredential = useQuery(
    api.functions.mobile.credentials.hasCredential,
    userId
      ? {
          userId,
          type: CREDENTIAL_TYPES.LIVENESS_CHECK,
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

  // Badge click handlers
  const onPressDobBadge = () => {
    Alert.alert('Date of Birth Verified', 'Your date of birth has been verified.');
  };

  const onPressNameBadge = () => {
    Alert.alert('Liveness Verified', 'You have been verified as not a bot.');
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

        {/* Bottom Row: Info on left */}
        <View style={styles.bottomRow}>
          <View style={styles.infoLeft}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Name:</Text>
              <View style={styles.valueWithBadge}>
                <Text style={styles.valueInline}>{profile.name}</Text>
                {livenessCredential && (
                  <TouchableOpacity
                    onPress={onPressNameBadge}
                    style={styles.badgeContainer}
                    accessibilityLabel="Liveness Verified Badge"
                    accessibilityHint="Shows that user has passed liveness verification"
                  >
                    <Text style={styles.badgeTick}>✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>D.O.B:</Text>
              <View style={styles.valueWithBadge}>
                <Text style={styles.valueInline}>{profile.dob}</Text>
                {proofOfAgeCredential && (
                  <TouchableOpacity
                    onPress={onPressDobBadge}
                    style={styles.badgeContainer}
                    accessibilityLabel="Date of Birth Verified Badge"
                    accessibilityHint="Shows that date of birth has been verified"
                  >
                    <Text style={styles.badgeTick}>✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.valueInline}>{profile.country}</Text>
            </View>
          </View>
          {/* QR Code omitted as per your original code */}
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
    borderColor: '#FFD700', // yellow border
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
    alignItems: 'center',
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
  valueWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeContainer: {
    backgroundColor: '#fff403', // Wunder yellow
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTick: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
