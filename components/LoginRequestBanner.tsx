import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function LoginRequestModal() {
  const [shortWunderId, setShortWunderId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [visible, setVisible] = useState(false);

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
    setVisible(!!pendingRequest);
  }, [pendingRequest]);

  const handleResponse = async (status: 'accepted' | 'declined') => {
    if (!pendingRequest) return;
    await respondToRequest({ requestId: pendingRequest._id, status });
    setVisible(false);
    setRefreshToken((k) => k + 1);
  };

  if (shortWunderId === null || pendingRequest === undefined) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {pendingRequest ? (
            <>
              <Text style={styles.title}>Login Request</Text>
              <Text style={styles.message}>
                The Wunder ID demo app is requesting authorisation to login.
              </Text>
              <View style={styles.buttons}>
                <Button title="Accept" onPress={() => handleResponse('accepted')} color="#fff403" />
                <Button title="Decline" onPress={() => handleResponse('declined')} color="#FF5A5F" />
              </View>
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
    width: '90%',
    elevation: 5,
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
