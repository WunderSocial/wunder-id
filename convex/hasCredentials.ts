import { query } from './_generated/server';
import { v } from 'convex/values';

export const hasCredential = query({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('credentials')
      .withIndex('by_user_and_type', (q) => q.eq('userId', args.userId).eq('type', args.type))
      .first();

    return !!existing;
  },
});
