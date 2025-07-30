import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '@navigation/types';

const MenuScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.pressable} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="white" />
        </Pressable>
        <Text style={styles.header}>Menu</Text>
      </View>

      <Pressable style={styles.item} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.itemText}>Home</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => navigation.navigate('Security')}>
        <Text style={styles.itemText}>Security</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => navigation.navigate('Terms')}>
        <Text style={styles.itemText}>Terms and Conditions</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.itemText}>Settings</Text>
      </Pressable>

      <Pressable style={styles.item} onPress={() => navigation.navigate('RemoveAccount')}>
        <Text style={styles.itemText}>Remove Account</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 85,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 12,
  },
  item: {
    paddingVertical: 16,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  itemText: {
    color: 'white',
    fontSize: 16,
  },
  pressable: {
    padding: 10,
  }
});

export default MenuScreen;
