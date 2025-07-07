// screens/Onboarding/HomeScreen.tsx
import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import WunderButton from '@components/WunderButton';
import { resetAppState } from '@lib/reset';

const HomeScreen = () => {
  const handleReset = async () => {
    await resetAppState();
    Alert.alert('Reset complete', 'App data has been cleared. Restart the app.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Wunder ID</Text>
      <Text style={styles.title}>Home Screen</Text>
      <WunderButton title="Reset Identity" onPress={handleReset} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default HomeScreen;
