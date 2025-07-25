import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    username: v.string(),
    walletAddress: v.string(),
    lastUpdated: v.int64(),
  }).index('by_username', ['username'])
  .index('by_wallet', ['walletAddress']),

  devices: defineTable({
    userId: v.id('users'),
    deviceId: v.string(),
    deviceType: v.string(),
    pushToken: v.string(),
    lastUpdated: v.int64(), 
  })
  .index('by_user', ['userId'])
  .index('by_deviceId', ['deviceId']),

  personal_data: defineTable({
    userId: v.id('users'),
    fullName: v.string(),
    email: v.string(),
    telephone: v.string(),
    profilePhoto: v.string(),
    dateOfBirth: v.string(),
    country: v.string(),
    city: v.string(),
  })
  .index('by_user', ['userId'])
  .index('by_email', ['email']),


  credentials: defineTable({
    userId: v.id('users'),
    type: v.string(),
    lastUpdated: v.int64(), 
  })
  .index('by_user_and_type', ['userId', 'type'])
  .index('by_type', ['type'])
  .index('by_user', ['userId']),

  loginRequests: defineTable({
    wunderId: v.string(),
    status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('declined'), v.literal('expired')),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index('by_wunderId', ['wunderId']),
});

