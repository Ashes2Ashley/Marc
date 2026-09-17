/**
 * Real Web Crypto API AES-256-GCM Encryption Engine
 * Provides client-side field and record-level encryption, key derivation, and PII hashing.
 */

// Generate a random 256-bit AES key
export async function generateMasterKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Derive AES-GCM key from user passphrase using PBKDF2
export async function deriveKeyFromPassphrase(passphrase: string, saltHex?: string): Promise<{ key: CryptoKey; saltHex: string }> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  let saltBytes: Uint8Array;
  if (saltHex) {
    saltBytes = hexToBytes(saltHex);
  } else {
    saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  }

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return {
    key: derivedKey,
    saltHex: bytesToHex(saltBytes),
  };
}

// Encrypt plaintext string using AES-GCM with a random IV
export async function encryptText(plaintext: string, key: CryptoKey): Promise<{ ciphertextBase64: string; ivHex: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const ciphertextBase64 = arrayBufferToBase64(encryptedBuffer);
  return {
    ciphertextBase64,
    ivHex: bytesToHex(iv),
  };
}

// Decrypt AES-GCM payload
export async function decryptText(ciphertextBase64: string, ivHex: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  const encryptedBuffer = base64ToArrayBuffer(ciphertextBase64);
  const iv = hexToBytes(ivHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedBuffer
  );

  return decoder.decode(decryptedBuffer);
}

// Compute SHA-256 hash for PII deduplication & anonymized referencing
export async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Compute raw exact SHA-256 hash without lowercasing/trimming (for file integrity checks)
export async function sha256RawHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export function escapeCsvField(val: string | number): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  const clean = str.replace(/"/g, '""');
  return `"${clean}"`;
}

// Export records as an encrypted CSV file package using AES-256-GCM
export async function exportEncryptedCsv(
  records: any[],
  passphrase: string,
  unmasked: boolean = false,
  customMasks?: { maskNames?: boolean; maskPhones?: boolean; maskAddresses?: boolean }
): Promise<{ filename: string; mimeType: string; content: string; sha256Checksum: string; saltHex: string; ivHex: string }> {
  const timestamp = new Date().toISOString();
  const fileTimestamp = timestamp.replace(/[:.]/g, '-');

  const headers = [
    'ID', 'External_ID', 'Full_Name', 'Phone', 'Address', 'City', 'State',
    'ZipCode', 'Jurisdiction', 'Risk_Tier', 'Offense_Summary', 'Conviction_Year',
    'Status', 'Compliance_Status', 'PII_Hash_SHA256', 'Source_URL'
  ];

  const maskNameFlag = customMasks?.maskNames !== undefined ? customMasks.maskNames : !unmasked;
  const maskPhoneFlag = customMasks?.maskPhones !== undefined ? customMasks.maskPhones : !unmasked;
  const maskAddressFlag = customMasks?.maskAddresses !== undefined ? customMasks.maskAddresses : !unmasked;

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.externalId),
    escapeCsvField(maskNameFlag ? maskName(r.fullName) : r.fullName),
    escapeCsvField(maskPhoneFlag ? maskPhone(r.phone) : r.phone),
    escapeCsvField(maskAddressFlag ? maskAddress(r.address) : r.address),
    escapeCsvField(r.city),
    escapeCsvField(r.state),
    escapeCsvField(r.zipCode),
    escapeCsvField(r.jurisdiction),
    escapeCsvField(r.tier),
    escapeCsvField(r.offenseSummary),
    r.convictionYear,
    escapeCsvField(r.registrationStatus),
    escapeCsvField(r.complianceStatus),
    escapeCsvField(r.piiHash),
    escapeCsvField(r.sourceUrl),
  ]);

  const rawCsv = [
    '# FCRA DISCLAIMER: Official public safety research dataset container. Do not evaluate for credit/housing.',
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\n');

  // Derive key via PBKDF2 with 100,000 iterations
  const { key, saltHex } = await deriveKeyFromPassphrase(passphrase);

  // Compute raw payload integrity checksum
  const sha256Checksum = await sha256RawHash(rawCsv);

  // Encrypt payload using AES-256-GCM
  const { ciphertextBase64, ivHex } = await encryptText(rawCsv, key);

  // Build structured encrypted envelope package
  const envelope = [
    '# ===== PUBLIC REGISTRY AES-256-GCM ENCRYPTED CSV VAULT PACKAGE =====',
    `# FORMAT_VERSION: 2.0-GCM`,
    `# ALGORITHM: AES-256-GCM (PBKDF2-HMAC-SHA256)`,
    `# ITERATIONS: 100000`,
    `# EXPORT_TIMESTAMP: ${timestamp}`,
    `# SALT_HEX: ${saltHex}`,
    `# IV_HEX: ${ivHex}`,
    `# RECORD_COUNT: ${records.length}`,
    `# UNMASKED_PII: ${unmasked}`,
    `# SHA256_PAYLOAD_HASH: ${sha256Checksum}`,
    `# DISCLAIMER: FCRA COMPLIANT ENCRYPTED DATA CONTAINER`,
    '# ====================================================================',
    'ENCRYPTED_CIPHERTEXT_BASE64:',
    ciphertextBase64
  ].join('\n');

  return {
    filename: `registry_vault_encrypted_${fileTimestamp}.enc.csv`,
    mimeType: 'text/csv',
    content: envelope,
    sha256Checksum,
    saltHex,
    ivHex,
  };
}

