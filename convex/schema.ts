import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    username: v.string(),
    walletAddress: v.string(),
    lastUpdated: v.int64(), // bigint ms since epoch
  }).index('by_username', ['username'])
  .index('by_wallet', ['walletAddress']),

  devices: defineTable({
    userId: v.id('users'),
    deviceId: v.string(),
    deviceType: v.string(),
    pushToken: v.string(),
    lastUpdated: v.int64(), // bigint ms since epoch
  })
  .index('by_user', ['userId'])
  .index('by_deviceId', ['deviceId']),
});
