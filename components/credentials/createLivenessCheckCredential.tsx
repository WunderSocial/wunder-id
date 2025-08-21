import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
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

type LivenessPayload = {
  type: 'LIVENESS_RESULT' | 'LIVENESS_FAILED';
  reason?: string;
  result?: {
    status?: string; // e.g., "PASS ..." or "FAIL ..."
    confidence?: number;
    Confidence?: number;
    AgeRange?: { High?: number; Low?: number } | { high?: number; low?: number } | null;
    [k: string]: any;
  };
};

const CreateLivenessCheckCredential = () => {
  const [convexUserId, setConvexUserId] = useState<string | null>(null);
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [statusText, setStatusText] = useState<string | null>(null);
  const [formattedConfidence, setFormattedConfidence] = useState<string | null>(null);
  const [formattedAgeRange, setFormattedAgeRange] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const navigation = useNavigation<RootStackNavigationProp>();
  const issueCredential = useMutation(api.functions.mobile.credentials.issueCredential);

  useEffect(() => {
    SecureStore.getItemAsync('convexUserId').then(setConvexUserId);
  }, []);

  const formatConfidence = (obj: any): string | null => {
    const val =
      (obj?.confidence as number | undefined) ??
      (obj?.Confidence as number | undefined);
    if (typeof val === 'number' && isFinite(val)) {
      return `${Math.round(val)}%`;
    }
    for (const k of Object.keys(obj || {})) {
      const v = obj[k];
      if (k.toLowerCase().includes('confidence') && typeof v === 'number') {
        return `${Math.round(v)}%`;
      }
    }
    return null;
  };

  const formatAgeRange = (obj: any): string | null => {
    const ar = obj?.AgeRange ?? obj?.ageRange ?? obj?.agerange ?? null;
    if (!ar || typeof ar !== 'object') return null;
    const high = (ar.High as number | undefined) ?? (ar.high as number | undefined);
    const low = (ar.Low as number | undefined) ?? (ar.low as number | undefined);
    if (typeof low === 'number' && typeof high === 'number') {
      return `${Math.round(low)} to ${Math.round(high)} years old`;
    }
    return null;
  };

  const handleMessage = async (event: any) => {
    try {
      const data: LivenessPayload = JSON.parse(event.nativeEvent.data);
      setErrorText(null);
      setLoading(true);

      if (data.type === 'LIVENESS_FAILED') {
        setStatusText('Liveness Check Failed');
        setFormattedConfidence(null);
        setFormattedAgeRange(null);
        setErrorText(data.reason || 'Please try again.');
        setWebviewVisible(false);
        return;
      }

      if (data.type === 'LIVENESS_RESULT' && data.result) {
        const statusRaw = data.result.status || '';
        const status = statusRaw.split(' ')[0] || statusRaw; // "PASS ..." -> "PASS"
        const confidence = formatConfidence(data.result);     // "79%"
        const ageRange = formatAgeRange(data.result);         // "00 to 00 years old"

        setStatusText(status === 'PASS' ? 'Liveness Check Passed' : 'Liveness Check Failed');
        setFormattedConfidence(confidence);
        setFormattedAgeRange(ageRange);
        setWebviewVisible(false);

        if (status === 'PASS') {
          if (!convexUserId) throw new Error('Missing Convex user ID');
          const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
          if (!decryptionKey) throw new Error('Missing decryption key');

          // ✅ Minimal, cleaned credential content (no raw payload)
          const cleanedContent = {
            status,                 // "PASS"
            confidence: confidence ?? null,          // "79%"
            ageRange: ageRange ?? null,              // "00 to 00 years old"
          };

          const encryptedContent = await encryptSeed(JSON.stringify(cleanedContent), decryptionKey);
          await issueCredential({
            userId: convexUserId as unknown as Id<'users'>,
            type: CREDENTIAL_TYPES.LIVENESS_CHECK,
            content: encryptedContent,
          });
        }
        return;
      }

      setStatusText('Liveness Check');
      setErrorText('Unexpected response. Please try again.');
      setWebviewVisible(false);
    } catch (error: any) {
      console.error('Error handling liveness result:', error);
      setStatusText('Error');
      setErrorText(error?.message ? String(error.message) : String(error));
      setWebviewVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheck = () => {
    if (!convexUserId) {
      setStatusText('Error');
      setErrorText('Missing Convex ID');
      return;
    }
    setFormattedConfidence(null);
    setFormattedAgeRange(null);
    setErrorText(null);
    setStatusText(null);
    setWebviewVisible(true);
  };

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const isPass = (statusText || '').toLowerCase().includes('passed');
  const isFail = (statusText || '').toLowerCase().includes('failed');
  const showingResult = Boolean(statusText || formattedConfidence || formattedAgeRange || errorText);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Liveness Check</Text>

      {/* Start/Retry button: hidden on PASS, "Try Again" on FAIL */}
      {!isPass && (
        <WunderButton
          style={styles.btn}
          title={isFail ? 'Try Again' : 'Start Liveness Check'}
          onPress={handleStartCheck}
          loading={loading}
          disabled={loading}
        />
      )}

      {/* Hide top-level Cancel while showing results */}
      {!showingResult && (
        <WunderButton
          style={styles.btn}
          title="Cancel"
          onPress={goHome}
          variant="secondary"
          disabled={loading}
        />
      )}

      {/* Result area (no alerts) */}
      {showingResult && (
        <View style={[styles.resultCard, isPass ? styles.passBorder : isFail ? styles.failBorder : styles.neutralBorder]}>
          <Text style={[styles.resultTitle, isPass ? styles.passText : isFail ? styles.failText : styles.neutralText]}>
            {statusText}
          </Text>

          {formattedConfidence && (
            <Text style={styles.resultLine}>
              Confidence: <Text style={styles.resultValue}>{formattedConfidence}</Text>
            </Text>
          )}

          {formattedAgeRange && (
            <Text style={styles.resultLine}>
              Age range: <Text style={styles.resultValue}>{formattedAgeRange}</Text>
            </Text>
          )}

          {errorText && (
            <Text style={[styles.resultLine, styles.errorText]}>{errorText}</Text>
          )}

          <View style={{ height: 12 }} />

          {isPass ? (
            <WunderButton
              title="Back to Home"
              variant="primary"
              onPress={goHome}
            />
          ) : (
            <>
              <WunderButton
                title="Try Again"
                onPress={handleStartCheck}
                variant="primary"
                style={{ marginBottom: 12 }}
              />
              <WunderButton
                title="Back to Home"
                onPress={goHome}
                variant="secondary"
              />
            </>
          )}
        </View>
      )}

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
          {!convexUserId ? (
            <View style={styles.loadingView}>
              <ActivityIndicator color="#fff403" />
            </View>
          ) : (
            <WebView
              source={{ uri: `https://wunder-liveness-check.vercel.app/liveness?id=${convexUserId}` }}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              // @ts-ignore platform-specific props; safe to leave
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
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 24, textAlign: 'center' },
  btn: { marginTop: 20 },
  closeBtn: { marginTop: 40 },

  // extra space at the top of the results area
  resultCard: {
    marginTop: 32,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#111',
    borderWidth: 2,
  },
  passBorder: { borderColor: '#35C759' },
  failBorder: { borderColor: '#FF3B30' },
  neutralBorder: { borderColor: '#fff403' },

  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  passText: { color: '#35C759' },
  failText: { color: '#FF3B30' },
  neutralText: { color: '#fff' },

  resultLine: { color: '#ddd', marginTop: 4, fontSize: 16 },
  resultValue: { color: '#fff' },
  errorText: { color: '#FF7A7A' },

  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default CreateLivenessCheckCredential;
