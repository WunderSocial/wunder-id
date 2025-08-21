import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';

import LoggedInHeader from '@components/Main/LoggedInHeader';
import CreateEditProfileCredential from '@components/credentials/createEditProfileCredential';
import CreateEditLivenessCheckCredential from '@components/credentials/createLivenessCheckCredential';

// ✅ New camera-based verification flow (make sure this path matches your new component)
import IDVerificationCamera from '@components/credentials/IDVerificationCamera';

import { MainDrawerParamList } from '@navigation/types';
import { RouteProp } from '@react-navigation/native';
import { CREDENTIAL_TYPES } from 'constants/credentials';

const HEADER_HEIGHT = 60;

type CredentialEditorRouteProp = RouteProp<MainDrawerParamList, 'CredentialEditor'>;

const CredentialEditorScreen = () => {
  const { params } = useRoute<CredentialEditorRouteProp>();
  const credentialType = params?.credentialType;

  const [focusKey, setFocusKey] = React.useState(0);

  React.useEffect(() => {
    console.log('[CredentialEditorScreen] mounted. Incoming credentialType:', credentialType);
    console.log('[CredentialEditorScreen] CREDENTIAL_TYPES:', CREDENTIAL_TYPES);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setFocusKey((prev) => prev + 1);
      console.log('[CredentialEditorScreen] focused. credentialType:', credentialType);
    }, [credentialType])
  );

  const renderForm = () => {
    if (!credentialType) {
      return <Text style={styles.errorText}>Missing credential type</Text>;
    }

    switch (credentialType) {
      case CREDENTIAL_TYPES.BASIC_PROFILE:
        return <CreateEditProfileCredential key={`profile-${focusKey}`} />;

      // ✅ New: ID_VERIFICATION uses the new camera component
      case CREDENTIAL_TYPES.ID_VERIFICATION:
        return (
          <View>
            <Text style={styles.banner}>USING: IDVerificationCamera (new)</Text>
            <IDVerificationCamera key={`idv-${focusKey}`} />
          </View>
        );

      // ✅ Legacy: still route old requests to the new component
      case CREDENTIAL_TYPES.PROOF_OF_AGE:
        return (
          <View>
            <Text style={styles.banner}>LEGACY route: proof_of_age → IDVerificationCamera</Text>
            <IDVerificationCamera key={`poa-legacy-${focusKey}`} />
          </View>
        );

      case CREDENTIAL_TYPES.LIVENESS_CHECK:
        return <CreateEditLivenessCheckCredential key={`liveness-${focusKey}`} />;

      default:
        return <Text style={styles.errorText}>Invalid credential type</Text>;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={HEADER_HEIGHT + 20}
    >
      <LoggedInHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Text style={styles.debug}>DEBUG: credentialType = {String(credentialType)}</Text>
          {renderForm()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  inner: { padding: 16 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 32 },
  debug: { color: '#FFD700', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  banner: {
    color: '#0af',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    borderRadius: 8,
  },
});

export default CredentialEditorScreen;
