import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import ScrollableContainer from '@components/ScrollableContainer';
import LoggedInHeader from '@components/Main/LoggedInHeader';
import WunderIdCard from '@components/Main/wunderIdCard';
import CredentialCards from '@components/Main/credentialCards';
import CustomLoader from '@components/CustomLoader';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide spinner after 1 second
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LoggedInHeader />

      {loading && (
        <View style={styles.spinnerOverlay}>
          <CustomLoader />
        </View>
      )}

      {/* Render components always, just hide them while loading */}
      <View style={[styles.content, loading && styles.hidden]}>
        <ScrollableContainer>
          <WunderIdCard />
          <CredentialCards />
        </ScrollableContainer>
      </View>
      
      {/* <FooterMenu /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
});

export default HomeScreen;
