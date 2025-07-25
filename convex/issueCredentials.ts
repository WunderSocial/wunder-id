import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const issueCredential = mutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('credentials')
      .withIndex('by_user_and_type', (q) => q.eq('userId', args.userId).eq('type', args.type))
      .first();

    const now = BigInt(Date.now());


    if (existing) {
      await ctx.db.patch(existing._id, { lastUpdated: now });
    } else {
      await ctx.db.insert('credentials', {
        userId: args.userId,
        type: args.type,
        lastUpdated: now,
      });
    }
  },
});
