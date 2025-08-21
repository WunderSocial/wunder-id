import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import WunderButton from '@components/WunderButton';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { encryptSeed } from '@lib/crypto';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import type { Id } from '../../convex/_generated/dataModel';

type Step = 'chooseDoc' | 'captureDoc' | 'captureSelfie' | 'processing' | 'result';
type DocType = 'passport' | 'license';

type Extracted = {
  documentType?: DocType;
  issuingCountry?: string;
  issuingAuthority?: string | null;
  surname?: string | null;
  firstWithTitle?: string | null;
  fullName?: string | null;
  documentId?: string | null;
  address?: string | null;
  addressPreview?: string | null;
  dob?: string | null;
  dobRaw?: string | null;
  validFrom?: string | null;
  expiry?: string | null;
};

const { width: SCREEN_W } = Dimensions.get('window');
const CAMERA_HEIGHT = Math.min(560, Math.round(SCREEN_W * 1.2));

const chunkLog = (label: string, payload: any, size = 900) => {
  try {
    const s = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (let i = 0; i < s.length; i += size) {
      // eslint-disable-next-line no-console
      console.log(`[${label}] part ${Math.floor(i / size) + 1}:`, s.slice(i, i + size));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`[${label}] (non-serializable)`, e);
  }
};

// ✅ Minimal helper: prefer dob → dobRaw → dateOfBirth
const pickDob = (ex: Partial<Extracted> | null | undefined): string | null => {
  if (!ex) return null;
  const v =
    (typeof ex.dob === 'string' && ex.dob.trim()) ||
    (typeof ex.dobRaw === 'string' && ex.dobRaw.trim()) ||
    (typeof (ex as any).dateOfBirth === 'string' && (ex as any).dateOfBirth.trim()) ||
    null;
  return v || null;
};

