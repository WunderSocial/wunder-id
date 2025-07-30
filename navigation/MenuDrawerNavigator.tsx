import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import HomeScreen from '@screens/Main/HomeScreen';
import ProfileScreen from '@screens/Main/ProfileScreen';
import WalletScreen from '@screens/Main/WalletScreen';
import TermsScreen from '@screens/Settings/TermsScreen';
import SettingsScreen from '@screens/Settings/SettingsScreen';
import SecurityScreen from '@screens/Settings/SecurityScreen';
import RemoveAccountScreen from '@screens/Settings/RemoveAccountScreen';
import CredentialEditorScreen from '@screens/Main/CredentialEditorScreen';
import Logo from '@components/WunderLogo';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: DrawerContentComponentProps) => (
  <DrawerContentScrollView
    {...props}
    contentContainerStyle={{ flex: 1, backgroundColor: '#111111' }}
  >
    <View style={styles.logoContainer}>
      <Logo />
    </View>
    <DrawerItemList {...props} />
  </DrawerContentScrollView>
);

const MainDrawerNavigator = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    drawerContent={CustomDrawerContent}
    screenOptions={{
      headerShown: false,
      drawerPosition: 'right',
      drawerType: 'slide',
      overlayColor: 'rgba(0,0,0,0.7)',
      drawerStyle: {
        backgroundColor: '#111111',
      },
      drawerActiveTintColor: '#fff403',
      drawerInactiveTintColor: '#ffffffff',
      drawerActiveBackgroundColor: 'rgba(255, 244, 3, 0.2)',
      drawerLabelStyle: {
        fontWeight: 'bold',
        fontSize: 16,
      },
    }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} options={{ drawerLabel: 'Wunder ID' }} />
    <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerItemStyle: { display: 'none' } }}  /> 
    <Drawer.Screen name="Wallet" component={WalletScreen} options={{ drawerItemStyle: { display: 'none' } }}  /> 
    <Drawer.Screen name="Terms" component={TermsScreen} options={{ drawerItemStyle: { display: 'none' } }}  /> 
    <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
    <Drawer.Screen name="Security" component={SecurityScreen} options={{ drawerLabel: 'Security Details' }} />
    <Drawer.Screen name="RemoveAccount" component={RemoveAccountScreen} options={{ drawerLabel: 'Remove Account' }} />
    <Drawer.Screen name="CredentialEditor" component={CredentialEditorScreen} options={{ drawerItemStyle: { display: 'none' } }} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
});

export default MainDrawerNavigator;
