import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface Props {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

const PinInput = ({ value, onChange, length = 6 }: Props) => {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    if (text) {
      newValue[index] = text;
      onChange(newValue.join('').slice(0, length));
      if (index < length - 1) inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          style={styles.box}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#fff403',
    textAlign: 'center',
    fontSize: 24,
    color: 'white',
    borderRadius: 12,
    backgroundColor: 'black',
  },
});

export default PinInput;
