import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const getPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (err) {
    console.error('Error getting push token:', err);
    return null;
  }
};
