import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function LoginRequestModal() {
  const [shortWunderId, setShortWunderId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [siteName, setSiteName] = useState<string>('an app');

  useEffect(() => {
    const fetchWunderId = async () => {
      const fullId = await SecureStore.getItemAsync('wunderId');
      if (fullId) {
        const shortId = fullId.split('.')[0];
        setShortWunderId(shortId);
      }
    };
    fetchWunderId();
  }, []);

  const pendingRequest = useQuery(
    api.getPendingRequest.getPendingRequest,
    shortWunderId ? { wunderId: shortWunderId, refreshToken } : 'skip'
  );

  const respondToRequest = useMutation(api.respondToRequest.respondToRequest);

  useEffect(() => {
    if (pendingRequest) {
      setVisible(true);
      if (pendingRequest.requestingSite) {
        setSiteName(pendingRequest.requestingSite);
      }
    }
  }, [pendingRequest]);

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

  if (shortWunderId === null) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
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
                  {`You have declined to login to ${siteName}, the request has been cancelled.\n\nClosing in ${countdown}`}
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
