import { mutation } from '../../_generated/server';
import { v } from 'convex/values';

export const registerDevice = mutation({
  args: {
    userId: v.id('users'),
    deviceId: v.string(),
    deviceType: v.string(),
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = BigInt(Date.now());
    const existing = await ctx.db
      .query('devices')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect();

    const match = existing.find(d => d.deviceId === args.deviceId);
    if (match) {
      await ctx.db.patch(match._id, {
        deviceType: args.deviceType,
        pushToken: args.pushToken,
        lastUpdated: now,
      });
      return match._id;
    }

    const deviceId = await ctx.db.insert('devices', {
      userId: args.userId,
      deviceId: args.deviceId,
      deviceType: args.deviceType,
      pushToken: args.pushToken,
      lastUpdated: now,
    });

    return deviceId;
  },
});
