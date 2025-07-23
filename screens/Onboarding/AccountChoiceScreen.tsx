import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'AccountChoice'>;

const AccountChoiceScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleNewAccount = () => {
    navigation.navigate('Username');
  };

  const handleRestoreAccount = () => {
    navigation.navigate('RestoreAccount');
  };

  return (
    <BodyContainer
      header={
        <HeaderContainer>
          <Logo />
        </HeaderContainer>
      }
    >
      <Text style={styles.heading}>Welcome to Wunder</Text>
      <Text style={styles.subheading}>
        Do you want to create a new identity or restore an existing one?
      </Text>

      <View style={styles.buttonGroup}>
        <WunderButton
          title="Create New Account"
          onPress={handleNewAccount}
          style={styles.button}
        />
        <WunderButton
          title="Restore Existing Account"
          onPress={handleRestoreAccount}
          variant="secondary"
        />
      </View>
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    color: 'lightgray',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  buttonGroup: {
    gap: 16,
  },
  button: {
    marginBottom: 16,
  },
});

export default AccountChoiceScreen;
