import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const deleteUploadedKeys = internalAction({
  args: { keys: v.array(v.string()) },
  // Explicit return type: Promise<void>
  handler: async (_ctx, { keys }: { keys: string[] }): Promise<void> => {
    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
      AWS_BUCKET_NAME,
      AWS_S3_BUCKET,
    } = process.env;

    const BUCKET = AWS_BUCKET_NAME ?? AWS_S3_BUCKET;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !BUCKET) {
      throw new Error('Missing S3 env configuration');
    }

    const s3 = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    for (const Key of keys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key }));
      } catch (e) {
        console.warn('[deleteUploadedKeys] Failed to delete', Key, e);
      }
    }
  },
});
