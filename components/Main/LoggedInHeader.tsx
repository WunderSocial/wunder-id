import React from 'react';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import { View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import LoginRequestBanner from '../LoginRequestBanner';

type DrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Wallet: undefined;
  Terms: undefined;
  Settings: undefined;
  Security: undefined;
  RemoveAccount: undefined;
  CredentialEditor: undefined;
};

const LoggedInHeader = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

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
          accessibilityLabel="Go to home screen"
          accessibilityHint="Navigates to the Home screen"
        >
          <Logo />
        </Pressable>

        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={10}
          style={{ padding: 8 }}
          accessibilityLabel="Menu"
          accessibilityHint="Open the menu drawer"
        >
          <Icon name="settings" size={28} color="white" />
        </Pressable>
      </View>
    </HeaderContainer>
  );
};

export default LoggedInHeader;
