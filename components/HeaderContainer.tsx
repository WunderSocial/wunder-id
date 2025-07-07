import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children?: React.ReactNode;
}

const HeaderContainer = ({ children }: Props) => {
  return <SafeAreaView style={styles.container}>
    {children}
    </SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'black',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
    height: 120,
    zIndex: 10,
  },
});

export default HeaderContainer;
