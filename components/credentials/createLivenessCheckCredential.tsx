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

      if (!convexUserId) {
        throw new Error('Missing Convex user ID');
      }

      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      if (!decryptionKey) {
        throw new Error('Missing decryption key');
      }

      if (data.status && data.status.startsWith('PASS')) {
        // Save full payload as encrypted JSON
        const jsonContent = JSON.stringify(data);
        const encryptedContent = await encryptSeed(jsonContent, decryptionKey);

        await issueCredential({
          userId: convexUserId as unknown as Id<'users'>,
          type: CREDENTIAL_TYPES.LIVENESS_CHECK,
          content: encryptedContent,
        });

        Alert.alert('Success', 'Liveness Check credential saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'Liveness Check Failed',
          'Please try again in better lighting or adjust your camera.'
        );
      }
    } catch (error) {
      console.error('Error handling liveness result:', error);
      Alert.alert('Error', String(error));
    } finally {
      setWebviewVisible(false); // close WebView after result
      setLoading(false);
    }
  };

  const handleStartCheck = () => {
    if (!convexUserId) {
      Alert.alert('Error', 'Missing Convex ID');
      return;
    }
    setLastResult(null); // reset previous result
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

      <Modal visible={webviewVisible} animationType="slide">
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
});

export default CreateLivenessCheckCredential;
