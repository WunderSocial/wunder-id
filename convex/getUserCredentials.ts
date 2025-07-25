import { query } from './_generated/server';
import { v } from 'convex/values';

export const getUserCredentials = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const creds = await ctx.db
      .query('credentials')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return creds;
  },
});
 