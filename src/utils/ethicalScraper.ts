import { ScraperConfig, RegistryRecord, ScraperLogEntry, HttpTestResult } from '../types';
import { sha256Hash } from './crypto';

export async function testHttpEndpoint(url: string, corsProxy?: string): Promise<HttpTestResult> {
  const targetUrl = corsProxy ? `${corsProxy}${encodeURIComponent(url)}` : url;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const rawBody = await res.text();
    const headersMap: Record<string, string> = {};
    res.headers.forEach((val, key) => { headersMap[key] = val; });
    return {
      url,
      status: res.status,
      statusText: res.statusText,
      headers: headersMap,
      byteSize: new Blob([rawBody]).size,
      contentType: res.headers.get('content-type') || 'unknown',
      rawBody: rawBody.slice(0, 8000),
      corsBlocked: false,
      parsedRecordsCount: 0,
    };
  } catch (err: any) {
    const blocked = err.name === 'AbortError' || String(err).includes('Failed to fetch') || String(err).includes('NetworkError');
    return {
      url,
      status: blocked ? 0 : 500,
      statusText: blocked ? 'Blocked or network error' : 'Fetch failed',
      headers: {},
      byteSize: 0,
      contentType: 'none',
      rawBody: blocked
        ? `Could not load ${url} from this browser. Add records in Vault, or use a proxy you control.`
        : `Error: ${String(err)}`,
      corsBlocked: blocked,
      parsedRecordsCount: 0,
    };
  }
}

function pickText(el: Element, selector: string): string {
  const found = selector ? el.querySelector(selector) : el;
  return (found?.textContent || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240);
}

function parseHtmlRecords(html: string, config: ScraperConfig): Array<Partial<RegistryRecord>> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = Array.from(doc.querySelectorAll(config.selectors.recordContainer || 'tr'));
  const out: Array<Partial<RegistryRecord>> = [];
  for (const node of nodes.slice(0, 50)) {
    const name = pickText(node, config.selectors.fullName);
    if (!name || name.length < 3) continue;
    if (/^name$/i.test(name) || /select|search|login/i.test(name)) continue;
    out.push({
      fullName: name,
      phone: pickText(node, config.selectors.phone),
      address: pickText(node, config.selectors.address),
      jurisdiction: pickText(node, config.selectors.jurisdiction) || config.stateCode,
      offenseSummary: pickText(node, config.selectors.offense),
      convictionYear: Number.parseInt(pickText(node, config.selectors.convictionYear), 10) || new Date().getFullYear(),
    });
  }
  return out;
}

function walkPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function parseJsonRecords(raw: string, config: ScraperConfig): Array<Partial<RegistryRecord>> {
  try {
    const parsed = JSON.parse(raw);
    const list = walkPath(parsed, config.selectors.recordContainer);
    const arr = Array.isArray(list) ? list : Array.isArray(parsed) ? parsed : [];
    return arr.slice(0, 50).map((item: any) => ({
      fullName: String(item[config.selectors.fullName] ?? item.name ?? item.fullName ?? ''),
      phone: String(item[config.selectors.phone] ?? item.phone ?? ''),
      address: String(item[config.selectors.address] ?? item.address ?? ''),
      jurisdiction: String(item[config.selectors.jurisdiction] ?? config.stateCode),
      offenseSummary: String(item[config.selectors.offense] ?? item.offense ?? ''),
      convictionYear: Number(item[config.selectors.convictionYear] ?? item.year) || new Date().getFullYear(),
    })).filter((r) => r.fullName && r.fullName.length > 2);
  } catch {
    return [];
  }
}

export async function executeScraperJob(
  config: ScraperConfig,
  onLog: (log: ScraperLogEntry) => void,
  onProgress?: (percent: number) => void
): Promise<{ newRecords: RegistryRecord[]; totalBytes: number }> {
  const newRecords: RegistryRecord[] = [];
  onLog({
    id: `log-${Date.now()}-1`,
    timestamp: new Date().toISOString(),
    scraperId: config.id,
    scraperName: config.name,
    level: 'INFO',
    message: `Starting live fetch: ${config.targetUrl}`,
  });
  if (onProgress) onProgress(20);
  const httpRes = await testHttpEndpoint(config.targetUrl, config.useCorsProxy ? config.corsProxyUrl : undefined);
  if (httpRes.corsBlocked || httpRes.status === 0 || httpRes.status < 200 || httpRes.status >= 300) {
    onLog({
      id: `log-${Date.now()}-err`,
      timestamp: new Date().toISOString(),
      scraperId: config.id,
      scraperName: config.name,
      level: 'ERROR',
      message: httpRes.rawBody || `HTTP ${httpRes.status}. No records saved.`,
      statusCode: httpRes.status,
    });
    if (onProgress) onProgress(100);
    return { newRecords: [], totalBytes: httpRes.byteSize };
  }
  onLog({
    id: `log-${Date.now()}-ok`,
    timestamp: new Date().toISOString(),
    scraperId: config.id,
    scraperName: config.name,
    level: 'SUCCESS',
    message: `HTTP ${httpRes.status} — ${(httpRes.byteSize / 1024).toFixed(1)} KB.`,
    statusCode: httpRes.status,
    bytesReceived: httpRes.byteSize,
  });
  if (onProgress) onProgress(70);
  const parsed = config.sourceType === 'JSON_API'
    ? parseJsonRecords(httpRes.rawBody, config)
    : parseHtmlRecords(httpRes.rawBody, config);
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const name = item.fullName || '';
    let phoneVal = item.phone || '';
    let addrVal = item.address || '';
    if (config.ethicalGuardrails.autoRedactPhone && phoneVal) phoneVal = phoneVal.replace(/\d{3}(?=\D*\d{4})/, '***');
    if (config.ethicalGuardrails.autoRedactAddress && addrVal) addrVal = addrVal.replace(/^\d+/, '***');
    const piiHash = await sha256Hash(`${name}:${phoneVal}:${addrVal}`);
    newRecords.push({
      id: `REG-${Date.now()}-${i + 1}`,
      externalId: `${config.stateCode}-${i + 1}`,
      fullName: name,
      phone: phoneVal,
      address: addrVal,
      city: '',
      state: config.stateCode,
      zipCode: '',
      jurisdiction: item.jurisdiction || config.stateCode,
      tier: 'Unclassified',
      offenseSummary: item.offenseSummary || '',
      convictionYear: item.convictionYear || new Date().getFullYear(),
      registrationStatus: 'Active',
      scrapedAt: new Date().toISOString(),
      sourceUrl: config.targetUrl,
      isEncrypted: true,
      encryptedData: '',
      piiHash,
      complianceStatus: config.ethicalGuardrails.fcraAcknowledged ? 'FCRA Compliant' : 'Audit Pending',
    });
  }
  onLog({
    id: `log-${Date.now()}-done`,
    timestamp: new Date().toISOString(),
    scraperId: config.id,
    scraperName: config.name,
    level: newRecords.length ? 'SUCCESS' : 'WARN',
    message: newRecords.length ? `Saved ${newRecords.length} live row(s).` : 'Page loaded but no rows matched. Adjust selectors or add by hand.',
    recordsExtracted: newRecords.length,
  });
  if (onProgress) onProgress(100);
  return { newRecords, totalBytes: httpRes.byteSize };
}
