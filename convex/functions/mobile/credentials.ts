import { query, mutation } from '../../_generated/server';
import { v } from 'convex/values';


// === QUERY: Check if user has credential ===
export const hasCredential = query({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const credential = await ctx.db
      .query('credentials')
      .withIndex('by_user_and_type', (q) =>
        q.eq('userId', args.userId).eq('type', args.type)
      )
      .first();

    if (!credential) return null;

    return {
      _id: credential._id,
      type: credential.type,
      lastUpdated: credential.lastUpdated,
      content: credential.content ?? null,
    };
  },
});

// === MUTATION: Issue or update credential ===
export const issueCredential = mutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
    content: v.string(), // Encrypted JSON string
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('credentials')
      .withIndex('by_user_and_type', (q) =>
        q.eq('userId', args.userId).eq('type', args.type)
      )
      .first();

    const now = BigInt(Date.now());

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        lastUpdated: now,
      });
    } else {
      await ctx.db.insert('credentials', {
        userId: args.userId,
        type: args.type,
        content: args.content,
        lastUpdated: now,
      });
    }
  },
});

// === MUTATION: Delete credential by type ===
export const deleteCredentialByType = mutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const credential = await ctx.db
      .query('credentials')
      .withIndex('by_user_and_type', (q) =>
        q.eq('userId', args.userId).eq('type', args.type)
      )
      .first();

    if (credential) {
      await ctx.db.delete(credential._id);
    }
  },
});
