import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const savePersonalData = mutation({
  args: {
    userId: v.id('users'),
    fullName: v.string(),
    email: v.string(),
    telephone: v.string(),
    profilePhoto: v.string(),
    dateOfBirth: v.string(),
    country: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('personal_data')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    const data = {
      fullName: args.fullName,
      email: args.email,
      telephone: args.telephone,
      profilePhoto: args.profilePhoto,
      dateOfBirth: args.dateOfBirth,
      country: args.country,
      city: args.city,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert('personal_data', {
        userId: args.userId,
        ...data,
      });
    }
  },
});
 