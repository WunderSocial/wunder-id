import { query } from './_generated/server';
import { v } from 'convex/values';

export const getPersonalData = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('personal_data')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
  },
});
