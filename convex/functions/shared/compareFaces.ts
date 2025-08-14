// convex/functions/shared/compareFaces.ts
import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

type CompareResult = { match: boolean; similarity: number | null; error?: string };

export const compareFaces = internalAction({
  args: {
    docKey: v.string(),
    selfieKey: v.string(),
    threshold: v.optional(v.number()), // default 90
  },
  handler: async (_ctx, { docKey, selfieKey, threshold }): Promise<CompareResult> => {
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

    const rekog = new RekognitionClient({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    });

    try {
      const cmd = new CompareFacesCommand({
        // ✅ Selfie (single face) should be SourceImage
        SourceImage: { S3Object: { Bucket: BUCKET, Name: selfieKey } },
        // ✅ Document photo can be TargetImage (can contain multiple faces / background)
        TargetImage: { S3Object: { Bucket: BUCKET, Name: docKey } },
        SimilarityThreshold: threshold ?? 90,
      });

      const resp = await rekog.send(cmd);

      const best = (resp.FaceMatches ?? [])
        .map(m => m.Similarity ?? 0)
        .sort((a, b) => b - a)[0];

      return {
        match: typeof best === 'number' && best >= (threshold ?? 90),
        similarity: best ?? null,
      };
    } catch (e: any) {
      // Surface useful Rekognition messages like "Could not detect faces in the source image."
      return { match: false, similarity: null, error: e?.message ?? 'CompareFaces failed' };
    }
  },
});
