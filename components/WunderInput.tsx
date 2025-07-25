import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const WunderInput = ({ label, placeholder, value, keyboardType = 'default', onChangeText, secureTextEntry }: Props) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
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
 