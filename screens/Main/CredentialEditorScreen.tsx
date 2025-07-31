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
import CreateEditProofOfAgeCredential from '@components/credentials/createProofOfAgeCredential';
import CreateEditLivenessCheckCredential from '@components/credentials/createLivenessCheckCredential';

import { MainDrawerParamList } from '@navigation/types';
import { RouteProp } from '@react-navigation/native';
import { CREDENTIAL_TYPES } from 'constants/credentials';

const HEADER_HEIGHT = 60;

type CredentialEditorRouteProp = RouteProp<MainDrawerParamList, 'CredentialEditor'>;

const CredentialEditorScreen = () => {
  const { params } = useRoute<CredentialEditorRouteProp>();
  const credentialType = params?.credentialType;

  const [focusKey, setFocusKey] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Increment key on focus to trigger re-mount of form
      setFocusKey((prev) => prev + 1);
    }, [])
  );

  const renderForm = () => {
    if (!credentialType) {
      return <Text style={styles.errorText}>Missing credential type</Text>;
    }

    switch (credentialType) {
      case CREDENTIAL_TYPES.BASIC_PROFILE:
        return <CreateEditProfileCredential key={`profile-${focusKey}`} />;
      case CREDENTIAL_TYPES.PROOF_OF_AGE:
        return <CreateEditProofOfAgeCredential key={`age-${focusKey}`} />;
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>{renderForm()}</View>
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default CredentialEditorScreen;
