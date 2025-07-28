import 'dotenv/config';

export default {
  expo: {
    name: 'Wunder ID',
    slug: 'wunder-id',
    owner: 'kaynebrennanwunder',
    icon: './assets/icon.png',
    ios: {
      bundleIdentifier: 'com.anonymous.wunderid',
      icon: './assets/icon.png',
    },
    android: {
      package: 'com.anonymous.wunderid',
      icon: './assets/icon.png',
    },
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
      "eas": {
        "projectId": "be8ba44e-58cc-4d2c-8236-276f1a48d7cb"
      },
    },
  },
};
