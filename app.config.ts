import 'dotenv/config';
 
export default {
  expo: {
    name: 'Wunder ID',
    slug: 'wunder-id',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.anonymous.wunderid',
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "We need camera access for liveness verification.",
        NSMicrophoneUsageDescription: "We need microphone access for liveness verification.",
      },
    },
    android: {
      package: 'com.anonymous.wunderid',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    owner: 'kaynebrennanwunder',
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
      eas: {
        projectId: 'be8ba44e-58cc-4d2c-8236-276f1a48d7cb',
      },
    },
    plugins: ['expo-secure-store'],
  },
};
