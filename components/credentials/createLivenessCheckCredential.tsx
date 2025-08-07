import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import WunderButton from '@components/WunderButton';
import * as SecureStore from 'expo-secure-store';
import { encryptSeed } from '@lib/crypto';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/types';

type RootStackNavigationProp = NavigationProp<RootStackParamList>;

const CreateLivenessCheckCredential = () => {
  const [convexUserId, setConvexUserId] = useState<string | null>(null);
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const navigation = useNavigation<RootStackNavigationProp>();
  const issueCredential = useMutation(api.credentials.issueCredential);

  useEffect(() => {
    SecureStore.getItemAsync('convexUserId').then(setConvexUserId);
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received liveness result from WebView:', data);
      setLastResult(data);

      if (data.type === 'LIVENESS_FAILED') {
        Alert.alert(
          'Liveness Check Failed',
          data.reason || 'Please try again.',
          [{ text: 'Close', onPress: () => setWebviewVisible(false) }]
        );
        return;
      }

      if (data.type === 'LIVENESS_RESULT' && data.result) {
        if (!convexUserId) throw new Error('Missing Convex user ID');

        const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
        if (!decryptionKey) throw new Error('Missing decryption key');

        const { status } = data.result;
        if (status && status.startsWith('PASS')) {
          const jsonContent = JSON.stringify(data.result);
          const encryptedContent = await encryptSeed(jsonContent, decryptionKey);

          await issueCredential({
            userId: convexUserId as unknown as Id<'users'>,
            type: CREDENTIAL_TYPES.LIVENESS_CHECK,
            content: encryptedContent,
          });

          setWebviewVisible(false);
          Alert.alert('Success', 'Liveness Check credential saved.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        } else {
          setWebviewVisible(false);
          Alert.alert(
            'Liveness Check Failed',
            'Please try again in better lighting or adjust your camera.'
          );
          return;
        }
      }
    } catch (error) {
      console.error('Error handling liveness result:', error);
      Alert.alert('Error', String(error));
      setWebviewVisible(false);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheck = () => {
    if (!convexUserId) {
      Alert.alert('Error', 'Missing Convex ID');
      return;
    }
    setLastResult(null);
    setWebviewVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Liveness Check</Text>

      <WunderButton
        style={styles.btn}
        title="Start Liveness Check"
        onPress={handleStartCheck}
        loading={loading}
      />

      {lastResult && lastResult.status && lastResult.status.startsWith('FAIL') && (
        <WunderButton
          style={styles.btn}
          title="Retry Liveness Check"
          onPress={handleStartCheck}
          variant="secondary"
        />
      )}

      <WunderButton
        style={styles.btn}
        title="Cancel"
        onPress={() => navigation.goBack()}
        variant="secondary"
        disabled={loading}
      />

      <Modal visible={webviewVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ padding: 10 }}>
            <WunderButton
              title="Cancel"
              onPress={() => setWebviewVisible(false)}
              variant="secondary"
              style={styles.closeBtn}
            />
          </View>
          {convexUserId && (
            <WebView
              source={{ uri: `https://wunder-liveness-check.vercel.app/liveness?id=${convexUserId}` }}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              allowsCameraAccess
              allowsMicrophoneAccess
            />
          )}
        </View>
      </Modal>
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
  closeBtn: {
    marginTop: 40,
  }
});

export default CreateLivenessCheckCredential;
