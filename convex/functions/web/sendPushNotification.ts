import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';

export const sendPushNotification = internalAction({
  args: { 
    pushToken: v.string(),
    loginRequestId: v.id('loginRequests'),
    requestingSite: v.string(),
  },
  handler: async (_ctx, { pushToken, loginRequestId, requestingSite }) => {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: 'Login Request',
        body: `Login requested by ${requestingSite}`,
        data: {
          loginRequestId,
          requestingSite,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Push notification failed to send');
    }

    return true;
  },
});
