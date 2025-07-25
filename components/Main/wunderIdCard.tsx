import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WunderIdCard = () => {
  const [wunderId, setWunderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWunderId = async () => {
      const id = await SecureStore.getItemAsync('wunderId');
      setWunderId(id);
    };
    fetchWunderId();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top Row: Avatar + Wunder ID */}
        <View style={styles.topRow}>
          <Image
            source={require('../../assets/placeholder-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.idSection}>
            <Text style={styles.label}>Wunder ID:</Text>
            <Text style={styles.value}>
                {wunderId ? `${wunderId.split('.')[0]}@wunder` : 'Loading...'}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Info on left, QR on right */}
        <View style={styles.bottomRow}>
          <View style={styles.infoLeft}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.valueInline}>Unknown</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>D.O.B:</Text>
              <Text style={styles.valueInline}>Unknown</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.valueInline}>Unknown</Text>
            </View>
          </View>
          <Image
            source={require('../../assets/wunder-social-qr-code.png')}
            style={styles.qrCode}
          />
        </View>
      </View>
    </View>
  );
};

export default WunderIdCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#000',
    borderColor: '#FFD700', // yellow
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 16,
  },
  idSection: {
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    width: 80,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginTop: 2,
  },
  valueInline: {
    color: '#fff',
    fontSize: 16,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
});
