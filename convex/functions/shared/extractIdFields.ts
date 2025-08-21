// convex/functions/shared/extractIdFields.ts
import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';
import {
  TextractClient,
  AnalyzeDocumentCommand,
  Block,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export type ExtractResult = {
  documentType?: 'passport' | 'license';
  issuingCountry?: string;
  issuingCountryRaw?: string;
  issuingAuthority?: string | null;
  surname?: string | null;
  firstWithTitle?: string | null;
  fullName?: string | null;
  documentId?: string | null;
  address?: string | null;
  dob?: string | null;
  dobRaw?: string | null;
  validFrom?: string | null;
  expiry?: string | null;
  _debug?: {
    savedToS3?: string;
    blockTypeCounts?: Record<string, number>;
    wordCount?: number;
    lineSample?: string[];
    queryResults?: Record<string, string>;
    calls?: Array<{ type: 'license' | 'passport' | 'mixed'; queries: number }>;
    chosenFallbacks?: ChosenFallbacks;
  };
};

type ChosenFallbacks = Partial<
  Record<
    | 'documentId'
    | 'dob'
    | 'validFrom'
    | 'expiry'
    | 'issuingCountry'
    | 'issuingAuthority'
    | 'surname'
    | 'firstWithTitle'
    | 'address',
    string
  >
>;

// ---------- helpers ----------
const MON: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const MON_FR: Record<string, number> = {
  JANV: 1, FEV: 2, FÉV: 2, FEVR: 2, MAR: 3, MARS: 3, AVR: 4, AVRI: 4,
  MAI: 5, JUIN: 6, JUIL: 7, AOUT: 8, AOÛT: 8, SEPT: 9, OCT: 10, NOV: 11, DEC: 12, DÉC: 12,
};
const pad2 = (n: number | string) => String(n).padStart(2, '0');
const slog = (...a: any[]) => console.log('[extractIdFields.shared]', ...a);

// DVLA licence regex (strict validation after cleanup)
const LICENCE_REGEX = /^[A-Z9]{5}\d{6}[A-Z0-9]{4,10}$/;

// UK address hints
const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s?(\d[A-Z]{2})\b/;
const STREET_WORDS =
  /\b(ROAD|RD|STREET|ST|AVENUE|AVE|LANE|LN|CLOSE|WAY|DRIVE|DR|COURT|CT|PLACE|PL|GARDENS|GDNS|SQUARE|SQ|TERRACE|TCE)\b/i;

const QUERY_LIMIT = 10;

const toTokens = (s: string) =>
  s.toUpperCase().replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

const findLabelIndex = (tokens: string[], label: string) => {
  const lab = label.toUpperCase();
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/[.)]/g, '');
    if (t === lab) return i;
  }
  return -1;
};

