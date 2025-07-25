import 'dotenv/config';

export default {
  expo: {
    name: 'Wunder ID',
    slug: 'wunder-id',
    owner: 'kaynebrennanwunder',
    icon: './assets/wunder-id-app-logo.png',
    extra: {
      convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
      "eas": {
        "projectId": "be8ba44e-58cc-4d2c-8236-276f1a48d7cb"
      },
    },
  "android": {
    "package": "com.anonymous.wunderid"
  },
  "ios": {
    "bundleIdentifier": "com.anonymous.wunderid"
  },
  },
};
