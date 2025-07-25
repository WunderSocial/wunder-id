import { internalAction } from '../_generated/server';
import { v } from 'convex/values';

export const sendPushNotification = internalAction({
  args: { 
    pushToken: v.string(),
    loginRequestId: v.id('loginRequests'),
  },
  handler: async (_ctx, { pushToken, loginRequestId }) => {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: 'Login Request',
        body: 'You have a new login request in your Wunder ID Demo App',
        data: {
          loginRequestId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Push notification failed to send');
    }

    return true;
  },
});