const isValidYMD = (y: number, m: number, d: number) => {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizeDate(
  raw: string | undefined | null
): { iso: string | null; rawCleaned: string } {
  if (!raw) return { iso: null, rawCleaned: '' };
  let cleaned = raw
    .replace(/[.,]/g, ' ')
    .replace(/\//g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const upper = stripAccents(cleaned.toUpperCase());
  let tokens = upper.split(' ').filter(Boolean);
  tokens = tokens.filter((t, i) => i === 0 || t !== tokens[i - 1]);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map((x) => parseInt(x, 10));
    if (isValidYMD(y, m, d)) return { iso: `${y}-${pad2(m)}-${pad2(d)}`, rawCleaned: raw };
  }
  if (/^\d{1,2} \d{1,2} \d{2,4}$/.test(tokens.join(' '))) {
    const d = parseInt(tokens[0], 10);
    const m = parseInt(tokens[1], 10);
    let y = parseInt(tokens[2], 10);
    if (y < 100) y = y >= 40 ? 1900 + y : 2000 + y;
    if (isValidYMD(y, m, d)) return { iso: `${y}-${pad2(m)}-${pad2(d)}`, rawCleaned: cleaned };
  }
  if (tokens.length >= 3 && /^\d{1,2}$/.test(tokens[0]) && (MON[tokens[1]] || MON_FR[tokens[1]])) {
    const d = parseInt(tokens[0], 10);
    const m = MON[tokens[1]] || MON_FR[tokens[1]];
    let y = parseInt(tokens[2], 10);
    if (y < 100) y = y >= 40 ? 1900 + y : 2000 + y;
    if (isValidYMD(y, m, d)) return { iso: `${y}-${pad2(m)}-${pad2(d)}`, rawCleaned: cleaned };
  }
  const dashed = raw.replace(/\//g, '-');
  if (/^\d{2}-\d{2}-\d{4}$/.test(dashed)) {
    const [dd, mm, yyyy] = dashed.split('-').map((x) => parseInt(x, 10));
    if (isValidYMD(yyyy, mm, dd)) return { iso: `${yyyy}-${pad2(mm)}-${pad2(dd)}`, rawCleaned: raw };
  }
  return { iso: null, rawCleaned: cleaned || raw };
}

// tolerant picker from a line that may contain a bilingual month fragment like "08 JUL / JUIL 28"
function parsePassportBilingualDate(line: string): string | null {
  const U = stripAccents(line.toUpperCase());
  // Try variants: "08 JUL / JUIL 28", "03 JAN / JAN 82", "08 JUL 2028"
  const m = U.match(
    /(\d{1,2})\s+([A-Z]{3,5})(?:\s*\/\s*[A-Z]{3,5})?\s+(\d{2,4})/
  );
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const monToken = m[2];
  let y = parseInt(m[3], 10);
  const month =
    MON[monToken] ??
    MON_FR[monToken] ??
    null;
  if (!month) return null;
  if (y < 100) y = y >= 40 ? 1900 + y : 2000 + y;
  if (!isValidYMD(y, month, d)) return null;
  return `${y}-${pad2(month)}-${pad2(d)}`;
}

function extractIsoDateFromString(s: string): { iso: string | null; raw: string } {
  const first = normalizeDate(s);
  if (first.iso) return { iso: first.iso, raw: s };
  const m = s.match(
    /(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4}|\d{1,2}\s+[A-Za-zÉÛéû]{3,}\s+\d{2,4}|\d{4}-\d{2}-\d{2})/
  );
  if (m) {
    const n = normalizeDate(m[1]);
    return { iso: n.iso, raw: m[1] };
  }
  // last chance: bilingual month
  const bi = parsePassportBilingualDate(s);
  return { iso: bi, raw: s };
}

function normCountry(s: string | undefined | null): { code?: string; raw?: string } {
  if (!s) return {};
  const u = stripAccents(s.trim().toUpperCase());
  if (['UK', 'GB', 'GBR', 'UNITED KINGDOM', 'GREAT BRITAIN'].includes(u)) {
    return { code: 'GB', raw: s };
  }
  if (/^[A-Z]{3}$/.test(u)) return { code: u, raw: s };
  if (/^[A-Z]{2}$/.test(u)) return { code: u, raw: s };
  return { raw: s };
}

// FIX: make this tolerant to extra tokens (e.g. "4a. 05.06.2022 4c. DVLA")
function dateRightOfLabel(linesTokens: string[][], li: number, idx: number): string | null {
  const same = linesTokens[li].slice(idx + 1).join(' ').trim();
  const e1 = extractIsoDateFromString(same);
  if (e1.iso) return e1.iso;
  if (li + 1 < linesTokens.length) {
    const next = linesTokens[li + 1].join(' ').trim();
    const e2 = extractIsoDateFromString(next);
    if (e2.iso) return e2.iso;
  }
  return null;
}

function normalizeLicenceTail(alnum: string) {
  if (alnum.length < 16) return alnum;
  const head = alnum.slice(0, 5);
  let tail = alnum.slice(5);
  tail = tail
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/T/g, '7');
  return head + tail;
}

function cleanForLicence(s: string) {
  let cand = s.replace(/^\s*[\(]?\s*([1-9][A-Z]?)\s*[\).:]?\s*/, '');
  cand = stripAccents(cand.toUpperCase()).replace(/[^A-Z0-9]/g, '');
  return cand;
}

