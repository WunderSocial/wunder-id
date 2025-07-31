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
  Main: undefined;   // <== this wraps your drawer navigator
  EnterPin: undefined;
};
 
export type MainDrawerParamList = {
  Home: undefined;
  Wallet: undefined;
  Profile: undefined;
  Terms: undefined;
  Settings: undefined;
  Security: undefined;
  RemoveAccount: undefined;
  CredentialEditor: { credentialType: string };
};