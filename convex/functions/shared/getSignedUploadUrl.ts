import { internalMutation } from '../../_generated/server';
import { v } from 'convex/values';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type SignedUrlResponse = { signedUrl: string; fileUrl: string; key: string };

export const getSignedUploadUrl = internalMutation({
  args: { fileName: v.string(), fileType: v.string() },
  handler: async (_ctx, { fileName, fileType }): Promise<SignedUrlResponse> => {
    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
      AWS_BUCKET_NAME,
      AWS_S3_BUCKET,
    } = process.env;

    const BUCKET = AWS_BUCKET_NAME ?? AWS_S3_BUCKET;
    if (!AWS_ACCESS_KEY_ID) throw new Error('Missing AWS_ACCESS_KEY_ID');
    if (!AWS_SECRET_ACCESS_KEY) throw new Error('Missing AWS_SECRET_ACCESS_KEY');
    if (!AWS_REGION) throw new Error('Missing AWS_REGION');
    if (!BUCKET) throw new Error('Missing AWS_BUCKET_NAME (or AWS_S3_BUCKET)');

    const s3 = new S3Client({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    });

    const key = `uploads/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    const fileUrl = `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    return { signedUrl, fileUrl, key };
  },
});
