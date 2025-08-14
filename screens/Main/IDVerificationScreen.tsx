import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import IDVerification from '@components/verification/IDVerification';

const IDVerificationScreen = () => {
  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <IDVerification />
      </ScrollableContainer>
      <FooterMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default IDVerificationScreen;
