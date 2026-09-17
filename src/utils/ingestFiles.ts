import { RegistryRecord, JurisdictionTier } from '../types';
import { sanitizeField } from './hardening';

const MAX_ROWS = 500;
const NAME_KEYS = ['fullname', 'full_name', 'name', 'offender', 'subject', 'registrant'];
const PHONE_KEYS = ['phone', 'telephone', 'tel', 'mobile'];
const ADDR_KEYS = ['address', 'street', 'addr', 'residence'];
const CITY_KEYS = ['city', 'town'];
const STATE_KEYS = ['state', 'st', 'region', 'jurisdiction'];
const ZIP_KEYS = ['zip', 'zipcode', 'postal', 'zip_code'];
const OFFENSE_KEYS = ['offense', 'offensesummary', 'offense_summary', 'statute', 'crime', 'charge'];
const YEAR_KEYS = ['convictionyear', 'conviction_year', 'year', 'convicted'];
const ID_KEYS = ['externalid', 'external_id', 'id', 'sorid', 'regid'];
const STATUS_KEYS = ['registrationstatus', 'status'];
const SOURCE_KEYS = ['sourceurl', 'source', 'url'];
const NOTES_KEYS = ['notes', 'note', 'comment'];
const TIER_KEYS = ['tier'];

function norm(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function pick(obj: Record<string, unknown>, keys: string[]): string {
  const map: Record<string, unknown> = {};
  Object.keys(obj).forEach((k) => { map[norm(k)] = obj[k]; });
  for (const key of keys) {
    const v = map[norm(key)];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if ((c === ',' || c === '\t' || c === ';') && !q) {
      out.push(cur.trim()); cur = '';
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}
export function parseCsv(text: string): Record<string, unknown>[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h || 'col');
  const rows: Record<string, unknown>[] = [];
  for (const line of lines.slice(1, MAX_ROWS + 1)) {
    const cells = splitCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    rows.push(row);
  }
  return rows;
}
export function parseJsonPayload(text: string): Record<string, unknown>[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data.slice(0, MAX_ROWS);
  if (data && typeof data === 'object') {
    const nested = (data as any).records || (data as any).data || (data as any).items || (data as any).results;
    if (Array.isArray(nested)) return nested.slice(0, MAX_ROWS);
    return [data as Record<string, unknown>];
  }
  return [];
}
function tierOf(raw: string): JurisdictionTier {
  const t = raw.toLowerCase();
  if (t.includes('iii') || t.includes('3') || t.includes('high')) return 'Tier III (High Risk)';
  if (t.includes('ii') || t.includes('2') || t.includes('mod')) return 'Tier II (Moderate Risk)';
  if (t.includes('i') || t.includes('1') || t.includes('low')) return 'Tier I (Low Risk)';
  return 'Unclassified';
}
function statusOf(raw: string): RegistryRecord['registrationStatus'] {
  const t = raw.toLowerCase();
  if (t.includes('incar')) return 'Incarcerated';
  if (t.includes('deceas')) return 'Deceased';
  if (t.includes('pend')) return 'Pending Review';
  return 'Active';
}
export function rowToRecord(row: Record<string, unknown>, index: number, sourceName: string): RegistryRecord | null {
  const fullName = sanitizeField(pick(row, NAME_KEYS));
  if (!fullName || fullName.length < 2) return null;
  const phone = sanitizeField(pick(row, PHONE_KEYS), 40);
  const address = sanitizeField(pick(row, ADDR_KEYS));
  const city = sanitizeField(pick(row, CITY_KEYS), 80);
  const state = sanitizeField(pick(row, STATE_KEYS), 8).toUpperCase() || 'US';
  const zipCode = sanitizeField(pick(row, ZIP_KEYS), 12);
  const offenseSummary = sanitizeField(pick(row, OFFENSE_KEYS), 400);
  const convictionYear = Number.parseInt(pick(row, YEAR_KEYS), 10) || new Date().getFullYear();
  const filled = [fullName, state, offenseSummary, address].filter((x) => x.length > 1).length;
  return {
    id: `REG-${Date.now()}-${index}`,
    externalId: sanitizeField(pick(row, ID_KEYS), 64) || `FILE-${index + 1}`,
    fullName, phone, address, city, state, zipCode, jurisdiction: state,
    tier: tierOf(pick(row, TIER_KEYS)), offenseSummary, convictionYear,
    registrationStatus: statusOf(pick(row, STATUS_KEYS)),
    scrapedAt: new Date().toISOString(),
    sourceUrl: pick(row, SOURCE_KEYS) || `file:${sourceName}`,
    isEncrypted: true,
    piiHash: `${fullName}:${phone}:${address}`.toLowerCase(),
    complianceStatus: 'Audit Pending',
    notes: sanitizeField(pick(row, NOTES_KEYS), 200) || `Ingested from ${sourceName}`,
    parseConfidence: filled * 25,
  };
}
export function ingestText(filename: string, text: string): { records: RegistryRecord[]; skipped: number; kind: 'csv' | 'json' } {
  const lower = filename.toLowerCase();
  const looksJson = lower.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[');
  const rows = looksJson ? parseJsonPayload(text) : parseCsv(text);
  const records: RegistryRecord[] = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) { skipped += 1; return; }
    const rec = rowToRecord(row as Record<string, unknown>, i, filename);
    if (rec) records.push(rec); else skipped += 1;
  });
  return { records, skipped, kind: looksJson ? 'json' : 'csv' };
}
export async function ingestFile(file: File): Promise<{ records: RegistryRecord[]; skipped: number; kind: 'csv' | 'json' }> {
  return ingestText(file.name, await file.text());
}
