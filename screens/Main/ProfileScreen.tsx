import React from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import FooterMenu from '@components/Main/FooterMenu';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import ProfileInfo from '@components/Main/ProfileInfo';

const ProfileScreen = () => {

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <ScrollableContainer>
        <View>
          <ProfileInfo />
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
});

export default ProfileScreen;
