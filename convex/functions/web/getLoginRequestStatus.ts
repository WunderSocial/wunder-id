import { query } from '../../_generated/server';
import { v } from 'convex/values';

export const getLoginRequestStatus = query({
  args: {
    loginRequestId: v.id('loginRequests'),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.loginRequestId);
    return request?.status ?? 'not_found';
  },
});
