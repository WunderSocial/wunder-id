import React from 'react';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import { View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import LoginRequestBanner from '../LoginRequestBanner';

const LoggedInHeader = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <HeaderContainer>
      <LoginRequestBanner />
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('Home')}
          hitSlop={10}
          accessibilityLabel="Home"
          accessibilityHint="Navigate to Home screen"
        >
          <Logo />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Menu')}
          hitSlop={10}
          style={{ padding: 8 }}
          accessibilityLabel="Menu"
          accessibilityHint="Navigate to Menu screen"
        >
          <Icon name="settings" size={28} color="white" />
        </Pressable>
      </View>
    </HeaderContainer>
  );
};

export default LoggedInHeader;
