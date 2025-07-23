import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/FooterMenu';
import LoggedInHeader from '@components/LoggedInHeader';
import WunderButton from '@components/WunderButton';
import { resetAppState } from '@lib/reset';
import IdentityCards from '@components/Main/IdentityCards'; 

const HomeScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <IdentityCards />
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

export default HomeScreen;
