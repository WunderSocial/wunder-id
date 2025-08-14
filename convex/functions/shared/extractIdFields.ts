import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';
import {
  TextractClient,
  AnalyzeIDCommand,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';

type ExtractedId = {
  fullName: string | null;
  dob: string | null;            // ISO YYYY-MM-DD
  documentId: string | null;
  expiry: string | null;         // ISO YYYY-MM-DD
  issuingCountry: string | null; // ISO-3 if available
};

function yymmddToIso(s: string | undefined): string | null {
  if (!s || s.length !== 6) return null;
  const yy = parseInt(s.slice(0, 2), 10);
  const mm = s.slice(2, 4);
  const dd = s.slice(4, 6);
  // naive century guess: 00-24 => 2000+, else 1900+
  const year = yy <= 24 ? 2000 + yy : 1900 + yy;
  const iso = `${year.toString().padStart(4, '0')}-${mm}-${dd}`;
  return iso;
}

function sanitizeMrzName(raw: string): string {
  // Replace < with space, collapse spaces, trim
  return raw.replace(/<+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseMrz(lines: string[]): Partial<ExtractedId> {
  // Look for TD3 (passport) or TD1 (ID card) MRZ: 2 or 3 lines with many '<'
  const mrzLines = lines.filter(l => l.replace(/</g, '').length <= l.length * 0.8 && l.length >= 30);
  if (mrzLines.length < 2) return {};

  // TD3 (passport): 2 lines, length 44
  const td3 = mrzLines.find(l => l.length >= 40) && mrzLines.slice(0,2);
  if (td3 && td3[0] && td3[1]) {
    const l1 = td3[0];
    const l2 = td3[1];

    // Line 1: P<ISSUECOUNTRYLAST<<FIRST<MIDDLE
    const issuingCountry = l1.substring(2,5).replace(/</g, '') || null;
    const namePart = l1.substring(5);
    const [surname, givenCombined] = namePart.split('<<');
    const fullName = sanitizeMrzName(`${(givenCombined || '').replace(/</g, ' ')} ${surname?.replace(/</g, ' ')}`);

    // Line 2 fields:
    const documentId = l2.substring(0,9).replace(/</g, '') || null;
    const dobISO = yymmddToIso(l2.substring(13,19));
    const expiryISO = yymmddToIso(l2.substring(21,27));

    return {
      fullName: fullName || null,
      dob: dobISO || null,
      documentId,
      expiry: expiryISO || null,
      issuingCountry,
    };
  }

  // TD1 (ID cards) – basic best-effort (varies)
  const td1 = mrzLines.slice(0,3);
  if (td1.length >= 3) {
    const l1 = td1[0], l2 = td1[1], l3 = td1[2];
    const documentId = l1.substring(5,14).replace(/</g, '') || null;
    const issuingCountry = l2.substring(15,18).replace(/</g, '') || null;
    const dobISO = yymmddToIso(l2.substring(0,6));
    const expiryISO = yymmddToIso(l2.substring(8,14));

    const namePart = l3;
    const [surname, givenCombined] = namePart.split('<<');
    const fullName = sanitizeMrzName(`${(givenCombined || '').replace(/</g, ' ')} ${surname?.replace(/</g, ' ')}`);

    return {
      fullName: fullName || null,
      dob: dobISO || null,
      documentId,
      expiry: expiryISO || null,
      issuingCountry,
    };
  }

  return {};
}

export const extractIdFields = internalAction({
  args: {
    docKey: v.string(),
  },
  handler: async (_ctx, { docKey }): Promise<ExtractedId> => {
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

    const textract = new TextractClient({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    });

    // 1) Try AnalyzeID (best for IDs/passports)
    try {
      const analyze = new AnalyzeIDCommand({
        DocumentPages: [{ S3Object: { Bucket: BUCKET, Name: docKey } }],
      });
      const resp = await textract.send(analyze);
      const doc = resp.IdentityDocuments?.[0];
      if (doc?.IdentityDocumentFields?.length) {
        const byType = new Map<string, string>();
        for (const f of doc.IdentityDocumentFields) {
          const t = f.Type?.Text?.toUpperCase();
          const v = f.ValueDetection?.Text?.trim();
          if (t && v) byType.set(t, v);
        }

        const first = byType.get('FIRST_NAME') || byType.get('GIVEN_NAME');
        const last = byType.get('LAST_NAME') || byType.get('SURNAME');
        const fullName = (first || last) ? `${first ?? ''} ${last ?? ''}`.trim() : (byType.get('NAME') ?? null);

        const dob = byType.get('DATE_OF_BIRTH') || byType.get('BIRTH_DATE') || null;
        const expiry = byType.get('EXPIRATION_DATE') || byType.get('DATE_OF_EXPIRY') || null;
        const documentId = byType.get('DOCUMENT_NUMBER') || byType.get('ID_NUMBER') || byType.get('PASSPORT_NUMBER') || null;
        const issuingCountry = byType.get('ISSUING_COUNTRY') || byType.get('COUNTRY') || null;

        return {
          fullName: fullName || null,
          dob: dob || null,
          documentId,
          expiry: expiry || null,
          issuingCountry: issuingCountry || null,
        };
      }
    } catch {
      // fall through to OCR/MRZ
    }

    // 2) Fallback: OCR + MRZ parse
    try {
      const detect = new DetectDocumentTextCommand({
        Document: { S3Object: { Bucket: BUCKET, Name: docKey } },
      });
      const resp = await textract.send(detect);
      const lines = (resp.Blocks ?? [])
        .filter(b => b.BlockType === 'LINE' && b.Text)
        .map(b => b.Text as string);

      const mrz = parseMrz(lines);
      return {
        fullName: mrz.fullName ?? null,
        dob: mrz.dob ?? null,
        documentId: mrz.documentId ?? null,
        expiry: mrz.expiry ?? null,
        issuingCountry: mrz.issuingCountry ?? null,
      };
    } catch {
      // nothing else we can do here
    }

    return { fullName: null, dob: null, documentId: null, expiry: null, issuingCountry: null };
  },
});
