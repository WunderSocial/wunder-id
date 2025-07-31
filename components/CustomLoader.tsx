import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const CustomLoader = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spinInterpolate }] }]} />
      <Text style={styles.text}>Wunder ID loading...</Text>
    </View>
  );
};

const SPINNER_SIZE = 40;
const SPINNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderWidth: SPINNER_THICKNESS,
    borderRadius: SPINNER_SIZE / 2,
    borderColor: '#fff403',
    borderTopColor: 'transparent', // creates the "spinner" effect by hiding top border
    borderRightColor: 'transparent',
  },
  text: {
    marginTop: 12,
    color: '#fff403',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CustomLoader;
