import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { decryptSeed } from '@lib/crypto';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import type { Id } from '../convex/_generated/dataModel';

type Profile = {
  name: string;
  dob: string;
  country: string;
};

export const useDecryptedBasicProfile = () => {
  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      const convexUserIdStr = await SecureStore.getItemAsync('convexUserId');
      if (convexUserIdStr) {
        setUserId(convexUserIdStr as unknown as Id<'users'>);
      }
    };
    loadUserId();
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
        console.warn('Failed to decrypt basic profile:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileCredential]);

  return { profile, loading };
};
