import React from 'react';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@navigation/RootNavigator';
import { View, TouchableOpacity } from 'react-native';
import LoginRequestBanner from './LoginRequestBanner';

const LoggedInHeader = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <HeaderContainer>
      <LoginRequestBanner />
      {/* Top Row with Logo + Settings */}
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

      {/* Login Request Banner will appear below this if there's a pending request */}
      <View style={{ marginTop: 12, width: '100%', paddingHorizontal: 20 }}>
      </View>
    </HeaderContainer>
  );
};

export default LoggedInHeader;
