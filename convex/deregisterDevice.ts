import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const deregisterDevice = mutation({
  args: {
    userId: v.id('users'),
    hashedFingerprint: v.string(),
  },
  handler: async (ctx, { userId, hashedFingerprint }) => {
    const device = await ctx.db
      .query('devices')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    const match = device.find(d => d.deviceId === hashedFingerprint);
    if (!match) throw new Error('Device not found or fingerprint mismatch');

    await ctx.db.delete(match._id);
  },
});
