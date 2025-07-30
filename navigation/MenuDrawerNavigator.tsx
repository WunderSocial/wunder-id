import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '@screens/Main/HomeScreen';
import ProfileScreen from '@screens/Main/ProfileScreen';
import WalletScreen from '@screens/Main/WalletScreen';
import TermsScreen from '@screens/Settings/TermsScreen';
import SettingsScreen from '@screens/Settings/SettingsScreen';
import SecurityScreen from '@screens/Settings/SecurityScreen';
import RemoveAccountScreen from '@screens/Settings/RemoveAccountScreen';
import CredentialEditorScreen from '@screens/Main/CredentialEditorScreen';

const Drawer = createDrawerNavigator();

const MainDrawerNavigator = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    screenOptions={{ headerShown: false, drawerType: 'slide', overlayColor: 'rgba(0,0,0,0.7)' }}
  >
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="Profile" component={ProfileScreen} />
    <Drawer.Screen name="Wallet" component={WalletScreen} />
    <Drawer.Screen name="Terms" component={TermsScreen} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
    <Drawer.Screen name="Security" component={SecurityScreen} />
    <Drawer.Screen name="RemoveAccount" component={RemoveAccountScreen} />
    <Drawer.Screen name="CredentialEditor" component={CredentialEditorScreen} />
  </Drawer.Navigator>
);

export default MainDrawerNavigator;
