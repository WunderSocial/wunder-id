import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

type Props = {
  label: string;
  value: boolean;
  onToggle: (newValue: boolean) => void;
};

const SettingsToggle = ({ label, value, onToggle }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#666', true: '#fff403' }}
        thumbColor={value ? '#000' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
  },
});

export default SettingsToggle;
