const FAIL_KEY = 'marc_unlock_fails';
const LOCK_UNTIL_KEY = 'marc_unlock_until';
const AUDIT_KEY = 'marc_sec_audit';
const SEAL_KEY = 'marc_vault_seal';
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export function sanitizeField(raw: string, max = 240): string {
  return String(raw || '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function readFails(): number {
  return Number(localStorage.getItem(FAIL_KEY) || 0);
}

export function lockRemainingMs(): number {
  const until = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
  return Math.max(0, until - Date.now());
}

export function isUnlockLocked(): boolean {
  return lockRemainingMs() > 0;
}

export function recordUnlockFail(): { locked: boolean; fails: number; remainingMs: number } {
  const fails = readFails() + 1;
  localStorage.setItem(FAIL_KEY, String(fails));
  if (fails >= MAX_FAILS) localStorage.setItem(LOCK_UNTIL_KEY, String(Date.now() + LOCK_MS));
  pushAudit('UNLOCK_FAIL', `${fails} failed attempt(s)`);
  return { locked: isUnlockLocked(), fails, remainingMs: lockRemainingMs() };
}

export function recordUnlockOk(): void {
  localStorage.removeItem(FAIL_KEY);
  localStorage.removeItem(LOCK_UNTIL_KEY);
  pushAudit('UNLOCK_OK', 'Vault opened');
}

export function secureWipe(): void {
  ['ethical_registry_records', 'ethical_scraper_configs', FAIL_KEY, LOCK_UNTIL_KEY, SEAL_KEY].forEach((k) => {
    try { localStorage.setItem(k, '0'.repeat(64)); localStorage.removeItem(k); } catch { /* ignore */ }
  });
  pushAudit('SECURE_WIPE', 'Local vault keys overwritten then removed');
}

export async function sealVault(hashes: string[]): Promise<string> {
  const payload = JSON.stringify([...hashes].sort());
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(SEAL_KEY, hex);
  pushAudit('SEAL', hex.slice(0, 16));
  return hex;
}

export async function verifyVaultSeal(hashes: string[]): Promise<boolean> {
  const prev = localStorage.getItem(SEAL_KEY);
  if (!prev) return true;
  const payload = JSON.stringify([...hashes].sort());
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const ok = hex === prev;
  pushAudit(ok ? 'SEAL_OK' : 'SEAL_BREAK', hex.slice(0, 16));
  return ok;
}

export function pushAudit(event: string, detail: string): void {
  const row = { t: new Date().toISOString(), event, detail };
  try {
    const prev = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    localStorage.setItem(AUDIT_KEY, JSON.stringify([row, ...(Array.isArray(prev) ? prev : [])].slice(0, 50)));
  } catch {
    localStorage.setItem(AUDIT_KEY, JSON.stringify([row]));
  }
}

export function readAudit(): { t: string; event: string; detail: string }[] {
  try {
    const prev = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return Array.isArray(prev) ? prev : [];
  } catch { return []; }
}

export const HARDENING = { maxFails: MAX_FAILS, lockMinutes: LOCK_MS / 60000, maxRowsPerJob: 25 };
