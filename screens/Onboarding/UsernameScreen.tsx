import React, { useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CheckAvailability from '@components/CheckAvailability';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Username'>;

const UsernameScreen = () => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const convex = useConvex();

  const handleCheck = async () => {
    if (!username) return;
    setIsChecking(true);
    try {
      const available = await convex.query(api.checkUsernameAvailable.checkUsernameAvailable, {
        username,
      });
      setIsAvailable(available);
    } catch (err) {
      console.error('Error checking username availability:', err);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClaim = async () => {
    await AsyncStorage.setItem('username', username);
    const fullWunderId = `${username}.wunderid.eth`;
    await SecureStore.setItemAsync('wunderId', fullWunderId);
    console.log('🔐 Stored Wunder ID:', fullWunderId);
    navigation.navigate('PasswordSetup');
  };

  const footer = (
    <WunderButton
      title="Claim Username"
      onPress={handleClaim}
      disabled={!isAvailable}
    />
  );

  return (
    <BodyContainer
      header={
        <HeaderContainer>
          <Logo />
        </HeaderContainer>
      }
      footer={footer}
    >
      <Text style={styles.heading}>Choose your Wunder ID</Text>
      <WunderInput
        placeholder="username"
        keyboardType="default"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setIsAvailable(null);
        }}
      />
      <CheckAvailability
        isLoading={isChecking}
        isAvailable={isAvailable}
        onCheck={handleCheck}
        disabled={!username}
      />

      <Pressable onPress={() => navigation.navigate('RestoreAccount')}>
        <Text style={styles.link}>Already have an account?</Text>
      </Pressable>
    </BodyContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  link: {
    color: '#fff403',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default UsernameScreen;
