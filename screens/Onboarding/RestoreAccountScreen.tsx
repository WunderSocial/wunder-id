import React from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'RestoreAccount'>;

const RestoreAccountScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleContinue = () => {
    navigation.navigate('RestoreWithSeed');
  };

  const handleGoToCreate = () => {
    navigation.navigate('Username');
  };

  return (
    <BodyContainer
      header={
        <HeaderContainer>
          <Logo />
        </HeaderContainer>
      }
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <Pressable onPress={handleGoToCreate}>
            <Text style={styles.link}>Create a new one</Text>
          </Pressable>
        </View>
      }
    >
      <Text style={styles.heading}>Restore Your Wunder Account</Text>
      <Text style={styles.subheading}>
        Use your Seed Phrase or Secret Key to recover your identity and access your account.
      </Text>

      <WunderButton
        title="Continue"
        onPress={handleContinue}
      />
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
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'gray',
    fontSize: 14,
  },
  link: {
    color: '#fff403',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});

export default RestoreAccountScreen;
 