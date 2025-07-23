import React from 'react';
import { Image, StyleSheet } from 'react-native';

const Logo = () => {
  return (
    <Image
      source={require('../assets/WhiteLogo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    height: 40,
    width: 120,
  },
});

export default Logo;
