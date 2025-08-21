import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IDVerification() {
  console.error('[LEGACY IDVerification] This component should not be used anymore.');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>LEGACY IDVerification RENDERED</Text>
      <Text style={styles.msg}>
        This means some import path is still pointing at @components/verification/IDVerification.
        Search your codebase for "IDVerification" and replace with "IDVerificationCamera".
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  title: { color: '#FF4D4F', fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 12 },
  msg: { color: 'white', textAlign: 'center' },
});