const IDVerificationCamera = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [step, setStep] = useState<Step>('chooseDoc');
  const [documentType, setDocumentType] = useState<DocType | null>(null);

  const [cameraPermission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  const [docUri, setDocUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [savedPayload, setSavedPayload] = useState<Record<string, any> | null>(null);

  // --- Convex hooks ---
  const getSignedUploadUrl = useMutation(api.functions.mobile.getSignedUploadUrl.getSignedUploadUrl);
  const issueCredential = useMutation(api.functions.mobile.credentials.issueCredential);

  // Prefer mobile.* paths (your current app), fall back to shared.* if that's where you put them now.
  const compareFaces = useAction(
    ((api as any).functions?.mobile?.compareFaces?.compareFaces ??
      (api as any).functions?.shared?.compareFaces?.compareFaces) as any
  );
  const extractIdFields = useAction(
    ((api as any).functions?.mobile?.extractIdFields?.extractIdFields ??
      (api as any).functions?.shared?.extractIdFields?.extractIdFields) as any
  );
  const deleteUploadedKeys = useAction(
    ((api as any).functions?.mobile?.deleteUploadedKeys?.deleteUploadedKeys ??
      (api as any).functions?.shared?.deleteUploadedKeys?.deleteUploadedKeys) as any
  );

  // --- camera helpers ---
  const ensurePermission = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) throw new Error('Camera permission denied');
    }
  };

  const handleOpenCameraForDoc = async () => {
    if (!documentType) return;
    await ensurePermission();
    setDocUri(null);
    setCameraReady(false);
    setStep('captureDoc');
  };

  const handleOpenCameraForSelfie = async () => {
    await ensurePermission();
    setSelfieUri(null);
    setCameraReady(false);
    setStep('captureSelfie');
  };

  const chooseAndOpen = async (dt: DocType) => {
    setDocumentType(dt);
    await ensurePermission();
    setDocUri(null);
    setCameraReady(false);
    setStep('captureDoc');
  };

  const takePhoto = async (): Promise<string | null> => {
    const cam = cameraRef.current;
    if (!cam?.takePictureAsync) return null;
    const pic = await cam.takePictureAsync({
      quality: 0.9,
      skipProcessing: true,
      base64: false,
    });
    return pic?.uri ?? null;
  };

  // Upload image to S3 via signed URL; return { key }
  const uploadImageToS3 = async (uri: string, label: 'document' | 'selfie') => {
    const fileNameGuess = uri.split('/').pop() || `${label}.jpg`;
    const fileTypeGuess =
      fileNameGuess.toLowerCase().endsWith('.png') ? 'image/png' :
      fileNameGuess.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    const { signedUrl, key } = await getSignedUploadUrl({ fileName: fileNameGuess, fileType: fileTypeGuess });
    const localResp = await fetch(uri);
    const blob = await localResp.blob();
    const putResp = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': fileTypeGuess }, body: blob });
    if (!putResp.ok) throw new Error(`Failed to upload ${label} image to S3`);
    return { key };
  };

  const runVerification = async () => {
    let uploadedDocKey: string | null = null;
    let uploadedSelfieKey: string | null = null;

    try {
      if (!docUri || !selfieUri || !documentType) {
        setErrorText('Missing document, selfie, or document type.');
        setResult('fail');
        setStep('result');
        return;
      }

      setStep('processing');
      setErrorText(null);
      setSimilarity(null);
      setExtracted(null);
      setSavedPayload(null);

      const [{ key: docKey }, { key: selfieKey }] = await Promise.all([
        uploadImageToS3(docUri, 'document'),
        uploadImageToS3(selfieUri, 'selfie'),
      ]);
      uploadedDocKey = docKey;
      uploadedSelfieKey = selfieKey;

      // Face compare (selfie as Source, doc as Target).
      const cmp = await compareFaces({ docKey, selfieKey, threshold: 90 });
      if (!cmp.match) {
        setSimilarity(cmp.similarity ?? null);
        setResult('fail');
        setErrorText(`Face mismatch${typeof cmp.similarity === 'number' ? ` (${cmp.similarity.toFixed(0)}%)` : ''}`);
        setStep('result');
        return;
      }
      setSimilarity(cmp.similarity ?? null);

      // Extract fields — passport vs licence is decided strictly by your choice.
      const ext = await extractIdFields({
        docKey,
        documentType, // 'passport' | 'license'
        debug: true,
      });
      if (__DEV__) chunkLog('IDV/EXTRACTED', ext);

      const ex = ext as Extracted;
      setExtracted(ex);

      // ------ Build payload ONLY from extracted fields (no Basic Profile fallbacks) ------
      const fullName =
        ex.fullName ||
        `${ex.firstWithTitle || ''} ${ex.surname || ''}`.trim() ||
        null;

      // ✅ Use pickDob so licence DOB makes it into the payload
      const poaPayload: Record<string, any> = {
        fullName,
        dob: pickDob(ex),                 // <-- HERE
        dobRaw: ex.dobRaw || null,
        documentId: ex.documentId || null,
        documentType, // as selected
        issuingCountry: ex.issuingCountry || null,
        issuingAuthority: ex.issuingAuthority || null,
        // Licence may contain address; passports usually won't. We save whatever was extracted.
        address: (ex.address && ex.address.trim()) || (ex.addressPreview && ex.addressPreview.trim()) || null,
        validFrom: ex.validFrom || null,
        expiry: ex.expiry || null,
      };

      if (__DEV__) chunkLog('IDV/POA_PAYLOAD', poaPayload);
      setSavedPayload(poaPayload);

      // ------ Encrypt & issue credential (PROOF_OF_AGE) ------
      const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
      const userIdStr = await SecureStore.getItemAsync('convexUserId');
      if (!decryptionKey || !userIdStr) {
        throw new Error('Missing secure keys (decryptionKey or user id).');
      }

      const userId = userIdStr as unknown as Id<'users'>;
      const encrypted = await encryptSeed(JSON.stringify(poaPayload), decryptionKey);

      await issueCredential({
        userId,
        type: CREDENTIAL_TYPES.PROOF_OF_AGE,
        content: encrypted,
      });

      setResult('success');
      setStep('result');
    } catch (err: any) {
      console.error('[IDV] Error:', err);
      setErrorText(err?.message ? String(err.message) : String(err));
      setResult('fail');
      setStep('result');
    } finally {
      // Best-effort: delete uploaded S3 keys if the action exists.
      try {
        const keysToDelete = [uploadedDocKey, uploadedSelfieKey].filter(Boolean) as string[];
        if (keysToDelete.length && deleteUploadedKeys) {
          await deleteUploadedKeys({ keys: keysToDelete });
        }
      } catch (e) {
        console.warn('[IDV] Failed to delete uploaded images:', e);
      }
    }
  };

  // ---- Cancel handling (persistent) ----
  const handleCancel = () => {
    // reset any local state
    setStep('chooseDoc');
    setDocumentType(null);
    setDocUri(null);
    setSelfieUri(null);
    setResult(null);
    setSimilarity(null);
    setErrorText(null);
    setExtracted(null);
    setSavedPayload(null);
    // navigate home
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  // Framing overlays (rectangle for doc, circle for selfie)
  const FrameOverlay = ({ variant }: { variant: 'passport' | 'license' | 'selfie' }) => {
    if (variant === 'selfie') {
      const size = Math.min(SCREEN_W * 0.65, 320);
      return (
        <View style={styles.overlayRoot} pointerEvents="none">
          <View style={[styles.circleFrame, { width: size, height: size, borderRadius: size / 2 }]} />
          <Text style={styles.overlayHint}>Center your face in the circle</Text>
        </View>
      );
    }
    const widthPx = SCREEN_W * 0.86;
    const aspect = variant === 'passport' ? (4 / 3) : 1.586; // licence approx ratio
    const heightPx = Math.min(widthPx / aspect, CAMERA_HEIGHT * 0.7);
    return (
      <View style={styles.overlayRoot} pointerEvents="none">
        <View style={[styles.rectFrame, { width: widthPx, height: heightPx }]} />
        <Text style={styles.overlayHint}>
          {variant === 'passport' ? 'Fit passport inside the frame' : 'Fit licence inside the frame'}
        </Text>
      </View>
    );
  };

  const renderCamera = (
    facing: 'back' | 'front',
    overlay: 'passport' | 'license' | 'selfie',
    onShot: (uri: string) => void,
    title: string
  ) => {
    return (
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={() => setCameraReady(true)}
        />
        <FrameOverlay variant={overlay} />

        {!cameraReady && (
          <View style={styles.cameraLoading}>
            <ActivityIndicator size="large" color="#fff403" />
            <Text style={styles.textSmall}>Warming up camera…</Text>
          </View>
        )}

        <View style={styles.captureBar}>
          <WunderButton
            variant="primary"
            title={title}
            onPress={async () => {
              try {
                const uri = await takePhoto();
                if (uri) onShot(uri);
              } catch (e: any) {
                setErrorText(e?.message ? String(e.message) : String(e));
                setResult('fail');
                setStep('result');
              }
            }}
          />
          <View style={{ height: 8 }} />
          <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} />
        </View>
      </View>
    );
  };

  // ——— Render ———

  if (step === 'chooseDoc') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Choose Document Type</Text>
        <Text style={styles.text}>Select the type of ID you’ll capture, then we’ll take a photo of it and a selfie.</Text>

        <WunderButton
          variant={documentType === 'passport' ? 'primary' : 'secondary'}
          title="Use Passport"
          onPress={() => chooseAndOpen('passport')}
          style={{ marginBottom: 12 }}
        />
        <WunderButton
          variant={documentType === 'license' ? 'primary' : 'secondary'}
          title="Use Driver’s License"
          onPress={() => chooseAndOpen('license')}
        />

        <View style={{ height: 16 }} />
        <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} />
      </View>
    );
  }

  if (step === 'captureDoc') {
    const overlay = documentType === 'passport' ? 'passport' : 'license';
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>
          {documentType === 'passport' ? 'Capture Passport' : 'Capture Driver’s License'}
        </Text>
        <Text style={styles.text}>Align the document in the frame and take a clear photo.</Text>

        {!docUri
          ? renderCamera('back', overlay, (uri) => { setDocUri(uri); }, 'Capture Document')
          : (
            <>
              <Image source={{ uri: docUri }} style={styles.preview} />
              <WunderButton variant="secondary" title="Retake" onPress={() => setDocUri(null)} />
              <View style={{ height: 10 }} />
              <WunderButton variant="primary" title="Continue to Selfie" onPress={handleOpenCameraForSelfie} />
              <View style={{ height: 10 }} />
              <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} />
            </>
          )
        }
      </View>
    );
  }

  if (step === 'captureSelfie') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Capture Selfie</Text>
        <Text style={styles.text}>Make sure your face is centered and well lit.</Text>

        {!selfieUri
          ? renderCamera('front', 'selfie', (uri) => { setSelfieUri(uri); }, 'Capture Selfie')
          : (
            <>
              <Image source={{ uri: selfieUri }} style={[styles.preview, { transform: [{ scaleX: -1 }] }]} />
              <WunderButton variant="secondary" title="Retake" onPress={() => setSelfieUri(null)} />
              <View style={{ height: 10 }} />
              <WunderButton
                variant="primary"
                title="Run Verification"
                onPress={runVerification}
                disabled={!docUri || !selfieUri || !documentType}
              />
              <View style={{ height: 10 }} />
              <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} />
            </>
          )
        }
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.stepContainer}>
        <ActivityIndicator size="large" color="#fff403" />
        <Text style={styles.text}>Processing your verification…</Text>

        <View style={{ height: 16 }} />
        <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} />
      </View>
    );
  }

  if (step === 'result') {
    const isSuccess = result === 'success';
    return (
      <View style={styles.stepContainer}>
        <View style={[styles.resultCard, isSuccess ? styles.passBorder : styles.failBorder]}>
          <Text style={[styles.resultTitle, isSuccess ? styles.passText : styles.failText]}>
            {isSuccess ? 'Verification Complete' : 'Verification Failed'}
          </Text>

          {typeof similarity === 'number' && (
            <Text style={styles.textSmall}>Face match: {similarity.toFixed(0)}%</Text>
          )}

          {isSuccess && extracted && (
            <>
              <Text style={styles.sectionLabel}>Extracted (from document only)</Text>
              <KV k="Document type" v={extracted.documentType || ''} />
              <KV k="Full name" v={extracted.fullName || `${extracted.firstWithTitle ?? ''} ${extracted.surname ?? ''}`.trim()} />
              {/* ✅ Show DOB using pickDob so licence DOB is visible */}
              <KV k="DOB" v={(extracted.dob || extracted.dobRaw) ?? ''} />
              <KV k="Expiry" v={extracted.expiry || ''} />
              <KV k="Document ID" v={extracted.documentId || ''} />
              <KV k="Issuing country" v={extracted.issuingCountry || ''} />
              <KV k="Issuing authority" v={extracted.issuingAuthority || ''} />
              <KV
                k="Address"
                v={(extracted.address && extracted.address.trim()) ||
                   (extracted.addressPreview && extracted.addressPreview.trim()) ||
                   ''}
              />
            </>
          )}

          {!isSuccess && errorText ? (
            <Text style={[styles.text, { color: '#FF7A7A' }]}>{errorText}</Text>
          ) : null}

          <View style={{ height: 12 }} />
          <WunderButton variant="secondary" title="Complete" onPress={handleCancel} />
        </View>
      </View>
    );
  }

  return null;
};

