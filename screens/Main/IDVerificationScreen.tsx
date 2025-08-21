import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import IDVerificationCamera from '@components/credentials/IDVerificationCamera';

const IDVerificationScreen = () => {
  return (
    <View style={styles.container}>
      {/* <LoggedInHeader /> */}
      
        <IDVerificationCamera />
    
      {/* <FooterMenu /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 60,
  },
});

export default IDVerificationScreen;
