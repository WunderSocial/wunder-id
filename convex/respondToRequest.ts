import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const respondToRequest = mutation({
  args: {
    requestId: v.id('loginRequests'),
    status: v.union(v.literal('accepted'), v.literal('declined')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, status, reason }) => {
    const existing = await ctx.db.get(requestId);
    if (!existing) {
      throw new Error('Request not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Request has already been handled');
    }

    await ctx.db.patch(requestId, {
      status,
      expiresAt: Date.now(),
      reason,
    });
  },
});