import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import WunderWalletOverview from '@components/Main/wunderWallet';

const WalletScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />

      <ScrollableContainer>
        <WunderWalletOverview />
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
  placeholderText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 40,
  },
});

export default WalletScreen;
