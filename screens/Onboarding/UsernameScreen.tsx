import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CheckAvailability from '@components/CheckAvailability';
import { checkENSAvailability } from '@lib/ens';

const UsernameScreen = () => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const navigation = useNavigation();

  const handleCheck = async () => {
    setIsChecking(true);
    const available = await checkENSAvailability(username);
    setIsAvailable(available);
    setIsChecking(false);
  };

  const handleClaim = async () => {
    await AsyncStorage.setItem('username', username);
    const fullWunderId = `${username}.wunderid.eth`;
    await SecureStore.setItemAsync('wunderId', fullWunderId);
    console.log('🔐 Stored Wunder ID:', fullWunderId);
    navigation.navigate('PasswordSetup' as never);
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
});

export default UsernameScreen;
