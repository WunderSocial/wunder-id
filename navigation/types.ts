import type { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  AccountChoice: undefined;
  Username: undefined;
  PasswordSetup: undefined;
  SetPin: undefined;
  ConfirmPin: { pin: string };
  RestoreAccount: undefined;
  RestoreWithSeed: undefined;
  EnterPin: undefined;
  Splash: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Home: undefined;
  EnterPin: undefined;
  Profile: undefined;
  Wallet: undefined;
  Menu: undefined;
  Terms: undefined;
  Settings: undefined;
  Security: undefined;
  RemoveAccount: undefined;
};
