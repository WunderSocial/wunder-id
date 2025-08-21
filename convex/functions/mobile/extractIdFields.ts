// convex/functions/mobile/extractIdFields.ts
import { action } from '../../_generated/server';
import { internal } from '../../_generated/api';
import { v } from 'convex/values';
import type { ExtractResult } from '../shared/extractIdFields';

export const extractIdFields = action({
  args: {
    docKey: v.string(),
    documentType: v.optional(v.union(v.literal('passport'), v.literal('license'))),
    debug: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<ExtractResult> => {
    const shouldDebug =
      typeof args.debug === 'boolean' ? args.debug : process.env.TEXTRACT_DEBUG === '1';

    console.log('[extractIdFields.mobile] start', {
      docKey: args.docKey,
      documentType: args.documentType,
      debug: !!shouldDebug,
    });

    const res = await ctx.runAction(
      internal.functions.shared.extractIdFields.extractIdFields,
      { ...args, debug: shouldDebug }
    );

    // Log a safe preview (don’t dump the full address to logs)
    const addrPreview = res.address
      ? res.address.replace(/\s+/g, ' ').slice(0, 80) + (res.address.length > 80 ? '…' : '')
      : null;

    console.log('[extractIdFields.mobile] done', {
      fields: {
        documentId: res.documentId,
        expiry: res.expiry,
        validFrom: res.validFrom,
        issuingCountry: res.issuingCountry,
        issuingAuthority: res.issuingAuthority,
        dob: res.dob,
        addressPreview: addrPreview,   // 👈 now we can see something landed
        fullName: res.fullName,
      },
      haveDebug: !!res._debug,
    });

    // IMPORTANT: return the full result (including address)
    return res as ExtractResult;
  },
});
