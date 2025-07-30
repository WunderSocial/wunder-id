import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import LoggedInHeader from '@components/Main/LoggedInHeader';

const TermsScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <View>
          <Text style={styles.sample}>Terms & Conditions</Text>
        </View>
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
  sample: {
    marginTop: 50,
    color: 'white',
    textAlign: 'center',
    fontSize: 50,
  }
});

export default TermsScreen;
