import { action } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { v } from 'convex/values';

type ExtractedId = {
  fullName: string | null;
  dob: string | null;
  documentId: string | null;
  expiry: string | null;
  issuingCountry: string | null;
};

export const extractIdFields = action({
  args: { docKey: v.string() },
  handler: async (ctx, args): Promise<ExtractedId> => {
    return await ctx.runAction(
      internal.functions.shared.extractIdFields.extractIdFields,
      args
    );
  },
});
