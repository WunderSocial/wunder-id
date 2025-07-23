import { query } from './_generated/server';
import { v } from 'convex/values';

export const checkUsernameAvailable = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', q => q.eq('username', args.username))
      .unique();

    return existing === null;
  },
});
