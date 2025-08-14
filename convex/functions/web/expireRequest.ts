import { mutation } from '../../_generated/server';
import { v } from 'convex/values';

export const expireRequest = mutation({
  args: {
    requestId: v.id('loginRequests'),
  },
  handler: async (ctx, { requestId }) => {
    await ctx.db.patch(requestId, {
      status: 'expired',
      expiresAt: Date.now(),
    });
  },
});
