import React from 'react';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@navigation/RootNavigator'; // Adjust the path if needed
import { View, TouchableOpacity } from 'react-native';

const LoggedInHeader = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <HeaderContainer>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
      >
        <Logo />
        <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
          <Icon name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </HeaderContainer>
  );
};

export default LoggedInHeader;
