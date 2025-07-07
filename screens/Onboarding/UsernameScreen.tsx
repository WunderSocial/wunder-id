import React, { useState } from 'react';
import { Text, StyleSheet} from 'react-native';
import BodyContainer from '@components/BodyContainer';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import WunderInput from '@components/WunderInput';
import WunderButton from '@components/WunderButton';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckAvailability from '@components/CheckAvailability';
import { checkENSAvailability } from '@lib/ens';

const UsernameScreen = () => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    const available = await checkENSAvailability(username);
    setIsAvailable(available);
    setIsChecking(false);
  };

  const navigation = useNavigation();

  const footer = (
  <WunderButton
    title="Claim Username"
    onPress={async () => {
      await AsyncStorage.setItem('username', username);
      navigation.navigate('PasswordSetup' as never);
    }}
    disabled={!isAvailable}
  />
);

  return (
    <BodyContainer header={
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
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  available: {
    color: 'lightgreen',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  taken: {
    color: 'tomato',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  TextInput: {
    borderColor: 'red', // 🔍
  borderWidth: 1,
  }
});

export default UsernameScreen;
