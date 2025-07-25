import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation, NavigationProp, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

const menuItems = [
  { name: 'Home', icon: 'home' },
  { name: 'Wallet', icon: 'credit-card' },
  { name: 'Profile', icon: 'user' },
];

const FooterMenu = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {menuItems.map((item) => {
          const isActive = route.name === item.name;

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={styles.iconWrapper}
              hitSlop={10}
            >
              <Icon
                name={item.icon}
                size={24}
                color={isActive ? '#fff403' : 'white'}
              />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'black',
  },
  container: {
    height: 70,
    backgroundColor: 'black',
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
    position: 'relative',
    zIndex: 10,
  },
  iconWrapper: {
    marginTop: 6,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FooterMenu;
