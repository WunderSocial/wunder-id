import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

const WunderButton = ({ title, onPress, disabled, loading, variant = 'primary', style }: Props) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled ? styles.disabled : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? 'black' : '#fff403'} />
      ) : (
        <Text style={isPrimary ? styles.primaryText : styles.secondaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
  paddingVertical: 14,
  paddingHorizontal: 24, // 👈 add this
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 52,
  },
  primary: {
    backgroundColor: '#fff403',
  },
  primaryText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: 'black',
    borderColor: '#fff403',
    borderWidth: 1,
  },
  secondaryText: {
    color: '#fff403',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default WunderButton;