// Decrypt encrypted CSV envelope back into readable CSV with integrity verification
export async function decryptEncryptedCsvEnvelope(
  envelopeContent: string,
  passphrase: string
): Promise<{
  rawCsv: string;
  metadata: {
    formatVersion: string;
    algorithm: string;
    iterations: number;
    exportTimestamp: string;
    recordCount: number;
    unmaskedPii: boolean;
    sha256PayloadHash: string;
    saltHex: string;
    ivHex: string;
  };
  checksumValid: boolean;
  computedHash: string;
}> {
  const lines = envelopeContent.split('\n');
  let saltHex = '';
  let ivHex = '';
  let formatVersion = '2.0-GCM';
  let algorithm = 'AES-256-GCM';
  let iterations = 100000;
  let exportTimestamp = '';
  let recordCount = 0;
  let unmaskedPii = false;
  let sha256PayloadHash = '';
  let ciphertextBase64 = '';

  let inCiphertext = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# SALT_HEX:')) {
      saltHex = trimmed.replace('# SALT_HEX:', '').trim();
    } else if (trimmed.startsWith('# IV_HEX:')) {
      ivHex = trimmed.replace('# IV_HEX:', '').trim();
    } else if (trimmed.startsWith('# FORMAT_VERSION:')) {
      formatVersion = trimmed.replace('# FORMAT_VERSION:', '').trim();
    } else if (trimmed.startsWith('# ALGORITHM:')) {
      algorithm = trimmed.replace('# ALGORITHM:', '').trim();
    } else if (trimmed.startsWith('# ITERATIONS:')) {
      iterations = parseInt(trimmed.replace('# ITERATIONS:', '').trim()) || 100000;
    } else if (trimmed.startsWith('# EXPORT_TIMESTAMP:')) {
      exportTimestamp = trimmed.replace('# EXPORT_TIMESTAMP:', '').trim();
    } else if (trimmed.startsWith('# RECORD_COUNT:')) {
      recordCount = parseInt(trimmed.replace('# RECORD_COUNT:', '').trim()) || 0;
    } else if (trimmed.startsWith('# UNMASKED_PII:')) {
      unmaskedPii = trimmed.replace('# UNMASKED_PII:', '').trim() === 'true';
    } else if (trimmed.startsWith('# SHA256_PAYLOAD_HASH:')) {
      sha256PayloadHash = trimmed.replace('# SHA256_PAYLOAD_HASH:', '').trim();
    } else if (trimmed === 'ENCRYPTED_CIPHERTEXT_BASE64:') {
      inCiphertext = true;
    } else if (inCiphertext && trimmed && !trimmed.startsWith('#')) {
      ciphertextBase64 += trimmed;
    }
  }

  // Fallback if raw base64 string provided without headers
  if (!ciphertextBase64 && !envelopeContent.includes('ENCRYPTED_CIPHERTEXT_BASE64:')) {
    ciphertextBase64 = envelopeContent.trim();
  }

  if (!saltHex || !ivHex) {
    throw new Error('Missing SALT_HEX or IV_HEX in encrypted CSV metadata header.');
  }

  // Derive key from passphrase using saltHex
  const { key } = await deriveKeyFromPassphrase(passphrase, saltHex);

  // Decrypt payload
  const rawCsv = await decryptText(ciphertextBase64, ivHex, key);

  // Verify SHA-256 checksum
  const computedHash = await sha256RawHash(rawCsv);
  const checksumValid = !sha256PayloadHash || computedHash.toLowerCase() === sha256PayloadHash.toLowerCase();

  return {
    rawCsv,
    metadata: {
      formatVersion,
      algorithm,
      iterations,
      exportTimestamp,
      recordCount,
      unmaskedPii,
      sha256PayloadHash,
      saltHex,
      ivHex,
    },
    checksumValid,
    computedHash,
  };
}

// Masking helpers for display compliance
export function maskName(name: string): string {
  if (!name) return '***';
  const parts = name.split(' ');
  return parts.map(p => (p.length > 1 ? p[0] + '***' : p)).join(' ');
}

export function maskPhone(phone: string): string {
  if (!phone) return '***-***-****';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    return `+1 (***) ***-${last4}`;
  }
  return '***-***-****';
}

export function maskAddress(address: string): string {
  if (!address) return '*** Block [Redacted]';
  const parts = address.split(' ');
  if (parts.length > 2) {
    return `${parts[0]} *** St [Redacted]`;
  }
  return '*** [Redacted Address]';
}

// Helpers for Uint8Array / Hex / Base64 conversion
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
