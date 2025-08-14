import { action } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { v } from 'convex/values';

type CompareResult = { match: boolean; similarity: number | null };

export const compareFaces = action({
  args: {
    docKey: v.string(),
    selfieKey: v.string(),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CompareResult> => {
    return await ctx.runAction(
      internal.functions.shared.compareFaces.compareFaces,
      args
    );
  },
});
