import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import WunderIdCard from '@components/Main/wunderIdCard';
import CredentialCards from '@components/Main/credentialCards';

const HomeScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <WunderIdCard />
        <CredentialCards />
      </ScrollableContainer>
      {/* <FooterMenu /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default HomeScreen;
