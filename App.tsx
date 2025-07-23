import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import React from 'react';
import { ConvexProvider, convexClient } from './lib/convex';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';


export default function App() {
  return (
    <ConvexProvider client={convexClient}>
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
    </ConvexProvider>
  );
}
