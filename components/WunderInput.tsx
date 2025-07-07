import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

const WunderInput = ({ label, placeholder, value, onChangeText }: Props) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: 'white',
    marginBottom: 4,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#222',
    color: 'white',
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    borderRadius: 8,
  },
});

export default WunderInput;
