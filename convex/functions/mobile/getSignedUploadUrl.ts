import { mutation } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { v } from 'convex/values';

type SignedUrlResponse = { signedUrl: string; fileUrl: string; key: string };

export const getSignedUploadUrl = mutation({
  args: { fileName: v.string(), fileType: v.string() },
  handler: async (ctx, args): Promise<SignedUrlResponse> => {
    return await ctx.runMutation(
      internal.functions.shared.getSignedUploadUrl.getSignedUploadUrl,
      args
    );
  },
});
