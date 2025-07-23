import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/FooterMenu';
import LoggedInHeader from '@components/LoggedInHeader';
import { resetAppState } from '@lib/reset';

const WalletScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />

      <ScrollableContainer>
        <Text style={styles.placeholderText}>🎉 Wallet Goes Here</Text>

        <View>
          
        </View>
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
