import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import WunderButton from './WunderButton';

interface Props {
  isLoading: boolean;
  isAvailable: boolean | null;
  onCheck: () => void;
  disabled?: boolean;
  label?: string;
}

const CheckAvailability = ({
  isLoading,
  isAvailable,
  onCheck,
  disabled,
  label = 'Check Availability',
}: Props) => {
  return (
    <View style={styles.container}>
      <WunderButton
        title={label}
        onPress={onCheck}
        disabled={disabled}
        loading={isLoading}
      />
      {isLoading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {isAvailable === true && <Text style={styles.available}>Wunder ID Available, Claim now!</Text>}
      {isAvailable === false && <Text style={styles.taken}>Wunder ID Not available, try again</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'center',
  },
  available: {
    color: 'lightgreen',
    marginTop: 12,
    fontSize: 16,
  },
  taken: {
    color: 'tomato',
    marginTop: 12,
    fontSize: 16,
  },
});

export default CheckAvailability;
