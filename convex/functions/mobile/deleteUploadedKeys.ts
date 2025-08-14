import { action } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { v } from 'convex/values';

export const deleteUploadedKeys = action({
  args: { keys: v.array(v.string()) },
  // Explicit types on params and return
  handler: async (
    ctx,
    args: { keys: string[] }
  ): Promise<void> => {
    await ctx.runAction(
      internal.functions.shared.deleteUploadedKeys.deleteUploadedKeys,
      args
    );
  },
});
