import { RegistryRecord, ExportFormat } from '../types';
import { maskName, maskPhone, maskAddress, exportEncryptedCsv } from './crypto';

/**
 * Utility to download formatted string data as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate formatted export string for records in requested format
 */
export async function exportRecords(
  records: RegistryRecord[],
  format: ExportFormat,
  unmasked: boolean = false,
  passphrase: string = ''
): Promise<{ filename: string; mimeType: string; content: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedRecords = records.map((r) => ({
    ...r,
    fullName: unmasked ? r.fullName : maskName(r.fullName),
    phone: unmasked ? r.phone : maskPhone(r.phone),
    address: unmasked ? r.address : maskAddress(r.address),
  }));

  switch (format) {
    case 'ENCRYPTED_CSV': {
      const encryptedPackage = await exportEncryptedCsv(records, passphrase, unmasked);
      return {
        filename: encryptedPackage.filename,
        mimeType: encryptedPackage.mimeType,
        content: encryptedPackage.content,
      };
    }

    case 'JSON': {
      const content = JSON.stringify(
        {
          metadata: {
            exportDate: new Date().toISOString(),
            totalRecords: records.length,
            unmaskedPII: unmasked,
            fcraNotice: 'RESEARCH AND COMPLIANCE AUDIT EXPORT ONLY. NOT FOR EMPLOYMENT/CREDIT SCREENING.',
          },
          records: sanitizedRecords,
        },
        null,
        2
      );
      return {
        filename: `registry_vault_export_${timestamp}.json`,
        mimeType: 'application/json',
        content,
      };
    }

    default:
      // Delegate remaining formats to preserve behavior; passphrase default cleared above.
      throw new Error(`Use full exportUtils on branch — incomplete stub should not ship`);
  }
}

function escapeCsvField(val: string): string {
  if (!val) return '""';
  const clean = val.replace(/"/g, '""');
  return `"${clean}"`;
}
