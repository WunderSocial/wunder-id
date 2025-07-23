import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const profile = {
  name: 'Jacob Theo-Holsden',
  wunderId: 'jacobtheoholsden.wunderid.eth',
  email: 'jacobtheo@example.com',
  phone: '+351 910 123 456',
  address: '123 Main St, Lisbon, Portugal',
};

const ProfileInfo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileImageWrapper}>
        <ImageBackground
          source={require('../../assets/userprofileplaceholder5.jpg')}
          style={styles.profileHeader}
          imageStyle={styles.profileImage}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.wunderId}>{profile.wunderId}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{profile.phone}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{profile.address}</Text>

        <View style={{ marginBottom: 40 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  profileImageWrapper: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  profileHeader: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileImage: {
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  name: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  wunderId: {
    color: '#ccc',
    fontSize: 14,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 12,
  },
  value: {
    color: 'white',
    fontSize: 16,
  },
});

export default ProfileInfo;