function extractLicenceFromString(s: string): string | null {
  const cand = cleanForLicence(s);
  const norm = normalizeLicenceTail(cand);
  let best: string | null = null;
  for (let L = 24; L >= 15; L--) {
    for (let i = 0; i + L <= norm.length; i++) {
      const sub = norm.slice(i, i + L);
      if (LICENCE_REGEX.test(sub)) {
        if (!best || sub.length > best.length) best = sub;
      }
    }
    if (best) break;
  }
  return best;
}

function idRightOfLabel(
  lines: string[],
  linesTokens: string[][],
  li: number,
  idx: number
): string | null {
  const right = lines[li].slice(
    lines[li].toUpperCase().indexOf(linesTokens[li][idx]) + linesTokens[li][idx].length
  );
  return (
    extractLicenceFromString(right) ||
    (li + 1 < lines.length ? extractLicenceFromString(lines[li + 1]) : null)
  );
}

function fromLineStartingWith5(rawLine: string): string | null {
  const trimmed = rawLine.trim();
  if (!/^(?:\(?\s*5\s*[\.\):\-])/.test(trimmed)) return null;
  const after = trimmed.replace(/^(?:\(?\s*5\s*[\.\):\-]\s*)/, '');
  return extractLicenceFromString(after);
}

// Passport MRZ quick parse
function parseMrz(lines: string[]) {
  const l = lines.map((x) => x.replace(/[\s<]+/g, '<').toUpperCase());
  const i = l.findIndex((x) => /^P<.*/.test(x) && x.length >= 30);
  if (i >= 0) {
    const L1 = l[i];
    const L2 = l[i + 1] || '';
    const issuingCountry = L1.slice(2, 5).replace(/[^A-Z]/g, '') || undefined;
    const passportNumber = L2.slice(0, 9).replace(/[^A-Z0-9]/g, '') || undefined;
    const yy = L2.slice(13, 15),
      mm = L2.slice(15, 17),
      dd = L2.slice(17, 19);
    let birth: string | undefined;
    if (/^\d{2}$/.test(yy) && /^\d{2}$/.test(mm) && /^\d{2}$/.test(dd)) {
      const y = parseInt(yy, 10);
      const fullY = y >= 40 ? 1900 + y : 2000 + y;
      const mi = parseInt(mm, 10),
        di = parseInt(dd, 10);
      if (isValidYMD(fullY, mi, di)) birth = `${fullY}-${pad2(mi)}-${pad2(di)}`;
    }
    return { issuingCountry, passportNumber, birth };
  }
  return {};
}

type Query = { Text: string; Alias?: string };

const licenseQueries: Query[] = [
  { Text: 'On a UK driving licence, what is the driving licence number (item 5)?', Alias: 'documentId' },
  { Text: 'On a UK driving licence, what is the date of birth (item 3)?', Alias: 'dob' },
  { Text: 'On a UK driving licence, what is the date of issue (item 4a)?', Alias: 'validFrom' },
  { Text: 'On a UK driving licence, what is the date of expiry (item 4b)?', Alias: 'expiry' },
  { Text: 'On a UK driving licence, what is the issuing authority (item 4c)?', Alias: 'issuingAuthority' },
  { Text: 'On a UK driving licence, what is the address (item 8)?', Alias: 'address' },
  { Text: 'On a UK driving licence, what is the surname (item 1)?', Alias: 'surname' },
  { Text: 'On a UK driving licence, what are the first names (item 2)? Include title if present.', Alias: 'firstWithTitle' },
  { Text: 'On a UK driving licence, what is the issuing country?', Alias: 'issuingCountry' },
];

const passportQueries: Query[] = [
  { Text: 'On the passport, what is the passport number?', Alias: 'documentId' },
  { Text: 'On the passport, what is the date of birth?', Alias: 'dob' },
  { Text: 'On the passport, what is the date of expiry?', Alias: 'expiry' },
  { Text: 'On the passport, what is the issuing authority?', Alias: 'issuingAuthority' },
  { Text: 'On the passport, what is the issuing country?', Alias: 'issuingCountry' },
  { Text: 'On the passport, what is the surname?', Alias: 'surname' },
  { Text: 'On the passport, what are the given names?', Alias: 'firstWithTitle' },
];

