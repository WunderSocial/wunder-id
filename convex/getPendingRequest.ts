import { query } from './_generated/server';
import { v } from 'convex/values';

export const getPendingRequest = query({
  args: {
    wunderId: v.string(),
    refreshToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query('loginRequests')
      .withIndex('by_wunderId', (q) => q.eq('wunderId', args.wunderId))
      .order('desc')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();

    if (!request) return null;

    return {
      _id: request._id,
      requestingSite: request.requestingSite ?? 'An unknown app',
      createdAt: request.createdAt,
    };
  },
});
