import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import WunderButton from '@components/WunderButton';
import { useDecryptedBasicProfile } from 'hooks/useDecryptedBasicProfile';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { encryptSeed } from '@lib/crypto';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import type { Id } from '../../convex/_generated/dataModel';

type Step = 'explainer' | 'confirmProfile' | 'chooseDoc' | 'captureDoc' | 'captureSelfie' | 'processing' | 'result';

const IDVerification = () => {
  const [step, setStep] = useState<Step>('explainer');
  const [documentType, setDocumentType] = useState<'passport' | 'license' | null>(null);
  const [docImageUri, setDocImageUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const { profile, loading } = useDecryptedBasicProfile();
  const issueCredential = useMutation(api.functions.mobile.credentials.issueCredential);
  const getSignedUploadUrl = useMutation(api.functions.mobile.getSignedUploadUrl.getSignedUploadUrl);
  const compareFaces = useAction(api.functions.mobile.compareFaces.compareFaces);
  const extractIdFields = useAction(api.functions.mobile.extractIdFields.extractIdFields);
  const deleteUploadedKeys = useAction(api.functions.mobile.deleteUploadedKeys.deleteUploadedKeys);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const requestCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const handleCaptureDocument = async () => {
    const allowed = await requestCamera();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // will migrate to ImagePicker.MediaType
    });

    if (!result.canceled && result.assets.length > 0) {
      setDocImageUri(result.assets[0].uri);
    }
  };

  const handleCaptureSelfie = async () => {
    const allowed = await requestCamera();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelfieUri(result.assets[0].uri);
    }
  };

  const handleCancel = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const resetFlow = () => {
    setStep('explainer');
    setDocumentType(null);
    setDocImageUri(null);
    setSelfieUri(null);
    setResult(null);
    setSimilarity(null);
    setErrorText(null);
  };

  // Upload image to S3 via signed URL; return {fileUrl, key}
  const uploadImageToS3 = async (uri: string, label: 'document' | 'selfie') => {
    const fileNameGuess = uri.split('/').pop() || `${label}.jpg`;
    const fileTypeGuess =
      fileNameGuess.toLowerCase().endsWith('.png') ? 'image/png' :
      fileNameGuess.toLowerCase().endsWith('.webp') ? 'image/webp' :
      'image/jpeg';

    const { signedUrl, fileUrl, key } = await getSignedUploadUrl({
      fileName: fileNameGuess,
      fileType: fileTypeGuess,
    });

    const localResp = await fetch(uri);
    const blob = await localResp.blob();
    const putResp = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': fileTypeGuess },
      body: blob,
    });
    if (!putResp.ok) throw new Error(`Failed to upload ${label} image to S3`);

    return { fileUrl, key };
  };

  const issueProofOfAgeCredential = async () => {
    try {
      setStep('processing');

      // Small delay to show spinner
      setTimeout(async () => {
        const decryptionKey = await SecureStore.getItemAsync('decryptionKey');
        const userIdStr = await SecureStore.getItemAsync('convexUserId');
        if (!decryptionKey || !userIdStr || !profile) {
          throw new Error('Missing secure credentials or user profile');
        }
        if (!docImageUri || !selfieUri) {
          throw new Error('Missing images. Please capture your document and selfie.');
        }

        let docKey: string | null = null;
        let selfieKey: string | null = null;

        try {
          // 1) Upload both images
          const docUpload = await uploadImageToS3(docImageUri, 'document');
          const selfieUpload = await uploadImageToS3(selfieUri, 'selfie');
          docKey = docUpload.key;
          selfieKey = selfieUpload.key;

          // 2) Face comparison
          const compare = await compareFaces({ docKey, selfieKey, threshold: 90 });

          // Safely access optional error without changing server types
          const compareError: string | undefined =
            compare && typeof compare === 'object' && 'error' in compare
              ? (compare as any).error
              : undefined;

          if (!compare.match) {
            setSimilarity(compare.similarity ?? null);
            setErrorText(compareError ? String(compareError) : null);
            setResult('fail');
            setStep('result');
            return;
          }

          // 3) Extract ID fields from the document image
          const extracted = await extractIdFields({ docKey });

          // Merge extracted with profile fallbacks
          const fullName = extracted.fullName || profile.name;
          const dob = extracted.dob || profile.dob;
          const documentId = extracted.documentId || 'unknown';
          const issuingCountry = extracted.issuingCountry || profile.country || 'unknown';
          const expiry = extracted.expiry || (() => {
            const d = new Date(); d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().split('T')[0];
          })();

          // 4) Issue credential
          const userId = userIdStr as unknown as Id<'users'>;
          const credentialPayload = {
            fullName,
            dob,
            documentId,
            documentType: documentType || 'unknown',
            issuingCountry,
            address: documentType === 'license' ? 'unknown' : null,
            expiry,
          };

          const encrypted = await encryptSeed(JSON.stringify(credentialPayload), decryptionKey);
          await issueCredential({
            userId,
            type: CREDENTIAL_TYPES.PROOF_OF_AGE,
            content: encrypted,
          });

          setSimilarity(compare.similarity ?? null);
          setErrorText(null);
          setResult('success');
          setStep('result');
        } catch (err) {
          console.error(err);
          setErrorText(err instanceof Error ? err.message : String(err));
          setResult('fail');
          setStep('result');
        } finally {
          // 5) Always clean up uploaded images if we have keys
          const keysToDelete = [docKey, selfieKey].filter((k): k is string => Boolean(k));
          if (keysToDelete.length > 0) {
            try {
              await deleteUploadedKeys({ keys: keysToDelete });
            } catch (e) {
              console.warn('[IDVerification] Failed to delete uploaded keys', e);
            }
          }
        }
      }, 400);
    } catch (err) {
      console.error(err);
      setErrorText(err instanceof Error ? err.message : String(err));
      setResult('fail');
      setStep('result');
    }
  };

  const renderCancelButton = () => (
    <WunderButton variant="secondary" title="Cancel" onPress={handleCancel} style={styles.cancelButton} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff403" />
        <Text style={styles.text}>Loading your profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return <Text style={styles.text}>No profile found. Please complete your profile first.</Text>;
  }

  if (step === 'explainer') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Verify Your Identity</Text>
        <Text style={styles.text}>
          You’ll need to take a photo of your ID (passport or driver’s license) and a selfie. We’ll compare the two and check your date of birth.
        </Text>
        <WunderButton variant="primary" onPress={() => setStep('confirmProfile')} title="Start Verification" />
        {renderCancelButton()}
      </View>
    );
  }

  if (step === 'confirmProfile') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Confirm Your Profile</Text>
        <Text style={styles.text}>Name: {profile.name}</Text>
        <Text style={styles.text}>Date of Birth: {profile.dob}</Text>
        <Text style={styles.text}>Country: {profile.country}</Text>
        <WunderButton variant="primary" onPress={() => setStep('chooseDoc')} title="Confirm and Continue" />
        {renderCancelButton()}
      </View>
    );
  }

  if (step === 'chooseDoc') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Choose Document Type</Text>
        <Text style={styles.text}>Please choose the type of ID you’d like to upload:</Text>

        <Text style={styles.textSmall}>Passport: Recommended for global support and faster processing.</Text>
        <WunderButton
          variant={documentType === 'passport' ? 'primary' : 'secondary'}
          onPress={() => { setDocumentType('passport'); setStep('captureDoc'); }}
          title="Use Passport"
          style={{ marginBottom: 12 }}
        />

        <Text style={styles.textSmall}>Driver’s License: UK only, experimental support.</Text>
        <WunderButton
          variant={documentType === 'license' ? 'primary' : 'secondary'}
          onPress={() => { setDocumentType('license'); setStep('captureDoc'); }}
          title="Use Driver’s License"
        />
        {renderCancelButton()}
      </View>
    );
  }

  if (step === 'captureDoc') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>
          {documentType === 'passport' ? 'Take a Photo of Your Passport' : 'Take a Photo of Your Driver’s License'}
        </Text>
        <Text style={styles.text}>Make sure the photo is clear and fully visible.</Text>

        {!docImageUri ? (
          <WunderButton variant="primary" title="Capture Document" onPress={handleCaptureDocument} />
        ) : (
          <>
            <Image source={{ uri: docImageUri }} style={styles.cameraPreview} />
            <WunderButton variant="primary" title="Continue" onPress={() => setStep('captureSelfie')} style={{ marginBottom: 12 }} />
            <WunderButton variant="secondary" title="Retake Photo" onPress={() => setDocImageUri(null)} />
          </>
        )}
        {renderCancelButton()}
      </View>
    );
  }

  if (step === 'captureSelfie') {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>Take a Selfie</Text>
        <Text style={styles.text}>Make sure your face is clearly visible, with good lighting.</Text>

        {!selfieUri ? (
          <WunderButton variant="primary" title="Capture Selfie" onPress={handleCaptureSelfie} />
        ) : (
          <>
            <Image source={{ uri: selfieUri }} style={[styles.cameraPreview, { transform: [{ scaleX: -1 }] }]} />
            <WunderButton variant="primary" title="Finish Verification" onPress={issueProofOfAgeCredential} style={{ marginBottom: 12 }} />
            <WunderButton variant="secondary" title="Retake Selfie" onPress={() => setSelfieUri(null)} />
          </>
        )}
        {renderCancelButton()}
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.stepContainer}>
        <ActivityIndicator size="large" color="#fff403" />
        <Text style={styles.text}>Processing your verification…</Text>
      </View>
    );
  }

  if (step === 'result') {
    const isSuccess = result === 'success';
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.heading}>{isSuccess ? 'Verification Complete' : 'Verification Failed'}</Text>
        <Text style={styles.text}>
          {isSuccess
            ? `Face match confirmed${typeof similarity === 'number' ? ` (${similarity.toFixed(0)}%)` : ''}. Your Proof of Age credential has been saved.`
            : errorText
              ? `We couldn't verify your identity: ${errorText}`
              : `Face mismatch${typeof similarity === 'number' ? ` (${similarity.toFixed(0)}%)` : ''}. Please retake your photos and try again.`}
        </Text>

        {isSuccess ? (
          <WunderButton
            variant="primary"
            title="Back to Home"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          />
        ) : (
          <>
            <WunderButton variant="primary" title="Try Again" onPress={resetFlow} style={{ marginBottom: 12 }} />
            {renderCancelButton()}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.text}>Step: {step}</Text>
      {renderCancelButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: { padding: 20 },
  heading: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 12 },
  text: { color: 'white', fontSize: 16, marginBottom: 16 },
  textSmall: { color: '#ccc', fontSize: 13, marginBottom: 12 },
  loadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  cameraPreview: { width: '100%', height: 400, marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  cancelButton: { marginTop: 24 },
});

export default IDVerification;
