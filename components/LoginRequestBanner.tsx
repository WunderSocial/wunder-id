import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { decryptSeed } from '@lib/crypto';
import type { Id } from 'convex/_generated/dataModel';
import CryptoJS from 'crypto-js';

export default function LoginRequestModal() {
  const [wunderId, setWunderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [siteName, setSiteName] = useState<string>('an app');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    const fetchStoredIds = async () => {
      const storedWunderId = await SecureStore.getItemAsync('wunderId');
      const storedUserId = await SecureStore.getItemAsync('convexUserId');
      const encryptedPrivateKey = await SecureStore.getItemAsync('encryptedPrivateKey');
      const storedDecryptionKey = await SecureStore.getItemAsync('decryptionKey');

      if (storedWunderId) setWunderId(storedWunderId);
      if (storedUserId) setUserId(storedUserId);
      if (storedDecryptionKey) setDecryptionKey(storedDecryptionKey);

      if (encryptedPrivateKey && storedDecryptionKey) {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, storedDecryptionKey);
          const decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);
          setPrivateKey(decryptedPrivateKey);
        } catch (e) {}
      }
    };
    fetchStoredIds();
  }, []);

  const baseWunderId = wunderId ? wunderId.split('.')[0] : null;

  // ✅ updated paths to the new Convex API namespaces
  const pendingRequest = useQuery(
    api.functions.mobile.getPendingRequest.getPendingRequest,
    baseWunderId ? { wunderId: baseWunderId, refreshToken } : 'skip'
  );

  const proofOfAgeCredential = useQuery(
    api.functions.mobile.credentials.hasCredential,
    userId ? { userId: userId as Id<'users'>, type: 'proof_of_age' } : 'skip'
  );

  const livenessCheckCredential = useQuery(
    api.functions.mobile.credentials.hasCredential,
    userId ? { userId: userId as Id<'users'>, type: 'liveness_check' } : 'skip'
  );

  const respondToRequest = useMutation(
    api.functions.mobile.respondToRequest.respondToRequest
  );

  useEffect(() => {
    if (pendingRequest) {
      setVisible(true);
      if (pendingRequest.requestingSite) {
        setSiteName(pendingRequest.requestingSite);
      }
    }
  }, [pendingRequest]);

  useEffect(() => {
    if (!pendingRequest || !decryptionKey) return;

    if (
      proofOfAgeCredential === undefined ||
      livenessCheckCredential === undefined
    ) {
      return;
    }

    const { parameters } = pendingRequest;
    let reason: string | null = null;

    const isOver18 = (dobISO: string) => {
      const birthDate = new Date(dobISO);
      if (isNaN(birthDate.getTime())) return false;
      const now = new Date();
      const eighteenYearsAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      return birthDate <= eighteenYearsAgo;
    };

    const checkCredentials = async () => {
      if (hasResponded) return;

      if (parameters?.proofOfAge) {
        const proof = proofOfAgeCredential;
        if (!proof) {
          reason = 'Proof of age not complete. Request to login cancelled';
        } else {
          try {
            const decrypted = await decryptSeed(proof.content, decryptionKey);
            const parsed = JSON.parse(decrypted);
            const over18Check = isOver18(parsed.dob);

            if (parameters.proofOfAge.over18 && !over18Check) {
              reason = 'You must be 18 to access this site. Request to login cancelled.';
            }
          } catch (e) {
            reason = 'Decryption error cannot prove the age of the user';
          }
        }
      }

      if (!reason && parameters?.livenessCheck) {
        const liveness = livenessCheckCredential;
        if (!liveness) {
          reason = 'Liveness check not complete';
        } else {
          try {
            await decryptSeed(liveness.content, decryptionKey);
          } catch (e) {
            reason = 'Unable to verify liveness check';
          }
        }
      }

      if (reason) {
        setHasResponded(true);
        setErrorMessage(reason);
        setDeclined(true);
        respondToRequest({
          requestId: pendingRequest._id,
          status: 'declined',
          reason,
        });
        startCountdown(() => {
          setDeclined(false);
          setVisible(false);
          setRefreshToken((k) => k + 1);
          setErrorMessage(null);
          setHasResponded(false);
        });
      }
    };

    checkCredentials();
  }, [pendingRequest, proofOfAgeCredential, livenessCheckCredential, decryptionKey, hasResponded]);

  const startCountdown = (onComplete: () => void) => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!pendingRequest) return;
    if (declined && status === 'declined') return;

    await respondToRequest({ requestId: pendingRequest._id, status });

    if (status === 'accepted') {
      setAccepted(true);
      startCountdown(() => {
        setAccepted(false);
        setVisible(false);
        setRefreshToken((k) => k + 1);
      });
    } else {
      setDeclined(true);
      startCountdown(() => {
        setDeclined(false);
        setVisible(false);
        setRefreshToken((k) => k + 1);
      });
    }
  };

  if (wunderId === null || userId === null) return null;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {pendingRequest || accepted || declined ? (
            <>
              <Text style={styles.title}>Login Request</Text>
              {accepted ? (
                <Text style={styles.message}>
                  {`Please return to ${siteName} to complete the process.\n\nClosing in ${countdown}`}
                </Text>
              ) : declined ? (
                <Text style={styles.message}>
                  {errorMessage
                    ? `${errorMessage}\n\nClosing in ${countdown}`
                    : `You have declined to login to ${siteName}, the request has been cancelled.\n\nClosing in ${countdown}`}
                </Text>
              ) : (
                <>
                  <Text style={styles.message}>
                    {pendingRequest?.requestingSite || 'An app'} is requesting authorisation to login.
                  </Text>
                  <View style={styles.buttons}>
                    <Button title="Accept" onPress={() => handleResponse('accepted')} color="#fff403" />
                    <Button title="Decline" onPress={() => handleResponse('declined')} color="#FF5A5F" />
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator color="#fff403" />
              <Text style={styles.message}>Checking for login requests...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    width: '80%',
    elevation: 5,
    borderColor: '#fff403',
    borderWidth: 2,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
