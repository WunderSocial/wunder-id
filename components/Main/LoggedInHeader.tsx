import React from 'react';
import HeaderContainer from '@components/HeaderContainer';
import Logo from '@components/WunderLogo';
import { View } from 'react-native';
import LoginRequestBanner from '../LoginRequestBanner';

const LoggedInHeader = () => {
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
        <Logo />
        {/* Cog icon removed */}
      </View>
      <View style={{ marginTop: 12, width: '100%', paddingHorizontal: 20 }} />
    </HeaderContainer>
  );
};

export default LoggedInHeader;