const KV = ({ k, v }: { k: string; v?: string | null }) => {
  if (!v) return null;
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{k}:</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { padding: 20, flex: 1 },
  heading: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  text: { color: 'white', fontSize: 16, marginBottom: 16 },
  textSmall: { color: '#ccc', fontSize: 13, marginTop: 8 },

  cameraWrap: {
    position: 'relative',
    width: '100%',
    height: CAMERA_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: { ...StyleSheet.absoluteFillObject },

  cameraLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  rectFrame: {
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 10,
  },
  circleFrame: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  overlayHint: {
    color: '#fff',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  captureBar: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
  },

  preview: { width: '100%', height: 420, marginBottom: 12, borderRadius: 8, backgroundColor: '#000' },

  resultCard: { marginTop: 8, borderRadius: 12, padding: 16, backgroundColor: '#111', borderWidth: 2 },
  passBorder: { borderColor: '#35C759' },
  failBorder: { borderColor: '#FF3B30' },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: 'white' },
  passText: { color: '#35C759' },
  failText: { color: '#FF3B30' },
  sectionLabel: { color: '#fff', marginTop: 8, marginBottom: 6, fontWeight: '600' },

  kv: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  k: { color: '#ddd', fontSize: 16 },
  v: { color: '#fff', fontSize: 16, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
});

export default IDVerificationCamera;