async function analyzeWithQueries(
  textract: TextractClient,
  bucket: string,
  key: string,
  queries: Query[]
) {
  const cmd = new AnalyzeDocumentCommand({
    Document: { S3Object: { Bucket: bucket, Name: key } },
    FeatureTypes: ['QUERIES', 'FORMS', 'TABLES'],
    QueriesConfig: { Queries: queries },
  });
  return textract.send(cmd);
}

async function runDetectDocumentText(
  textract: TextractClient,
  bucket: string,
  key: string
) {
  const cmd = new DetectDocumentTextCommand({
    Document: { S3Object: { Bucket: bucket, Name: key } },
  });
  return textract.send(cmd);
}

export const extractIdFields = internalAction({
  args: {
    docKey: v.string(),
    documentType: v.optional(v.union(v.literal('passport'), v.literal('license'))),
    debug: v.optional(v.boolean()),
  },
  handler: async (_ctx, { docKey, documentType, debug }): Promise<ExtractResult> => {
    const missing = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'].filter(
      (k) => !process.env[k]
    );
    if (missing.length) throw new Error(`Missing env vars for Textract: ${missing.join(', ')}`);

    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;
    const debugEnabled = !!debug || process.env.TEXTRACT_DEBUG === '1';
    slog('start', { docKey, documentType, debug: debugEnabled });

    const textract = new TextractClient({
      region: AWS_REGION!,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID!, secretAccessKey: AWS_SECRET_ACCESS_KEY! },
    });

    type Collected = {
      blocks: Block[];
      lines: string[];
      words: string[];
      queryResultsMap: Record<string, string>;
      callsMeta: Array<{ type: 'license' | 'passport' | 'mixed'; queries: number }>;
    };
    const collected: Collected = {
      blocks: [],
      lines: [],
      words: [],
      queryResultsMap: {},
      callsMeta: [],
    };

    async function runAndCollect(qs: Query[], label: 'license' | 'passport' | 'mixed') {
      for (let i = 0; i < qs.length; i += QUERY_LIMIT) {
        const chunk = qs.slice(i, i + QUERY_LIMIT);
        const resp = await analyzeWithQueries(textract, AWS_S3_BUCKET!, docKey, chunk);
        const blocks = resp.Blocks ?? [];
        const lineBlocks = (blocks.filter((b) => b.BlockType === 'LINE') as Block[]) || [];
        const wordBlocks = (blocks.filter((b) => b.BlockType === 'WORD') as Block[]) || [];
        const queryBlocks = (blocks.filter((b) => b.BlockType === 'QUERY_RESULT') as Block[]) || [];

        collected.blocks.push(...blocks);
        collected.lines.push(...lineBlocks.map((b) => (b.Text || '').trim()).filter(Boolean));
        collected.words.push(...wordBlocks.map((b) => (b.Text || '').trim()).filter(Boolean));
        for (const b of queryBlocks) {
          const alias = b.Query?.Alias?.trim();
          const text = (b.Text || '').trim();
          if (alias) collected.queryResultsMap[alias] = text;
        }
        collected.callsMeta.push({ type: label, queries: chunk.length });
      }
    }

    try {
      const detect = await runDetectDocumentText(textract, AWS_S3_BUCKET!, docKey);
      const dBlocks = detect.Blocks ?? [];
      const dLines = (dBlocks.filter(b => b.BlockType === 'LINE') as Block[]).map(b => (b.Text || '').trim()).filter(Boolean);
      const dWords = (dBlocks.filter(b => b.BlockType === 'WORD') as Block[]).map(b => (b.Text || '').trim()).filter(Boolean);

      // Merge anything we don't already have (simple dedupe)
      const haveLine = new Set(collected.lines);
      for (const L of dLines) if (L && !haveLine.has(L)) collected.lines.push(L);
      const haveWord = new Set(collected.words);
      for (const W of dWords) if (W && !haveWord.has(W)) collected.words.push(W);

      // Keep for stats/debug
      collected.blocks.push(...dBlocks);
      collected.callsMeta.push({ type: 'mixed', queries: 0 });
      if (debugEnabled) slog('detectDocumentText merged', { addLines: dLines.length, addWords: dWords.length });
    } catch (e) {
      if (debugEnabled) slog('detectDocumentText failed (non-fatal)', { message: (e as Error)?.message });
    }

    // Skip passport queries; rely on OCR + heuristics.
    if (documentType === 'license') {
      await runAndCollect(licenseQueries, 'license');
    } else if (documentType === 'passport') {
      // no passport queries
    } else {
      await runAndCollect(licenseQueries, 'license');
    }

    const blockTypeCounts: Record<string, number> = {};
    for (const b of collected.blocks) {
      if (!b.BlockType) continue;
      blockTypeCounts[b.BlockType] = (blockTypeCounts[b.BlockType] || 0) + 1;
    }
    const linesTokens = collected.lines.map(toTokens);

    if (debugEnabled) {
      slog('textract ok', {
        blocksTotal: collected.blocks.length,
        lines: collected.lines.length,
        words: collected.words.length,
        calls: collected.callsMeta,
        queryResults: collected.queryResultsMap,
        blockTypeCounts,
        sampleLines: collected.lines.slice(0, 8),
      });
    }

    const out: ExtractResult = { documentType };
    const chosen: ChosenFallbacks = {};

    // Optional full dump to S3
    if (debugEnabled && process.env.TEXTRACT_DEBUG_S3 === '1') {
      const s3 = new S3Client({
        region: AWS_REGION!,
        credentials: { accessKeyId: AWS_ACCESS_KEY_ID!, secretAccessKey: AWS_SECRET_ACCESS_KEY! },
      });
      const keySafe = docKey.replace(/\//g, '_');
      const debugKey = `textract-debug/${Date.now()}-${keySafe}.json`;
      await s3.send(
        new PutObjectCommand({
          Bucket: AWS_S3_BUCKET!,
          Key: debugKey,
          Body: JSON.stringify({ blocks: collected.blocks }, null, 2),
          ContentType: 'application/json',
        })
      );
      out._debug = { savedToS3: debugKey };
      slog('saved debug JSON to S3', { key: debugKey });
    }

    // === Map direct query answers (with cleaning) ===
    const map = collected.queryResultsMap;

    if (map.documentId) {
      const cleanedInlineDigits = map.documentId.replace(/[^A-Z0-9]/gi, '');
      if (cleanedInlineDigits.length >= 8) {
        out.documentId = cleanedInlineDigits;
        chosen.documentId = 'query cleaned';
      }
    }

    if (map.dob && !out.dob) {
      const picked = extractIsoDateFromString(map.dob);
      out.dob = picked.iso;
      out.dobRaw = picked.raw || map.dob;
    }
    if (map.validFrom && !out.validFrom) out.validFrom = normalizeDate(map.validFrom).iso;
    if (map.expiry && !out.expiry) out.expiry = extractIsoDateFromString(map.expiry).iso;
    if (map.issuingAuthority && !out.issuingAuthority) out.issuingAuthority = map.issuingAuthority || null;
    if (map.issuingCountry && !out.issuingCountry) {
      const { code } = normCountry(map.issuingCountry);
      out.issuingCountryRaw = map.issuingCountry;
      if (code) out.issuingCountry = code;
    }
    if (map.surname && !out.surname) out.surname = map.surname || null;
    if (map.firstWithTitle && !out.firstWithTitle) out.firstWithTitle = map.firstWithTitle || null;
    if (map.address && !out.address) out.address = map.address || null;

    // === Auto-detect doc type if still missing ===
    if (!out.documentType) {
      const looksLicense =
        !!out.validFrom ||
        !!out.expiry ||
        !!out.address ||
        linesTokens.some((ts) => ['4A', '4B', '5', '8', '3', '1', '2'].some((lbl) => ts.includes(lbl))) ||
        collected.lines.some((l) => /DRIVING\s*LICEN[CS]E/i.test(l));
      const looksPassport = collected.lines.some((l) => /PASSPORT|PASSEPORT/i.test(stripAccents(l)));
      out.documentType = looksLicense ? 'license' : looksPassport ? 'passport' : undefined;
    }

    // ---------------------------
    // PASSPORT-SPECIFIC FALLBACKS (unchanged from your current behavior)
    // ---------------------------
    const treatAsPassport =
      out.documentType === 'passport' ||
      (!out.documentType && collected.lines.some((l) => /PASSPORT|PASSEPORT/i.test(stripAccents(l))));

    if (treatAsPassport) {
      const ULines = collected.lines.map((l) => stripAccents(l.toUpperCase()));
      const PASSPORT_WORDS = new Set(['PASSPORT', 'PASSEPORT']);

      const findNineDigits = (s: string) => {
        const m = s.match(/\b(\d{9})\b/);
        return m ? m[1] : null;
      };
      const findAlnumId = (s: string) => {
        const cands = s.match(/\b[A-Z0-9]{8,10}\b/g) || [];
        for (const c of cands) {
          if (PASSPORT_WORDS.has(c)) continue;
          const digits = (c.match(/\d/g) || []).length;
          if (digits >= 2) return c;
        }
        return null;
      };

      if (!out.documentId || !out.dob || !out.issuingCountry) {
        const mrz = parseMrz(collected.lines);
        if (!out.documentId && mrz.passportNumber) out.documentId = mrz.passportNumber;
        if (!out.dob && mrz.birth) { out.dob = mrz.birth; out.dobRaw = mrz.birth; }
        if (!out.issuingCountry && mrz.issuingCountry) out.issuingCountry = mrz.issuingCountry;
      }

      if (!out.documentId) {
        const idx = ULines.findIndex((l) => /(PASSPORT\s*NO|PASSEPORT\s*N)/.test(l));
        if (idx >= 0) {
          const win = [collected.lines[idx], collected.lines[idx + 1] || '', collected.lines[idx + 2] || ''].join(' ');
          let id = findNineDigits(win) || findAlnumId(stripAccents(win.toUpperCase()));
          if (id) out.documentId = id;
        }
      }
      if (!out.documentId) {
        const all = collected.lines.join(' ');
        let id = findNineDigits(all);
        if (!id) id = findAlnumId(stripAccents(all.toUpperCase()));
        if (id) out.documentId = id;
      }

      if (!out.issuingAuthority) {
        const h = ULines.find((l) => /\bHMPO\b/.test(l)) ||
                  ULines.find((l) => /AUTHORITY|AUTORITE/.test(l));
        if (h) out.issuingAuthority = h.includes('HMPO') ? 'HMPO' : collected.lines[ULines.indexOf(h)];
      }

      if (!out.issuingCountry) {
        if (ULines.some((l) => /\bGBR\b/.test(l))) out.issuingCountry = 'GBR';
      }
      if (!out.issuingCountry) {
        for (let i = 0; i < ULines.length; i++) {
          if (/CODE|NATIONALITY|NATIONALITE/.test(ULines[i])) {
            const pool = [ULines[i], ULines[i + 1] || ''].join(' ');
            const m3 = pool.match(/\b([A-Z]{3})\b/);
            if (m3) { out.issuingCountry = m3[1]; break; }
          }
        }
      }

      if (!out.expiry) {
        for (let i = 0; i < ULines.length; i++) {
          if (/(DATE\s+OF\s+EXPIRY|EXPIRY|EXPIRES|EXPIRATION|D'?EXPIRATION)/.test(ULines[i])) {
            const look = [collected.lines[i], collected.lines[i + 1] || ''].join(' ');
            const iso = parsePassportBilingualDate(look) || extractIsoDateFromString(look).iso;
            if (iso) { out.expiry = iso; break; }
          }
        }
      }

      if (!out.dob) {
        for (let i = 0; i < ULines.length; i++) {
          if (/DATE OF BIRTH|NAISSANCE/.test(ULines[i])) {
            const look = [collected.lines[i], collected.lines[i + 1] || ''];
            const picked = extractIsoDateFromString(look.join(' '));
            if (picked.iso) { out.dob = picked.iso; out.dobRaw = picked.raw; break; }
          }
        }
      }

      if (!out.fullName && (out.firstWithTitle || out.surname)) {
        out.fullName = `${out.firstWithTitle ?? ''} ${out.surname ?? ''}`.trim() || null;
      }
    }

    // ---------------------------
    // LICENCE FALLBACKS
    // ---------------------------
    const treatAsLicense =
      out.documentType === 'license' ||
      (!out.documentType &&
        linesTokens.some((ts) =>
          ['4A', '4B', '5', '8', '3', '1', '2'].some((lbl) => ts.includes(lbl))
        ));

    if (treatAsLicense) {
      // Expiry via 4b
      if (!out.expiry) {
        for (let li = 0; li < linesTokens.length; li++) {
          const idx = findLabelIndex(linesTokens[li], '4B');
          if (idx >= 0) {
            const iso = dateRightOfLabel(linesTokens, li, idx);
            if (iso) { out.expiry = iso; break; }
          }
        }
      }

      // Valid from via 4a or text
      if (!out.validFrom) {
        let set = false;
        for (let li = 0; li < linesTokens.length; li++) {
          const idx = findLabelIndex(linesTokens[li], '4A');
          if (idx >= 0) {
            const iso = dateRightOfLabel(linesTokens, li, idx);
            if (iso) { out.validFrom = iso; set = true; break; }
          }
        }
        if (!set) {
          for (let li = 0; li < collected.lines.length; li++) {
            const rawU = stripAccents(collected.lines[li].toUpperCase()).replace(/[^A-Z0-9 ]/g, '');
            if (/VALID\s*FROM|ISSUED/.test(rawU)) {
              const next = collected.lines[li] + ' ' + (collected.lines[li + 1] || '');
              const { iso } = extractIsoDateFromString(next); // use tolerant picker
              if (iso) { out.validFrom = iso; break; }
            }
          }
        }
      }

      // Licence number via label 5
      if (!out.documentId) {
        for (let li = 0; li < linesTokens.length; li++) {
          const idx = findLabelIndex(linesTokens[li], '5');
          if (idx >= 0) {
            const start5 = fromLineStartingWith5(collected.lines[li]);
            if (start5) { out.documentId = start5; break; }
            const id = idRightOfLabel(collected.lines, linesTokens, li, idx);
            if (id) { out.documentId = id; break; }
            const win3 = [
              collected.lines[li],
              collected.lines[li + 1] || '',
              collected.lines[li + 2] || '',
            ].join(' ');
            const joined = extractLicenceFromString(win3);
            if (joined) { out.documentId = joined; break; }
          }
        }
      }

      // Global licence number search
      if (!out.documentId) {
        const all = collected.lines.join(' ');
        const cleaned = extractLicenceFromString(all);
        if (cleaned) out.documentId = cleaned;
      }

      // Address via "8." same/next line
      if (!out.address) {
        const valueRightOfLabel = (line: string, labelToken: string) => {
          const up = line.toUpperCase();
          const pos = up.indexOf(labelToken);
          if (pos < 0) return '';
          return line.slice(pos + labelToken.length).replace(/^[:.)\s-]+/, '').trim();
        };
        const looksLikeNewLabel = (raw: string) => {
          const t = (toTokens(raw)[0] || '').replace(/[.)]/g, '');
          return (
            t === '1' || t === '2' || t === '3' ||
            t === '4A' || t === '4B' || t === '4C' ||
            t === '5' || t === '8' || t === '9'
          );
        };
        const looksAddressy = (s: string) =>
          /,/.test(s) || UK_POSTCODE.test(stripAccents(s.toUpperCase())) || STREET_WORDS.test(s);
        for (let li = 0; li < linesTokens.length; li++) {
          const first = linesTokens[li][0]?.replace(/[.)]/g, '');
          if (first === '8') {
            const labelToken = linesTokens[li][0];
            const sameLine = valueRightOfLabel(collected.lines[li], labelToken);
            let addr = sameLine;
            if (!addr || addr.length < 6) {
              const next = collected.lines[li + 1] || '';
              if (next && !looksLikeNewLabel(next) && looksAddressy(next)) {
                addr = addr ? `${addr}\n${next.trim()}` : next.trim();
              }
            } else {
              const next = collected.lines[li + 1] || '';
              if (next && !looksLikeNewLabel(next) && looksAddressy(next)) {
                addr = `${addr}\n${next.trim()}`;
              }
            }
            if (addr && addr.trim()) {
              out.address = addr.trim();
            }
            break;
          }
        }
      }

      if (!out.address) {
        for (let i = 0; i < collected.lines.length; i++) {
          const L = collected.lines[i];
          if (/,/.test(L) && UK_POSTCODE.test(stripAccents(L.toUpperCase()))) {
            const bucket: string[] = [];
            for (let k = Math.max(0, i - 2); k <= i; k++) {
              const part = collected.lines[k];
              if (!part.trim()) continue;
              if (k < i && !( /,/.test(part) || STREET_WORDS.test(part) )) continue;
              bucket.push(part.trim());
            }
            if (bucket.length) {
              out.address = bucket.join('\n');
              break;
            }
          }
        }
      }

      if (!out.address) {
        const idxPc = collected.lines.findIndex((l) => UK_POSTCODE.test(stripAccents(l.toUpperCase())));
        if (idxPc >= 0) {
          const start = Math.max(0, idxPc - 3);
          out.address = collected.lines.slice(start, idxPc + 1).join('\n');
        } else {
          const hit = collected.lines.findIndex((l) => STREET_WORDS.test(l));
          if (hit >= 0) {
            const start = Math.max(0, hit - 2);
            out.address = collected.lines
              .slice(start, Math.min(collected.lines.length, hit + 3))
              .join('\n');
          }
        }
      }

      // ✅ Issuing authority (DVLA/DVA) — restore
      if (!out.issuingAuthority) {
        const hasDVLA = collected.lines.some((l) => /DVLA/i.test(l));
        const hasDVA = collected.lines.some((l) => /\bDVA\b/i.test(l));
        if (hasDVLA) out.issuingAuthority = 'DVLA';
        else if (hasDVA) out.issuingAuthority = 'DVA';
      }

      // ✅ Issuing country for UK licence — restore
      if (!out.issuingCountry) out.issuingCountry = 'GB';

      // ✅ DOB fallback (age window) — restore and accept dot-separated dates
      if (!out.dob) {
        const candidates: string[] = [];
        for (const line of collected.lines) {
          const parts = line.match(
            /\b(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4}|\d{1,2}\s+[A-Za-zÉÛéû]{3,}\s+\d{2,4}|\d{4}-\d{2}-\d{2})\b/g
          );
          if (parts) candidates.push(...parts);
        }
        const now = new Date();
        for (const c of candidates) {
          const { iso } = extractIsoDateFromString(c);
          if (!iso) continue;
          const dt = new Date(iso);
          const age =
            now.getFullYear() -
            dt.getFullYear() -
            (now.getMonth() < dt.getMonth() ||
            (now.getMonth() === dt.getMonth() && now.getDate() < dt.getDate())
              ? 1
              : 0);
          if (age >= 16 && age <= 120) {
            out.dob = iso;
            out.dobRaw = iso;
            break;
          }
        }
      }
    }

    // Build full name if still missing (common path)
    if (!out.fullName && (out.firstWithTitle || out.surname)) {
      const first = out.firstWithTitle || '';
      const last = out.surname || '';
      const full = [first, last].map((s) => (s || '').trim()).filter(Boolean).join(' ');
      out.fullName = full || null;
    }

    // Final debug footer
    out._debug = {
      ...(out._debug || {}),
      blockTypeCounts,
      wordCount: collected.words.length,
      lineSample: collected.lines.slice(0, 80),
      queryResults: collected.queryResultsMap,
      calls: collected.callsMeta,
      chosenFallbacks: chosen,
    };

    slog('extracted summary', {
      documentId: out.documentId,
      dob: out.dob,
      validFrom: out.validFrom,
      expiry: out.expiry,
      issuingCountry: out.issuingCountry,
      issuingAuthority: out.issuingAuthority,
      addressPreview: out.address ? out.address.split('\n')[0].slice(0, 120) : 'none',
      fullName: out.fullName,
      documentType: out.documentType,
    });
    slog('end');

    return out;
  },
});
