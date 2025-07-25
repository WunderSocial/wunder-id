import { mutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

export const sendLoginRequest = mutation({
  args: { wunderId: v.string() },
  handler: async (ctx, { wunderId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', wunderId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const device = await ctx.db
      .query('devices')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!device?.pushToken) {
      throw new Error('Push token not found');
    }

    const loginRequestId = await ctx.db.insert('loginRequests', {
      wunderId,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.functions.sendPushNotification.sendPushNotification,
      {
        pushToken: device.pushToken,
        loginRequestId,
      }
    );

    return loginRequestId;
  },
});
