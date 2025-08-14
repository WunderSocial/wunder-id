import { mutation } from '../../_generated/server';
import { v } from 'convex/values';

export const registerUser = mutation({
  args: {
    username: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = BigInt(Date.now());

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', q => q.eq('username', args.username))
      .unique();

    if (existing !== null) throw new Error('Username already taken');

    const userId = await ctx.db.insert('users', {
      username: args.username,
      walletAddress: args.walletAddress.toLowerCase(),
      lastUpdated: now,
    });

    return userId;
  },
});
