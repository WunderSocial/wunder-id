import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import CreateEditProfileCredential from '@components/credentials/createEditProfileCredential';
import CreateEditProofOfAgeCredential from '@components/credentials/createProofOfAgeCredential';
import CreateEditLivenessCheckCredential from '@components/credentials/createLivenessCheckCredential';
import { useRoute } from '@react-navigation/native';
import { CREDENTIAL_TYPES } from 'constants/credentials';
import LoggedInHeader from '@components/Main/LoggedInHeader';

const HEADER_HEIGHT = 60; // Adjust this to your LoggedInHeader height

const CredentialEditorScreen = () => {
  const route = useRoute();
  const { credentialType } = route.params as { credentialType: string };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={HEADER_HEIGHT + 20}
    >
      <LoggedInHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          {credentialType === CREDENTIAL_TYPES.BASIC_PROFILE && (
            <CreateEditProfileCredential />
          )}
          {credentialType === CREDENTIAL_TYPES.PROOF_OF_AGE && (
            <CreateEditProofOfAgeCredential />
          )}
          {credentialType === CREDENTIAL_TYPES.LIVENESS_CHECK && (
            <CreateEditLivenessCheckCredential />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  inner: {
    padding: 16,
  },
});

export default CredentialEditorScreen;
