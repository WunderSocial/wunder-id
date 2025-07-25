import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export const getDeviceFingerprint = async (): Promise<string> => {
  let deviceId = '';

  if (Platform.OS === 'android') {
    const androidId = Application.getAndroidId();
    deviceId = androidId ?? 'unknown';
  } else if (Platform.OS === 'ios') {
    const iosId = await Application.getIosIdForVendorAsync();
    deviceId = iosId ?? 'unknown';
  }

  const rawFingerprint = `${Device.deviceName || 'unknown'}-${Device.modelId || 'unknown'}-${deviceId}`;
  const encoded = new TextEncoder().encode(rawFingerprint);
  const hashed = bytesToHex(sha256(encoded));

  return hashed;
};
