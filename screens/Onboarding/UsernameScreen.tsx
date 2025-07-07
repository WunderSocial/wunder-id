import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import WunderInput from '@components/WunderInput';
import CheckAvailability from '@components/CheckAvailability';
import { checkENSAvailability } from '@lib/ens';

const UsernameScreen = () => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    const available = await checkENSAvailability(username);
    setIsAvailable(available);
    setIsChecking(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose your Wunder ID</Text>
      <WunderInput
        placeholder="username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setIsAvailable(null); // reset availability on edit
        }}
      />
      <CheckAvailability
        isLoading={isChecking}
        isAvailable={isAvailable}
        onCheck={handleCheck}
        disabled={!username}
      />
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
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  available: {
    color: 'lightgreen',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  taken: {
    color: 'tomato',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UsernameScreen;
