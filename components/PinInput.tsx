import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, Animated } from 'react-native';

interface Props {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export interface PinInputRef {
  focusFirst: () => void;
  triggerShake: () => void;
}

const PinInput = forwardRef<PinInputRef, Props>(({ value, onChange, length = 6 }, ref) => {
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      inputs.current[0]?.focus();
    },
    triggerShake: () => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }));

  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    if (text) {
      newValue[index] = text;
      const updated = newValue.join('').slice(0, length);
      onChange(updated);
      if (index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
    } else {
      newValue[index] = '';
      onChange(newValue.join('').slice(0, length));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (value[index]) {
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join('').slice(0, length));
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}> 
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          style={styles.box}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
        />
      ))}
    </Animated.View>
  );
});

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
 